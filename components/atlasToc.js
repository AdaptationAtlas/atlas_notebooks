class AtlasToc extends HTMLElement {
  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    const title = this.getAttribute("title") || "Contents";
    const headingLevels = (this.getAttribute("heading-levels") || "1")
      .split(",")
      .map(level => parseInt(level.trim(), 10))
      .filter(level => Number.isInteger(level) && level >= 1 && level <= 6);
    const idsToIgnore = (this.getAttribute("ids-to-ignore") || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);

    this.style.display = "none";
    this._panel = document.createElement("div");
    this._panel.className = "atlas-toc atlas-toc-floating";
    this._panel.innerHTML = `
      <span class="atlas-toc-heading">${title}</span>
      <div class="atlas-toc-links"></div>
    `;
    document.body.appendChild(this._panel);

    this._linksContainer = this._panel.querySelector(".atlas-toc-links");
    this._headingLevels = headingLevels.length ? headingLevels : [1];
    this._ignoredIdSet = new Set(idsToIgnore);
    this._sections = [];
    this._links = [];
    this._sectionIndexMap = new Map();
    this._activeIndex = null;
    this._usingScrollFallback = false;

    const slugify = text =>
      text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");

    this._updateHeadingList = () => {
      const selector = this._headingLevels.map(level => `h${level}`).join(", ");
      const headings = document.querySelectorAll(selector);
      const container = document.createElement("div");

      this._sections = [];
      this._links = [];
      this._sectionIndexMap = new Map();
      this._activeIndex = null;

      headings.forEach(heading => {
        const headingText = heading.textContent.trim();
        let id = heading.id;

        if (!id) {
          id = slugify(headingText);
          let suffix = 1;
          let finalId = id;
          while (document.getElementById(finalId)) {
            finalId = `${id}-${suffix++}`;
          }
          heading.id = finalId;
          id = finalId;
        }

        if (this._ignoredIdSet.has(id)) return;

        const link = document.createElement("a");
        link.href = `#${id}`;
        link.textContent = headingText || "[Empty Heading]";
        link.classList.add("toc-link");

        container.appendChild(link);
        this._links.push(link);
        this._sections.push(heading);
        this._sectionIndexMap.set(heading, this._sections.length - 1);
      });

      this._linksContainer.innerHTML = "";
      this._linksContainer.appendChild(container);
      this._observeSections();
      if (typeof this._layout === "function") this._layout();
    };

    this._setActiveLink = activeLink => {
      this._links.forEach(link => link.classList.remove("active"));
      if (activeLink) activeLink.classList.add("active");
    };

    this._setActiveIndex = index => {
      if (index < 0 || index >= this._links.length) return;
      if (this._activeIndex === index) return;
      this._activeIndex = index;
      this._setActiveLink(this._links[index]);
    };

    this._isNearPageBottom = () => {
      const threshold = 24;
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
    };

    this._updateBottomState = () => {
      if (!this._links.length) return;
      if (this._isNearPageBottom()) {
        this._setActiveIndex(this._links.length - 1);
      }
    };

    this._onScroll = () => {
      if (!this._sections.length) return;

      if (this._isNearPageBottom()) {
        this._setActiveIndex(this._links.length - 1);
        return;
      }

      let closestIndex = 0;
      let closestDistance = Infinity;

      this._sections.forEach((section, index) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - 50);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      this._setActiveIndex(closestIndex);
    };

    this._enableScrollFallback = () => {
      if (this._usingScrollFallback) return;
      window.addEventListener("scroll", this._onScroll, { passive: true });
      this._usingScrollFallback = true;
    };

    this._disableScrollFallback = () => {
      if (!this._usingScrollFallback) return;
      window.removeEventListener("scroll", this._onScroll);
      this._usingScrollFallback = false;
    };

    this._observeSections = () => {
      if (this._intersectionObserver) {
        this._intersectionObserver.disconnect();
        this._intersectionObserver = null;
      }

      if (!this._sections.length) return;

      if (!("IntersectionObserver" in window)) {
        this._enableScrollFallback();
        this._onScroll();
        return;
      }

      this._disableScrollFallback();
      this._intersectionObserver = new IntersectionObserver(
        entries => {
          let bestIndex = this._activeIndex ?? 0;
          let bestScore = -Infinity;

          entries.forEach(entry => {
            const index = this._sectionIndexMap.get(entry.target);
            if (index === undefined || !entry.isIntersecting) return;

            const offsetScore = 1 - Math.min(Math.abs(entry.boundingClientRect.top - 80) / 800, 1);
            const score = entry.intersectionRatio + offsetScore;

            if (score > bestScore) {
              bestScore = score;
              bestIndex = index;
            }
          });

          if (bestScore === -Infinity) return;

          if (this._isNearPageBottom()) {
            this._setActiveIndex(this._links.length - 1);
            return;
          }

          this._setActiveIndex(bestIndex);
        },
        {
          root: null,
          rootMargin: "-80px 0px -65% 0px",
          threshold: [0, 0.1, 0.25, 0.5, 1],
        }
      );

      this._sections.forEach(section => this._intersectionObserver.observe(section));
      if (this._activeIndex === null && this._links.length) this._setActiveIndex(0);
    };

    this._observer = new MutationObserver(mutationsList => {
      let needsUpdate = false;

      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const relevantNodes = [...mutation.addedNodes, ...mutation.removedNodes];
          if (
            relevantNodes.some(node => {
              if (node.nodeType !== 1) return false;
              return this._headingLevels.some(
                level => node.matches(`h${level}`) || node.querySelector(`h${level}`)
              );
            })
          ) {
            needsUpdate = true;
            break;
          }
        } else if (mutation.type === "characterData" && mutation.target.parentElement) {
          const isRelevantHeading = this._headingLevels.some(level =>
            mutation.target.parentElement.matches(`h${level}`)
          );
          if (isRelevantHeading) {
            needsUpdate = true;
            break;
          }
        }
      }

      if (needsUpdate) requestAnimationFrame(this._updateHeadingList);
    });

    this._observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    this._updateHeadingList();
    window.addEventListener("scroll", this._updateBottomState, { passive: true });
    this._layout = () => {
      if (!this._panel) return;

      const content = document.getElementById("quarto-document-content");
      if (!content) {
        this._panel.style.display = "none";
        return;
      }

      const rect = content.getBoundingClientRect();
      const gap = 24;
      const minWidth = 180;
      const maxWidth = 280;
      const available = rect.left - gap - 8;

      if (available < minWidth || window.innerWidth <= 900) {
        this._panel.style.display = "none";
        return;
      }

      const width = Math.min(maxWidth, available);
      this._panel.style.display = "block";
      this._panel.style.left = `${Math.max(8, rect.left - gap - width)}px`;
      this._panel.style.top = "9rem";
      this._panel.style.width = `${width}px`;
    };
    this._onResize = () => this._layout();
    window.addEventListener("resize", this._onResize, { passive: true });
    this._layout();
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
    if (this._intersectionObserver) this._intersectionObserver.disconnect();
    if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    if (this._updateBottomState) window.removeEventListener("scroll", this._updateBottomState);
    if (this._onResize) window.removeEventListener("resize", this._onResize);
    if (this._panel && this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._initialized = false;
  }
}

customElements.define("atlas-toc", AtlasToc);
