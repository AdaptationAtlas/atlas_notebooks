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

/** Load widget strings and CMS prose for every supported locale. */
export async function loadNotebookContent(config) {
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

  const sectionEntries = await Promise.all(
    LOCALES.map(async (locale) => {
      const blocks = await Promise.all(
        config.blocks.map(async (id) => {
          const raw = await fetchRequired(
            contentUrl(config.textDir, `${id}.${locale}.md`),
            "text",
          );
          return [id, Lang.parseBlock(raw)];
        }),
      );
      return [locale, Object.fromEntries(blocks)];
    }),
  );

  return {
    text,
    sections: Object.fromEntries(sectionEntries),
  };
}
