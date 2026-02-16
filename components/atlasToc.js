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
      });

      this._linksContainer.innerHTML = "";
      this._linksContainer.appendChild(container);
      if (typeof this._layout === "function") this._layout();
      this._onScroll();
    };

    this._setActiveLink = activeLink => {
      this._links.forEach(link => link.classList.remove("active"));
      if (activeLink) activeLink.classList.add("active");
    };

    this._onScroll = () => {
      if (!this._sections.length) return;

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

      this._setActiveLink(this._links[closestIndex]);
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
    window.addEventListener("scroll", this._onScroll, { passive: true });
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
      const available = window.innerWidth - rect.right - gap - 8;

      if (available < minWidth || window.innerWidth <= 900) {
        this._panel.style.display = "none";
        return;
      }

      this._panel.style.display = "block";
      this._panel.style.left = `${rect.right + gap}px`;
      this._panel.style.top = "6rem";
      this._panel.style.width = `${Math.min(maxWidth, available)}px`;
    };
    this._onResize = () => this._layout();
    window.addEventListener("resize", this._onResize, { passive: true });
    this._layout();
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
    if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    if (this._onResize) window.removeEventListener("resize", this._onResize);
    if (this._panel && this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._initialized = false;
  }
}

customElements.define("atlas-toc", AtlasToc);
