// Authors: Zach Bogart, Brayden Youngberg
const VERSION = "3.0.0";

/** Bind a default language key for getText. */
export function lg(defaultKey) {
  return (textObj) => getText(textObj, { key: defaultKey });
}

/** Return text for the required language key. */
export function getText(textObj, { key = null } = {}) {
  if (key === null) {
    throw new Error("No 'key' field; please provide a language key.");
  }

  return textObj?.[key];
}

/** Match a named insertion with optional surrounding whitespace. */
export function getRegexForNamedInsertion(
  itemName,
  { start = ":::", end = ":::" } = {},
) {
  return new RegExp(`${start}\\s*${itemName}\\s*${end}`, "g");
}

/** Replace named insertion tokens with values from an item list. */
export function reduceReplaceTemplateItems(
  template,
  items,
  { templateNameField = "name", templateValueField = "value", ...options } = {},
) {
  return items.reduce((text, item) => {
    return text.replace(
      getRegexForNamedInsertion(item[templateNameField], { ...options }),
      item[templateValueField],
    );
  }, template);
}

/** Fill missing translation-tree values recursively from a fallback. */
export function withFallback(obj, fallback) {
  if (obj === undefined || obj === null) return fallback;
  if (
    typeof obj !== "object" || typeof fallback !== "object" || fallback === null
  ) {
    return obj;
  }
  const out = { ...obj };
  for (const key of Object.keys(fallback)) {
    out[key] = withFallback(obj[key], fallback[key]);
  }
  return out;
}

/** Convert a string to sentence case. */
export function toSentenceCase(str) {
  if (typeof str !== "string") {
    throw new Error("Input must be a string");
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const lang = {
  version: VERSION,
  lg,
  getText,
  getRegexForNamedInsertion,
  reduceReplaceTemplateItems,
  withFallback,
  toSentenceCase,
};

export default lang; // Backward-compatible default export.
