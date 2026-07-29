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
export function getRegexForNamedInsertion(itemName, { start = ":::", end = ":::" } = {}) {
  return new RegExp(`${start}\\s*${itemName}\\s*${end}`, "g");
}

/** Replace named insertion tokens with values from an item list. */
export function reduceReplaceTemplateItems(template, items, { templateNameField = "name", templateValueField = "value", ...options } = {}) {
  return items.reduce((text, item) => {
    return text.replace(
      getRegexForNamedInsertion(item[templateNameField], { ...options }),
      item[templateValueField]
    );
  }, template);
}

function parseYamlScalar(value) {
  const text = value.trim();
  if (text === "null" || text === "~") return null;
  if (text.startsWith('"') && text.endsWith('"')) return JSON.parse(text);
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replaceAll("''", "'");
  }
  return text;
}

function indentation(line) {
  return line.match(/^ */)[0].length;
}

function readYamlValue(lines, index, parentIndent, rawValue) {
  if (!/^[>|][+-]?$/.test(rawValue.trim())) {
    return { value: parseYamlScalar(rawValue), next: index + 1 };
  }

  let next = index + 1;
  let contentIndent = null;
  const valueLines = [];
  while (next < lines.length) {
    const line = lines[next];
    if (line.trim() === "") {
      valueLines.push("");
      next += 1;
      continue;
    }
    const lineIndent = indentation(line);
    if (lineIndent <= parentIndent) break;
    contentIndent ??= lineIndent;
    valueLines.push(line.slice(contentIndent));
    next += 1;
  }
  return { value: valueLines.join("\n").trim(), next };
}

function parseProseFrontMatter(source) {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const meta = {};

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      index += 1;
      continue;
    }
    const field = line.match(/^([A-Za-z0-9_-]+):(?:[ \t]*(.*))?$/);
    if (!field) throw new Error(`unsupported prose front matter: ${line}`);
    const [, key, rawValue = ""] = field;

    if (key !== "details") {
      const parsed = readYamlValue(lines, index, 0, rawValue);
      meta[key] = parsed.value;
      index = parsed.next;
      continue;
    }

    if (rawValue.trim() !== "") {
      meta.details = parseYamlScalar(rawValue);
      index += 1;
      continue;
    }

    const details = {};
    index += 1;
    while (index < lines.length) {
      const nestedLine = lines[index];
      if (nestedLine.trim() === "") {
        index += 1;
        continue;
      }
      const nestedIndent = indentation(nestedLine);
      if (nestedIndent === 0) break;
      const nested = nestedLine
        .slice(nestedIndent)
        .match(/^([A-Za-z0-9_-]+):(?:[ \t]*(.*))?$/);
      if (!nested) {
        throw new Error(`unsupported details front matter: ${nestedLine}`);
      }
      const [, nestedKey, nestedRawValue = ""] = nested;
      const parsed = readYamlValue(
        lines,
        index,
        nestedIndent,
        nestedRawValue,
      );
      details[nestedKey] = parsed.value;
      index = parsed.next;
    }
    meta.details = details;
  }
  return meta;
}

/** Parse CMS prose and its optional nested collapsible note. */
export function parseBlock(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    throw new Error("prose block must start with YAML front matter");
  }
  const meta = parseProseFrontMatter(match[1]);
  if (typeof meta.title !== "string" || !meta.title.trim()) {
    throw new Error("prose front matter requires a title");
  }
  const details =
    meta.details &&
    typeof meta.details.title === "string" &&
    typeof meta.details.body === "string"
      ? {
          title: meta.details.title.trim(),
          body: meta.details.body.trim(),
        }
      : undefined;
  return {
    title: meta.title.trim(),
    body: markdown.slice(match[0].length).trim(),
    details,
  };
}

/** Apply translated headings and prose, restoring build-time markup for the default. */
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

  for (const node of document.querySelectorAll(".nb-details")) {
    const details = sections[node.dataset.section]?.details;
    if (!details) continue;
    node.querySelector("summary").textContent = details.title;
    node.querySelector(".nb-details__body").replaceChildren(md`${details.body}`);
  }
}

/** Fill missing translation-tree values recursively from a fallback. */
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

/** List object-tree leaves missing any required key. */
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

/** Return a query parameter only when it is in the allowed list. */
export async function getParamFromList({ name, list, search = location.search } = {}) {
  if (!name || !list) {
    throw new Error("'name' and 'list' parameters are required.");
  }

  const params = new URLSearchParams(search);
  const param = params.get(name);

  return param && list.includes(param) ? param : null;
}

/** Convert a string to title case. */
export function toTitleCase(str) {
  if (typeof str !== "string") {
    throw new Error("Input must be a string");
  }
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
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

export default lang; // Backward-compatible default export.
