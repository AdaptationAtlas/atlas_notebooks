// Authors: Zach Bogart, Brayden Youngberg
const VERSION = "2.0.1";

// FUNCTIONS

/**
 * Shorthand for getText, that defines default key
 */
function lg(defaultKey) {
  return (textObj) => getText(textObj, { key: defaultKey });
}

/**
 * get the text in specified language key, or undefined
 * - default to 'en'
 */
function getText(textObj, { key = null } = {}) {
  if (key === null) {
    throw new Error("No 'key' field; please provide a language key.");
  }

  return textObj?.[key];
}

/**
 * get a regex for a defined string
 * - default to wrapping in triple angle brackets (<<< item >>>)
 * - ignores whitespace before and after inner string
 */
function getRegexForNamedInsertion(itemName, { start = ":::", end = ":::" } = {}) {
  return new RegExp(`${start}\\s*${itemName}\\s*${end}`, "g");
}

/**
 * replace items in template, return replaced string
 * - default fields for 'items' array of objects [{name: "...", value: "..."}]
 */
function reduceReplaceTemplateItems(template, items, { templateNameField = "name", templateValueField = "value", ...options } = {}) {
  return items.reduce((text, item) => {
    return text.replace(
      getRegexForNamedInsertion(item[templateNameField], { ...options }),
      item[templateValueField]
    );
  }, template);
}

/**
 * Lists the leaves (i.e., terminal nodes) of an object tree that are missing specified keys.
 */
function listLeavesMissingObjectKeys(obj, keys) {
  const missingLeaves = [];

  function traverse(obj, path) {
    if (typeof obj !== "object" || obj === null) return;

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        missingLeaves.push({ [path]: obj });
        return;
      }
      obj.forEach((item, index) => traverse(item, `${path}[${index}]`));
      return;
    }

    if (Object.keys(obj).length === 0) {
      missingLeaves.push({ [path]: obj });
      return;
    }

    for (let key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          traverse(obj[key], `${path}.${key}`);
        } else {
          const missingKeys = keys.filter((k) => !(k in obj));
          if (missingKeys.length > 0) {
            missingLeaves.push({ [path]: obj });
            break;
          }
        }
      }
    }
  }

  traverse(obj, "");
  return missingLeaves;
}

/**
 * Get a query string parameter and return if it is in the provided list.
 */
async function getParamFromList({ name, list, search = location.search } = {}) {
  if (!name || !list) {
    throw new Error("'name' and 'list' parameters are required.");
  }

  const params = new URLSearchParams(search);
  const param = params.get(name);

  return param && list.includes(param) ? param : null;
}

/**
 * Return string in title case
 */
function toTitleCase(str) {
  if (typeof str !== "string") {
    throw new Error("Input must be a string");
  }
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
}

/**
 * Return string in sentence case
 */
function toSentenceCase(str) {
  if (typeof str !== "string") {
    throw new Error("Input must be a string");
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default {
  version: VERSION,
  lg,
  getText,
  getRegexForNamedInsertion,
  reduceReplaceTemplateItems,
  listLeavesMissingObjectKeys,
  getParamFromList,
  toTitleCase,
  toSentenceCase
};