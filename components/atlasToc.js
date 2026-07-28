const CONTENT_SELECTORS = [
  "#quarto-document-content",
  "#observablehq-main",
  "main",
];

const TOC_LAYOUT = {
  breakpoint: 900,
  gap: 24,
  pageInset: 16,
  minRailWidth: 160,
  maxWidth: 280,
};

const HIDDEN_ANCESTOR_SELECTOR =
  "[hidden], [aria-hidden='true'], .hidden";

let atlasTocInstanceCount = 0;

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readConfig(element) {
  const headingLevels = parseList(
    element.getAttribute("heading-levels") || "1",
  )
    .map((level) => Number.parseInt(level, 10))
    .filter((level) => Number.isInteger(level) && level >= 1 && level <= 6);
  const fallbackSelector = (headingLevels.length ? headingLevels : [1])
    .map((level) => `h${level}`)
    .join(", ");

  return {
    heading:
      element.getAttribute("heading") ||
      element.getAttribute("title") ||
      "Contents",
    selector: element.getAttribute("selector")?.trim() || fallbackSelector,
    fallbackSelector,
    ignoredIds: new Set(parseList(element.getAttribute("ids-to-ignore"))),
    activeClass: element.getAttribute("active-class") || "active",
  };
}

function findContent() {
  for (const selector of CONTENT_SELECTORS) {
    const content = document.querySelector(selector);
    if (content) return content;
  }
  return null;
}

