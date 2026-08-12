const CONFIG_SCRIPT_ID = "atlas-notebook-config";
const LOCALES = ["en", "fr"];

// This module is served from <site root>/helpers/, so its own URL gives us the
// site root. A domain-absolute "/data/..." only works when the site is at the
// origin root (Cloudflare) and 404s under a prefix (gh-pages /atlas_notebooks/).
// Quarto's OJS runtime rewrites FileAttachment and "/"-rooted imports for us —
// a raw fetch gets no such help.
export const SITE_ROOT = new URL("../", import.meta.url);

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }
  return response.json();
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
      await fetchJson(new URL(`${config.textDir}/${locale}.json`, SITE_ROOT)),
    ]),
  );
  return Object.fromEntries(textEntries);
}
