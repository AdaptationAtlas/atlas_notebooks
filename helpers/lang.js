// Authors: Zach Bogart, Brayden Youngberg
const VERSION = "3.0.0";

// FUNCTIONS

/**
 * Shorthand for getText, that defines default key
 */
export function lg(defaultKey) {
  return (textObj) => getText(textObj, { key: defaultKey });
}

/**
 * get the text in specified language key, or undefined
 * - default to 'en'
 */
export function getText(textObj, { key = null } = {}) {
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
export function getRegexForNamedInsertion(itemName, { start = ":::", end = ":::" } = {}) {
  return new RegExp(`${start}\\s*${itemName}\\s*${end}`, "g");
}

/**
 * replace items in template, return replaced string
 * - default fields for 'items' array of objects [{name: "...", value: "..."}]
 */
export function reduceReplaceTemplateItems(template, items, { templateNameField = "name", templateValueField = "value", ...options } = {}) {
  return items.reduce((text, item) => {
    return text.replace(
      getRegexForNamedInsertion(item[templateNameField], { ...options }),
      item[templateValueField]
    );
  }, template);
}

/**
 * Parse one prose block file (data/<notebook>/text/<id>.<locale>.md) into
 * { title, body }. The front matter is a deliberately narrow contract —
 * exactly one single-line `title:` field:
 *
 *   ---
 *   title: "Overview"
 *   ---
 *
 *   the prose...
 *
 * scripts/build/checkTranslations.ts rejects anything else in CI, so this
 * only has to handle the three single-line YAML scalar forms (plain,
 * 'single', "double").
 */
export function parseBlock(markdown) {
  const m = markdown.match(/^---\r?\ntitle:[ \t]*(.*?)[ \t]*\r?\n---\r?\n?/);
  if (!m) throw new Error("prose block must start with `---\\ntitle: ...\\n---` front matter");
  let title = m[1];
  if (title.startsWith('"') && title.endsWith('"')) title = JSON.parse(title);
  else if (title.startsWith("'") && title.endsWith("'")) title = title.slice(1, -1).replaceAll("''", "'");
  return { title, body: markdown.slice(m[0].length).trim() };
}

/**
 * Bind translated text onto the statically rendered page: set <html lang>,
 * retitle section headings from their prose blocks, and swap `.nb-prose`
 * nodes to the given language — restoring the build-time markup when back on
 * the default language. Pass the OJS `md` tag for client-side rendering, and
 * `headings` for extra ids whose titles come from elsewhere.
 */
export function applyTranslations({ sections, md, lang, defaultLang = "en", headings = {} }) {
  document.documentElement.lang = lang;

  const titles = {
    ...Object.fromEntries(Object.entries(sections).map(([id, s]) => [id, s.title])),
    ...headings,
  };
  for (const [id, title] of Object.entries(titles)) {
    const h = document.querySelector(`section#${id} > :is(h1,h2,h3)`);
    if (h) h.textContent = title;
  }

  for (const node of document.querySelectorAll(".nb-prose")) {
    if (node._original === undefined) node._original = node.innerHTML;
    if (lang === defaultLang) {
      node.innerHTML = node._original;
    } else {
      const text = sections[node.dataset.section]?.body;
      if (text) node.replaceChildren(md`${text}`);
    }
  }
}

/**
 * Deep-merge fallback values into a translation tree: any key missing in
 * `obj` is filled from `fallback`. For per-locale text files (en.json,
 * fr.json), pass the English tree as the fallback so untranslated strings
 * render in English instead of `undefined`.
 */
export function withFallback(obj, fallback) {
  if (obj === undefined || obj === null) return fallback;
  if (typeof obj !== "object" || typeof fallback !== "object" || fallback === null) {
    return obj;
  }
  const out = { ...obj };
  for (const key of Object.keys(fallback)) {
    out[key] = withFallback(obj[key], fallback[key]);
  }
  return out;
}

/**
 * Lists the leaves (i.e., terminal nodes) of an object tree that are missing specified keys.
 */
export function listLeavesMissingObjectKeys(obj, keys) {
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
export async function getParamFromList({ name, list, search = location.search } = {}) {
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
export function toTitleCase(str) {
  if (typeof str !== "string") {
    throw new Error("Input must be a string");
  }
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
}

/**
 * Return string in sentence case
 */
export function toSentenceCase(str) {
  if (typeof str !== "string") {
    throw new Error("Input must be a string");
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const lang = {
  version: VERSION,
  applyTranslations,
  lg,
  getText,
  getRegexForNamedInsertion,
  reduceReplaceTemplateItems,
  parseBlock,
  withFallback,
  listLeavesMissingObjectKeys,
  getParamFromList,
  toTitleCase,
  toSentenceCase
};

export default lang; // This is included for some back comapatibility due to some initial issues I was hitting with the import system