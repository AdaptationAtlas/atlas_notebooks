import { lang as Lang } from "./lang.js";

const CONFIG_SCRIPT_ID = "atlas-notebook-config";
const LOCALES = ["en", "fr"];

function contentUrl(textDir, file) {
  return `/${textDir}/${file}`;
}

async function fetchRequired(url, type) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }
  return response[type]();
}

/** Read the build-embedded notebook configuration. */
export function readNotebookConfig(doc = document) {
  const node = doc.getElementById(CONFIG_SCRIPT_ID);
  if (!node?.textContent) {
    throw new Error(
      `Missing #${CONFIG_SCRIPT_ID}; check the notebook's nb-config`,
    );
  }
  return JSON.parse(node.textContent);
}

/** Load widget strings for every supported locale. */
export async function loadNotebookText(config) {
  const textEntries = await Promise.all(
    LOCALES.map(async (locale) => [
      locale,
      await fetchRequired(
        contentUrl(config.textDir, `${locale}.json`),
        "json",
      ),
    ]),
  );
  const text = Object.fromEntries(textEntries);
  for (const locale of LOCALES) {
    text[locale] = Lang.withFallback(text[locale], text.en);
  }
  return text;
}