function validateSelector(root, selector, fallbackSelector) {
  try {
    root.querySelector(selector);
    return selector;
  } catch {
    console.warn(
      `Invalid atlas-toc selector "${selector}"; using "${fallbackSelector}".`,
    );
    return fallbackSelector;
  }
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

function ensureHeadingId(heading, headingText, parentSection) {
  if (heading.id) return heading.id;
  if (parentSection?.id) return parentSection.id;

  const baseId = slugify(headingText) || "section";
  const ownerDocument = heading.ownerDocument;
  let finalId = baseId;
  let suffix = 1;

  while (ownerDocument.getElementById(finalId)) {
    finalId = `${baseId}-${suffix++}`;
  }

  heading.id = finalId;
  return finalId;
}

function ancestorSectionIds(heading) {
  const ids = [];
  let section = heading.closest("section");

  while (section) {
    if (section.id) ids.push(section.id);
    section = section.parentElement?.closest("section") || null;
  }

  return ids;
}

function createHeadingRecord(heading, ignoredIds) {
  if (heading.closest(HIDDEN_ANCESTOR_SELECTOR)) return null;

  const headingText = heading.textContent.trim();
  const parentSection = heading.closest("section[id]");
  const id = ensureHeadingId(heading, headingText, parentSection);
  const ignoredValues = [
    id,
    heading.id,
    parentSection?.id,
    ...ancestorSectionIds(heading),
    headingText,
    ...heading.classList,
  ].filter(Boolean);

  if (ignoredValues.some((value) => ignoredIds.has(value))) return null;

  const levelMatch = heading.tagName.match(/^H([1-6])$/);
  return {
    heading,
    headingText,
    id,
    level: levelMatch ? Number(levelMatch[1]) : 1,
  };
}

function nodeContainsSelector(node, selector) {
  if (
    node.nodeType === Node.ELEMENT_NODE &&
    node.matches(selector)
  ) {
    return true;
  }
  return (
    typeof node.querySelector === "function" &&
    Boolean(node.querySelector(selector))
  );
}

class AtlasToc extends HTMLElement {
  constructor() {
    super();
    this._initialized = false;
    this._frames = new Map();
    this._entries = [];
    this._entryIndexByHeading = new Map();

    this._onToggle = this._onToggle.bind(this);
    this._onLinkClick = this._onLinkClick.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onPageScroll = this._onPageScroll.bind(this);
    this._onOverlayKeydown = this._onOverlayKeydown.bind(this);
    this._onDocumentPointerDown =
      this._onDocumentPointerDown.bind(this);
  }

  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this._config = readConfig(this);
    this._content = findContent();
    this._headingSelector = validateSelector(
      this._content || document,
      this._config.selector,
      this._config.fallbackSelector,
    );
    this._activeIndex = null;
    this._overlayMode = false;
    this._overlayOpen = false;
    this._observedContentWidth = null;

    this.style.display = "none";
    this._createUi();
    this._listen();
    this._observeContent();
    this._refreshHeadings();
    this._scheduleFrame("layout", () => this._layout());
  }

  disconnectedCallback() {
    if (!this._initialized) return;

    this._connectionEvents?.abort();
    this._mutationObserver?.disconnect();
    this._resizeObserver?.disconnect();
    this._intersectionObserver?.disconnect();
    this._cancelFrames();

    this._toggleButton?.remove();
    this._panel?.remove();
    this._entries = [];
    this._entryIndexByHeading.clear();
    this._content = null;
    this._initialized = false;
  }

  _createUi() {
    const panelId = `atlas-toc-panel-${++atlasTocInstanceCount}`;
    const headingId = `${panelId}-heading`;

    this._panel = document.createElement("nav");
    this._panel.className = "atlas-toc atlas-toc-floating";
    this._panel.id = panelId;
    this._panel.hidden = true;
    this._panel.tabIndex = -1;
    this._panel.setAttribute("aria-labelledby", headingId);

    const heading = document.createElement("span");
    heading.className = "atlas-toc-heading";
    heading.id = headingId;
    heading.textContent = this._config.heading;

    this._linksContainer = document.createElement("ol");
    this._linksContainer.className = "atlas-toc-links";
    this._panel.append(heading, this._linksContainer);

    this._toggleButton = document.createElement("button");
    this._toggleButton.type = "button";
    this._toggleButton.className = "atlas-toc-toggle";
    this._toggleButton.textContent = this._config.heading;
    this._toggleButton.hidden = true;
    this._toggleButton.setAttribute("aria-controls", panelId);
    this._toggleButton.setAttribute("aria-expanded", "false");

    document.body.append(this._panel, this._toggleButton);
  }

  _listen() {
    this._connectionEvents = new AbortController();
    const { signal } = this._connectionEvents;

    this._toggleButton.addEventListener("click", this._onToggle, {
      signal,
    });
    this._linksContainer.addEventListener("click", this._onLinkClick, {
      signal,
    });
    window.addEventListener("resize", this._onResize, {
      passive: true,
      signal,
    });
    window.addEventListener("scroll", this._onPageScroll, {
      passive: true,
      signal,
    });
    document.addEventListener("keydown", this._onOverlayKeydown, {
      signal,
    });
    document.addEventListener(
      "pointerdown",
      this._onDocumentPointerDown,
      { signal },
    );
  }

  _observeContent() {
    if (!this._content) return;

    this._mutationObserver = new MutationObserver((mutations) => {
      const headingsChanged = mutations.some((mutation) => {
        // Text filled into an existing heading (e.g. OJS inline expressions
        // resolving after initial render) — the mutation target sits inside
        // the heading rather than adding a heading node.
        const target =
          mutation.target.nodeType === Node.ELEMENT_NODE
            ? mutation.target
            : mutation.target.parentElement;
        if (target?.closest(this._headingSelector)) return true;

        return [...mutation.addedNodes, ...mutation.removedNodes].some(
          (node) => nodeContainsSelector(node, this._headingSelector),
        );
      });
      if (headingsChanged) {
        this._scheduleFrame("headings", () => this._refreshHeadings());
      }
    });
    this._mutationObserver.observe(this._content, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    if (!("ResizeObserver" in window)) return;
    this._resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (
        !Number.isFinite(width) ||
        (this._observedContentWidth !== null &&
          Math.abs(width - this._observedContentWidth) < 0.5)
      ) {
        return;
      }
      this._observedContentWidth = width;
      this._scheduleFrame("layout", () => this._layout());
    });
    this._resizeObserver.observe(this._content);
  }

  _refreshHeadings() {
    const headingRecords = this._content
      ? [...this._content.querySelectorAll(this._headingSelector)]
          .map((heading) =>
            createHeadingRecord(heading, this._config.ignoredIds),
          )
          .filter(Boolean)
      : [];
    const { entries, fragment } = this._buildEntries(headingRecords);

    this._entries = entries;
    this._entryIndexByHeading = new Map(
      entries.map(({ heading }, index) => [heading, index]),
    );
    this._activeIndex = null;
    this._linksContainer.replaceChildren(fragment);
    this._observeSections();
    this._scheduleFrame("layout", () => this._layout());
  }

  _buildEntries(headingRecords) {
    const baseLevel = headingRecords.length
      ? Math.min(...headingRecords.map(({ level }) => level))
      : 1;
    const fragment = document.createDocumentFragment();
    const parentStack = [];
    const entries = [];

    headingRecords.forEach((record, index) => {
      const depth = Math.max(0, record.level - baseLevel);
      let parentIndex = null;

      for (let parentDepth = depth - 1; parentDepth >= 0; parentDepth--) {
        if (parentStack[parentDepth] === undefined) continue;
        parentIndex = parentStack[parentDepth];
        break;
      }
      if (depth > 0 && parentIndex === null) parentIndex = index;
      parentStack[depth] = index;
      parentStack.length = depth + 1;

      const item = document.createElement("li");
      item.className = "atlas-toc-item";
      item.dataset.tocDepth = String(depth);
      item.hidden = depth > 0;
      item.style.setProperty("--atlas-toc-depth", String(depth));

      const link = document.createElement("a");
      link.className = "toc-link";
      link.href = `#${record.id}`;
      link.textContent = record.headingText || "[Empty Heading]";
      link.dataset.tocIndex = String(index);

      item.appendChild(link);
      fragment.appendChild(item);
      entries.push({
        ...record,
        depth,
        parentIndex,
        item,
        link,
      });
    });

    return { entries, fragment };
  }

  _observeSections() {
    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;

    if (!this._entries.length) return;
    if (!("IntersectionObserver" in window)) {
      this._setActiveIndex(0);
      return;
    }

    this._intersectionObserver = new IntersectionObserver(
      (entries) => this._handleIntersections(entries),
      {
        root: null,
        rootMargin: "-80px 0px -65% 0px",
        threshold: 0,
      },
    );
    this._entries.forEach(({ heading }) =>
      this._intersectionObserver.observe(heading),
    );
    this._setActiveIndex(0);
  }

  _handleIntersections(observedEntries) {
    let bestIndex = this._activeIndex ?? 0;
    let bestScore = -Infinity;

    observedEntries.forEach((entry) => {
      const index = this._entryIndexByHeading.get(entry.target);
      if (index === undefined || !entry.isIntersecting) return;

      const offsetScore =
        1 -
        Math.min(
          Math.abs(entry.boundingClientRect.top - 80) / 800,
          1,
        );
      const score = entry.intersectionRatio + offsetScore;
      if (score <= bestScore) return;

      bestScore = score;
      bestIndex = index;
    });

    if (bestScore === -Infinity) return;
    this._setActiveIndex(
      this._isNearPageBottom() ? this._entries.length - 1 : bestIndex,
    );
  }

  _setActiveIndex(index) {
    if (index < 0 || index >= this._entries.length) return;
    if (this._activeIndex === index) return;
    this._activeIndex = index;

    this._entries.forEach(({ link }, entryIndex) => {
      const isCurrent = entryIndex === index;
      link.classList.toggle(this._config.activeClass, isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
    this._updateVisibleSubheadings(index);
  }

  _updateVisibleSubheadings(activeIndex) {
    const activePath = new Set();
    let pathIndex = activeIndex;

    while (
      Number.isInteger(pathIndex) &&
      pathIndex >= 0 &&
      !activePath.has(pathIndex)
    ) {
      activePath.add(pathIndex);
      pathIndex = this._entries[pathIndex]?.parentIndex;
    }

    this._entries.forEach((entry, index) => {
      const shouldHide =
        entry.depth > 0 && !activePath.has(entry.parentIndex);
      entry.item.classList.toggle(
        "is-active-ancestor",
        activePath.has(index) && index !== activeIndex,
      );
      if (entry.item.hidden !== shouldHide) {
        entry.item.hidden = shouldHide;
      }
    });
  }

  _isNearPageBottom() {
    return (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 24
    );
  }

  _layout() {
    if (
      !this._content ||
      !this._entries.length ||
      window.innerWidth <= TOC_LAYOUT.breakpoint
    ) {
      this._hideToc();
      return;
    }

    const rect = this._content.getBoundingClientRect();
    const leftAvailable =
      rect.left - TOC_LAYOUT.gap - TOC_LAYOUT.pageInset;
    const rightAvailable =
      window.innerWidth -
      rect.right -
      TOC_LAYOUT.gap -
      TOC_LAYOUT.pageInset;
    const useLeftRail = leftAvailable >= rightAvailable;
    const railWidth = useLeftRail ? leftAvailable : rightAvailable;

    if (railWidth < TOC_LAYOUT.minRailWidth) {
      this._showOverlay();
      return;
    }
    this._showRail(rect, useLeftRail, railWidth);
  }

  _hideToc() {
    this._setOverlayOpen(false);
    this._overlayMode = false;
    this._panel.hidden = true;
    this._toggleButton.hidden = true;
  }

  _showRail(contentRect, useLeftRail, availableWidth) {
    const width = Math.min(TOC_LAYOUT.maxWidth, availableWidth);
    const left = useLeftRail
      ? contentRect.left - TOC_LAYOUT.gap - width
      : contentRect.right + TOC_LAYOUT.gap;

    this._setOverlayOpen(false);
    this._overlayMode = false;
    this._panel.classList.remove("atlas-toc-overlay");
    this._panel.hidden = false;
    this._panel.style.left =
      `${Math.max(TOC_LAYOUT.pageInset, left)}px`;
    this._panel.style.width = `${width}px`;
    this._toggleButton.hidden = true;
    this._toggleButton.setAttribute("aria-expanded", "false");
  }

  _showOverlay() {
    const width = Math.min(
      TOC_LAYOUT.maxWidth,
      window.innerWidth - TOC_LAYOUT.pageInset * 2,
    );

    this._overlayMode = true;
    this._panel.classList.add("atlas-toc-overlay");
    this._panel.style.left = `${TOC_LAYOUT.pageInset}px`;
    this._panel.style.width = `${width}px`;
    this._toggleButton.hidden = false;
    this._toggleButton.style.left = `${TOC_LAYOUT.pageInset}px`;
    this._setOverlayOpen(this._overlayOpen);
  }

  _setOverlayOpen(
    open,
    { focusPanel = false, restoreFocus = false } = {},
  ) {
    const nextOpen = Boolean(open && this._overlayMode);
    this._overlayOpen = nextOpen;
    this._panel.hidden = !nextOpen;
    this._toggleButton.setAttribute("aria-expanded", String(nextOpen));

    if (nextOpen && focusPanel) {
      this._scheduleFrame(
        "focus",
        () => {
          if (!this._overlayOpen) return;
          (this._entries[0]?.link || this._panel).focus({
            preventScroll: true,
          });
        },
        true,
      );
    } else if (!nextOpen && restoreFocus && !this._toggleButton.hidden) {
      this._toggleButton.focus({ preventScroll: true });
    }
  }

  _onToggle() {
    this._setOverlayOpen(!this._overlayOpen, { focusPanel: true });
  }

  _onLinkClick(event) {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a.toc-link");
    if (!link || !this._linksContainer.contains(link)) return;
    if (!this._overlayMode) return;

    const entry = this._entries[Number(link.dataset.tocIndex)];
    if (!entry) return;

    this._setOverlayOpen(false);
    if (!entry.heading.hasAttribute("tabindex")) {
      entry.heading.tabIndex = -1;
    }
    this._scheduleFrame(
      "focus",
      () => entry.heading.focus({ preventScroll: true }),
      true,
    );
  }

  _onOverlayKeydown(event) {
    if (event.key === "Escape" && this._overlayOpen) {
      this._setOverlayOpen(false, { restoreFocus: true });
    }
  }

  _onDocumentPointerDown(event) {
    if (!this._overlayOpen) return;
    const path = event.composedPath();
    if (path.includes(this._panel) || path.includes(this._toggleButton)) {
      return;
    }
    this._setOverlayOpen(false);
  }

  _onResize() {
    this._scheduleFrame("layout", () => this._layout());
  }

  _onPageScroll() {
    this._scheduleFrame("scroll", () => {
      if (this._isNearPageBottom()) {
        this._setActiveIndex(this._entries.length - 1);
      }
    });
  }

  _scheduleFrame(key, callback, replace = false) {
    const existingFrame = this._frames.get(key);
    if (existingFrame !== undefined) {
      if (!replace) return;
      cancelAnimationFrame(existingFrame);
    }

    const frame = requestAnimationFrame(() => {
      this._frames.delete(key);
      callback();
    });
    this._frames.set(key, frame);
  }

  _cancelFrames() {
    this._frames.forEach((frame) => cancelAnimationFrame(frame));
    this._frames.clear();
  }
}

if (!customElements.get("atlas-toc")) {
  customElements.define("atlas-toc", AtlasToc);
}
