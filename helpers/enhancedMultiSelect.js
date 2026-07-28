const atlasMultiSelectTranslations = {
  en: {
    selectAll: "Select All",
    deselectAll: "Deselect All",
    noneSelected: "None selected",
    search: "Search…",
    options: "Options",
    selected: (count) => `${count} selected`,
  },
  fr: {
    selectAll: "Tout sélectionner",
    deselectAll: "Tout désélectionner",
    noneSelected: "Aucune sélection",
    search: "Rechercher…",
    options: "Options",
    selected: (count) => `${count} sélectionné${count === 1 ? "" : "s"}`,
  },
};

/**
 * Enhance an existing `Inputs.select(..., {multiple: true})`.
 *
 * Use `atlasMultiSelect()` for normal construction. This lower-level helper is
 * retained for advanced cases that need to create or bind the native input
 * before enhancement.
 *
 * @param {HTMLElement|HTMLFormElement} viewofSelect
 * @param {object} [config]
 * @param {?number} [config.maxSelections=null]
 * @param {boolean} [config.requireAtLeastOne=true]
 * @param {boolean} [config.enableSelectAll=false] Show valid bulk actions.
 * "Select All" is omitted when `maxSelections` is finite.
 * @param {boolean} [config.searchable=false]
 * @param {"change"|"close"} [config.commit="close"]
 * without changing the selected values.
 * @param {boolean} [config.emitOnChange] Deprecated alias for
 * `commit: "change"`.
 * @param {?number} [config.compactLabelThreshold=null]
 * @param {string} [config.language="en"]
 * @param {object} [config.labels]
 * @param {string} [config.minWidth="240px"]
 * @param {string} [config.maxWidth="400px"]
 * @returns {HTMLElement|HTMLFormElement}
 */
export function enhancedMultiSelect(
  viewofSelect,
  {
    maxSelections = null,
    requireAtLeastOne = true,
    enableSelectAll = false,
    searchable = false,
    commit,
    emitOnChange,
    compactLabelThreshold = null,
    language = "en",
    labels = {},
    minWidth = "240px",
    maxWidth = "400px",
  } = {},
) {
  viewofSelect?.atlasMultiSelect?.destroy?.();

  const select = viewofSelect?.querySelector?.("select") || viewofSelect;
  if (!select?.matches?.("select[multiple]")) {
    throw new TypeError(
      "enhancedMultiSelect requires a multiple Inputs.select()",
    );
  }

  const commitMode = commit ?? (emitOnChange ? "change" : "close");
  if (!["change", "close"].includes(commitMode)) {
    throw new TypeError('commit must be either "change" or "close"');
  }

  const selectionLimit = Number.isFinite(maxSelections)
    ? Math.max(0, Math.floor(maxSelections))
    : Infinity;
  if (requireAtLeastOne && selectionLimit === 0) {
    throw new RangeError(
      "maxSelections must be at least 1 when requireAtLeastOne is true",
    );
  }

  const defaults =
    atlasMultiSelectTranslations[language] ??
    atlasMultiSelectTranslations.en;
  const text = { ...defaults, ...labels };
  const controller = new AbortController();
  const signal = controller.signal;

  const styles = {
    wrapper: `
      font-family: inherit; width: 100%; min-width: 0; max-width: ${maxWidth};
      box-sizing: border-box; padding: 0; position: relative;
      font-size: var(--atlas-input-font-size, 13px); line-height: 1.35;
    `,
    btn: `
      width: 100%; height: 40px; box-sizing: border-box; padding: 8px 12px;
      background: var(--atlas-color-surface, #fff);
      border: 2px solid var(--atlas-color-border, #c9c9c9);
      border-radius: var(--atlas-radius-control, 8px);
      cursor: pointer; font-family: inherit;
      font-size: var(--atlas-input-font-size, 13px); font-weight: 400;
      line-height: 1.35;
      text-align: left; display: flex; justify-content: space-between;
      align-items: center;
      transition: var(--atlas-transition-control, border-color 200ms ease, background-color 200ms ease, color 200ms ease);
      color: var(--atlas-color-text-muted, #4a5568);
    `,
    list: `
      display: none; width: 100%; box-sizing: border-box;
      border: 1px solid var(--atlas-color-control-border, #d1d5db);
      border-radius: var(--atlas-radius-control, 8px);
      background: var(--atlas-color-surface, #fff);
      z-index: 10; top: 100%; position: absolute;
      overflow: hidden; padding: 0; margin-top: 4px;
      box-shadow: var(--atlas-shadow-popover, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    `,
    buttonContainer: `
      display: flex; gap: 8px; padding: 8px 12px;
      border-bottom: 2px solid var(--atlas-color-divider, #e5e7eb);
      background: var(--atlas-color-surface-muted, #f9fafb);
      position: relative; z-index: 1;
    `,
    optionsContainer: `
      max-height: 240px; overflow-y: auto; padding: 0;
      overscroll-behavior: contain;
    `,
    searchContainer: `
      padding: 8px 12px;
      border-bottom: 1px solid var(--atlas-color-divider, #e5e7eb);
      background: var(--atlas-color-surface, #fff);
    `,
    searchInput: `
      display: block; width: 100%; box-sizing: border-box;
      padding: 7px 9px;
      border: 1px solid var(--atlas-color-control-border, #d1d5db);
      border-radius: var(--atlas-radius-action, 4px);
      background: var(--atlas-color-surface, #fff);
      color: var(--atlas-color-text, #111);
      font: inherit;
    `,
    actionBtn: `
      flex: 1; padding: 6px 12px;
      font-size: var(--atlas-input-action-font-size, 12px); font-weight: 500;
      border: 1px solid var(--atlas-color-control-border, #d1d5db);
      border-radius: var(--atlas-radius-action, 4px); cursor: pointer;
      background: var(--atlas-color-surface, #fff);
      transition: var(--atlas-transition-action, border-color 150ms ease, background-color 150ms ease, color 150ms ease);
    `,
    option: `
      padding: 8px 12px; cursor: pointer; display: flex;
      color: var(--atlas-color-text-muted, #4a5568);
      font-family: inherit; font-size: var(--atlas-input-font-size, 13px);
      font-weight: 400; line-height: 1.35;
      justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--atlas-color-divider, #e5e7eb);
      transition: background-color 100ms ease;
    `,
    check: `
      color: var(--atlas-color-check, rgba(0, 0, 0, 0.8));
      font-weight: 400; margin-left: 12px; min-width: 15px;
    `,
  };

  const applyStyle = (element, css) => {
    element.style.cssText = css;
  };
  const listen = (target, type, handler, options = {}) => {
    target.addEventListener(type, handler, { ...options, signal });
  };
  const normalizeSearchText = (value) =>
    String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();
  const selectionSignature = () =>
    Array.from(select.options, (option) => option.selected).join(",");
  const selectedOptions = () =>
    Array.from(select.options).filter((option) => option.selected);
  const shake = (element) => {
    const originalBackground = element.style.backgroundColor;
    element.style.backgroundColor =
      "var(--atlas-color-danger-surface, #ffe5e5)";
    window.setTimeout(() => {
      element.style.backgroundColor = originalBackground;
    }, 180);
    element.animate?.(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-2px)" },
        { transform: "translateX(2px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 200 },
    );
  };

  const originalSelectStyle = select.getAttribute("style");
  const originalViewStyle =
    viewofSelect !== select ? viewofSelect.getAttribute("style") : null;
  select.style.display = "none";

  const normalizeSelection = () => {
    const selected = selectedOptions();
    if (selected.length > selectionLimit) {
      selected
        .slice(selectionLimit)
        .forEach((option) => (option.selected = false));
    }
    if (
      requireAtLeastOne &&
      select.selectedIndex === -1 &&
      select.options.length
    ) {
      const firstEnabled =
        Array.from(select.options).find((option) => !option.disabled) ??
        select.options[0];
      firstEnabled.selected = true;
    }
  };
  normalizeSelection();

  const wrapper = document.createElement("div");
  wrapper.className = "enhanced-multiselect";
  applyStyle(wrapper, styles.wrapper);

  if (viewofSelect !== select) {
    viewofSelect.style.boxSizing = "border-box";
    viewofSelect.style.flex = `1 1 ${minWidth}`;
    viewofSelect.style.width = "100%";
    viewofSelect.style.minWidth = `min(${minWidth}, 100%)`;
    viewofSelect.style.maxWidth = maxWidth;
  }

  const idSuffix =
    globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2);
  const listboxId = `atlas-multiselect-${idSuffix}`;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.disabled = select.disabled;
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", listboxId);
  applyStyle(btn, styles.btn);

  const buttonLabel = document.createElement("span");
  buttonLabel.style.cssText = `
    pointer-events: none; flex: 1; min-width: 0; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
  `;
  const buttonArrow = document.createElement("span");
  buttonArrow.setAttribute("aria-hidden", "true");
  buttonArrow.style.cssText = "opacity: 0.7; pointer-events: none;";
  btn.append(buttonLabel, buttonArrow);

  const list = document.createElement("div");
  list.className = "enhanced-multiselect-list";
  list.hidden = true;
  applyStyle(list, styles.list);

  const optionsContainer = document.createElement("div");
  optionsContainer.id = listboxId;
  optionsContainer.className = "enhanced-multiselect-options";
  optionsContainer.setAttribute("role", "listbox");
  optionsContainer.setAttribute("aria-multiselectable", "true");
  const observableLabel =
    viewofSelect !== select
      ? viewofSelect.querySelector("label")?.textContent?.trim()
      : "";
  optionsContainer.setAttribute(
    "aria-label",
    observableLabel || String(text.options),
  );
  applyStyle(optionsContainer, styles.optionsContainer);

  let isOpen = false;
  let selectionAtOpen = selectionSignature();
  let searchInput = null;
  let optionRows = [];
  let optionController = new AbortController();
  let destroyed = false;

  const listenOption = (target, type, handler) => {
    target.addEventListener(type, handler, {
      signal: optionController.signal,
    });
  };
  const visibleRows = () =>
    optionRows.filter(({ option, row }) => !option.disabled && !row.hidden);
  const setActiveRow = (entry, { focus = false } = {}) => {
    optionRows.forEach(({ row }) => {
      row.tabIndex = row === entry?.row ? 0 : -1;
    });
    if (focus) entry?.row.focus({ preventScroll: true });
  };
  const preferredRow = (edge = "selected") => {
    const rows = visibleRows();
    if (!rows.length) return null;
    if (edge === "first") return rows[0];
    if (edge === "last") return rows.at(-1);
    return rows.find(({ option }) => option.selected) ?? rows[0];
  };

  const filterOptions = (query) => {
    const normalizedQuery = normalizeSearchText(query).trim();
    optionRows.forEach(({ row }) => {
      row.hidden =
        normalizedQuery.length > 0 &&
        !row.dataset.search.includes(normalizedQuery);
    });

    const active = optionRows.find(({ row }) => row.tabIndex === 0);
    if (!active || active.row.hidden || active.option.disabled) {
      setActiveRow(preferredRow("first"));
    }
  };

  function updateUI() {
    const selected = selectedOptions();
    const useCompactLabel =
      Number.isFinite(compactLabelThreshold) &&
      selected.length > compactLabelThreshold;
    const compactText =
      typeof text.selected === "function"
        ? text.selected(selected.length)
        : String(text.selected).replace("{count}", selected.length);

    const defaultSelectionLabel = !selected.length
      ? String(text.noneSelected)
      : useCompactLabel
        ? String(compactText)
        : selected.map((option) => option.textContent).join(", ");
    buttonLabel.textContent = defaultSelectionLabel;
    buttonArrow.textContent = isOpen ? "▴" : "▾";
    btn.disabled = select.disabled;

    optionRows.forEach(({ check, option, row }) => {
      const isSelected = option.selected;
      check.textContent = isSelected ? "✔" : "";
      row.setAttribute("aria-selected", String(isSelected));
      row.setAttribute("aria-disabled", String(option.disabled));
      row.style.cursor = option.disabled ? "not-allowed" : "pointer";
      row.style.opacity = option.disabled ? "0.55" : "1";
      row.style.backgroundColor = isSelected
        ? "var(--atlas-color-surface-muted, #f9fafb)"
        : "var(--atlas-color-surface, #fff)";
    });

    if (select.disabled && isOpen) closeList({ focusButton: false });
  }

  const dispatchInput = () => {
    select.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const selectionChanged = (previousSignature) => {
    updateUI();
    if (
      selectionSignature() !== previousSignature &&
      commitMode === "change"
    ) {
      selectionAtOpen = selectionSignature();
      dispatchInput();
    }
  };

  const toggleOption = (entry) => {
    const { option, row } = entry;
    if (option.disabled) return;

    const previousSignature = selectionSignature();
    const selectedCount = selectedOptions().length;
    if (
      !option.selected &&
      Number.isFinite(selectionLimit) &&
      selectedCount >= selectionLimit
    ) {
      if (selectionLimit === 1) {
        Array.from(select.options).forEach((candidate) => {
          if (!candidate.disabled) candidate.selected = false;
        });
      } else {
        shake(row);
        return;
      }
    }

    if (requireAtLeastOne && option.selected && selectedCount <= 1) {
      shake(row);
      return;
    }

    option.selected = !option.selected;
    selectionChanged(previousSignature);
  };

  const moveOptionFocus = (current, direction) => {
    const rows = visibleRows();
    if (!rows.length) return;
    const index = Math.max(
      0,
      rows.findIndex(({ row }) => row === current),
    );
    const nextIndex =
      direction === "first"
        ? 0
        : direction === "last"
          ? rows.length - 1
          : (index + direction + rows.length) % rows.length;
    setActiveRow(rows[nextIndex], { focus: true });
  };

  const makeOptionRow = (option) => {
    const row = document.createElement("div");
    row.dataset.search = normalizeSearchText(option.textContent);
    row.setAttribute("role", "option");
    applyStyle(row, styles.option);

    const label = document.createElement("span");
    label.textContent = option.textContent;
    const check = document.createElement("span");
    check.setAttribute("aria-hidden", "true");
    applyStyle(check, styles.check);
    row.append(label, check);

    const entry = { check, option, row };
    listenOption(row, "click", () => toggleOption(entry));
    listenOption(row, "keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleOption(entry);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveOptionFocus(row, 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveOptionFocus(row, -1);
      } else if (event.key === "Home") {
        event.preventDefault();
        moveOptionFocus(row, "first");
      } else if (event.key === "End") {
        event.preventDefault();
        moveOptionFocus(row, "last");
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeList({ focusButton: true });
      }
    });
    listenOption(row, "mouseenter", () => {
      if (!option.disabled) {
        row.style.backgroundColor = option.selected
          ? "var(--atlas-color-surface-muted, #f9fafb)"
          : "var(--atlas-color-surface-hover, #f3f4f6)";
      }
    });
    listenOption(row, "mouseleave", () => updateUI());
    return entry;
  };

  const renderOptions = () => {
    const focusedOption = optionRows.find(
      ({ row }) => row === document.activeElement,
    )?.option;
    optionController.abort();
    optionController = new AbortController();
    optionRows = Array.from(select.options, makeOptionRow);
    optionsContainer.replaceChildren(
      ...optionRows.map(({ row }) => row),
    );

    const active =
      optionRows.find(({ option }) => option === focusedOption) ??
      preferredRow();
    setActiveRow(active, {
      focus: isOpen && Boolean(focusedOption),
    });
    filterOptions(searchInput?.value ?? "");
    updateUI();
  };

  const outsideClickListener = (event) => {
    if (!wrapper.contains(event.target)) {
      closeList({ focusButton: false });
    }
  };
  const attachOutsideListener = () => {
    document.addEventListener("click", outsideClickListener);
  };
  const detachOutsideListener = () => {
    document.removeEventListener("click", outsideClickListener);
  };

  function closeList({ focusButton = false } = {}) {
    if (!isOpen) return;

    isOpen = false;
    list.hidden = true;
    list.style.display = "none";
    btn.setAttribute("aria-expanded", "false");
    buttonArrow.textContent = "▾";
    detachOutsideListener();

    const changed = selectionSignature() !== selectionAtOpen;
    selectionAtOpen = selectionSignature();
    if (changed && commitMode === "close") dispatchInput();
    if (focusButton && btn.isConnected) {
      btn.focus({ preventScroll: true });
    }
  }

  function openList({ focus = "selected" } = {}) {
    if (isOpen || select.disabled) return;

    isOpen = true;
    selectionAtOpen = selectionSignature();
    list.hidden = false;
    list.style.display = "block";
    btn.setAttribute("aria-expanded", "true");
    buttonArrow.textContent = "▴";
    optionsContainer.scrollTop = 0;
    attachOutsideListener();
    updateUI();

    if (searchInput) {
      searchInput.value = "";
      filterOptions("");
      searchInput.focus({ preventScroll: true });
    } else {
      setActiveRow(preferredRow(focus), { focus: true });
    }
  }

  const showSelectAll =
    enableSelectAll && !Number.isFinite(selectionLimit);
  const showDeselectAll = enableSelectAll && !requireAtLeastOne;

  if (showSelectAll || showDeselectAll) {
    const actionContainer = document.createElement("div");
    actionContainer.className = "button-container";
    applyStyle(actionContainer, styles.buttonContainer);

    const actionButton = (label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(label);
      applyStyle(button, styles.actionBtn);
      listen(button, "mouseenter", () => {
        button.style.backgroundColor =
          "var(--atlas-color-surface-hover, #f3f4f6)";
        button.style.borderColor =
          "var(--atlas-color-primary, #2e7636)";
        button.style.color =
          "var(--atlas-color-text-strong, #000)";
      });
      listen(button, "mouseleave", () => {
        button.style.backgroundColor =
          "var(--atlas-color-surface, #fff)";
        button.style.borderColor =
          "var(--atlas-color-control-border, #d1d5db)";
      });
      return button;
    };

    if (showSelectAll) {
      const selectAllButton = actionButton(text.selectAll);
      listen(selectAllButton, "click", () => {
        const previousSignature = selectionSignature();
        Array.from(select.options).forEach((option) => {
          if (!option.disabled) option.selected = true;
        });
        selectionChanged(previousSignature);
      });
      actionContainer.appendChild(selectAllButton);
    }

    if (showDeselectAll) {
      const deselectAllButton = actionButton(text.deselectAll);
      listen(deselectAllButton, "click", () => {
        const previousSignature = selectionSignature();
        Array.from(select.options).forEach((option) => {
          if (!option.disabled) option.selected = false;
        });
        selectionChanged(previousSignature);
      });
      actionContainer.appendChild(deselectAllButton);
    }

    list.appendChild(actionContainer);
  }

  if (searchable) {
    const searchContainer = document.createElement("div");
    applyStyle(searchContainer, styles.searchContainer);
    searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = String(text.search);
    searchInput.setAttribute("aria-label", String(text.search));
    applyStyle(searchInput, styles.searchInput);
    listen(searchInput, "input", () => filterOptions(searchInput.value));
    listen(searchInput, "keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeList({ focusButton: true });
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveRow(preferredRow("first"), { focus: true });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveRow(preferredRow("last"), { focus: true });
      }
    });
    searchContainer.appendChild(searchInput);
    list.appendChild(searchContainer);
  }

  list.appendChild(optionsContainer);

  listen(btn, "click", () => {
    if (isOpen) closeList();
    else openList();
  });
  listen(btn, "keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openList({
        focus: event.key === "ArrowDown" ? "first" : "last",
      });
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeList({ focusButton: true });
    }
  });
  listen(btn, "mouseenter", () => {
    btn.style.borderColor = "var(--atlas-color-primary, #2e7636)";
  });
  listen(btn, "mouseleave", () => {
    btn.style.borderColor = "var(--atlas-color-border, #c9c9c9)";
  });
  listen(btn, "focus", () => {
    btn.style.borderColor = "var(--atlas-color-primary, #2e7636)";
  });
  listen(wrapper, "focusout", () => {
    window.setTimeout(() => {
      if (isOpen && !wrapper.contains(document.activeElement)) {
        closeList({ focusButton: false });
      }
    }, 0);
  });
  listen(select, "input", () => {
    selectionAtOpen = selectionSignature();
    updateUI();
  });
  listen(select, "change", () => {
    selectionAtOpen = selectionSignature();
    updateUI();
  });

  const optionObserver = new MutationObserver(() => {
    normalizeSelection();
    selectionAtOpen = selectionSignature();
    renderOptions();
  });

  const parent = select.parentNode;
  parent.insertBefore(wrapper, select);
  wrapper.append(btn, list, select);
  optionObserver.observe(select, {
    attributes: true,
    attributeFilter: ["disabled", "label", "selected", "value"],
    characterData: true,
    childList: true,
    subtree: true,
  });
  renderOptions();

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    detachOutsideListener();
    optionObserver.disconnect();
    optionController.abort();
    controller.abort();

    if (wrapper.parentNode) {
      wrapper.parentNode.insertBefore(select, wrapper);
      wrapper.remove();
    }
    if (originalSelectStyle == null) select.removeAttribute("style");
    else select.setAttribute("style", originalSelectStyle);
    if (viewofSelect !== select) {
      if (originalViewStyle == null) viewofSelect.removeAttribute("style");
      else viewofSelect.setAttribute("style", originalViewStyle);
    }
    delete viewofSelect.atlasMultiSelect;
  };

  Object.defineProperty(viewofSelect, "atlasMultiSelect", {
    configurable: true,
    value: Object.freeze({
      close: (options) => closeList(options),
      commit: commitMode,
      destroy,
      open: (options) => openList(options),
      refresh: renderOptions,
      select,
    }),
  });

  return viewofSelect;
}
