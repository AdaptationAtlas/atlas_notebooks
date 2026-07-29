import { lang as Lang } from "./lang.js";

const CONFIG_SCRIPT_ID = "atlas-notebook-config";
const DEFAULT_LOCALE = "en";
const LOCALES = ["en", "fr"];

function contentUrl(textDir, file) {
  if (!/^data\/[A-Za-z0-9_-]+\/text$/.test(textDir)) {
    throw new Error(`Invalid notebook text directory: ${textDir}`);
  }
  return `/${textDir}/${file}`;
}

async function fetchRequired(url, type, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }
  return type === "json" ? response.json() : response.text();
}

/** Read the build-embedded notebook configuration. */
export function readNotebookConfig(doc = document) {
  const node = doc.getElementById(CONFIG_SCRIPT_ID);
  if (!node?.textContent) {
    throw new Error(
      `Missing #${CONFIG_SCRIPT_ID}; check the notebook's nb-config`,
    );
  }
  const config = JSON.parse(node.textContent);
  if (!config.id || !config.textDir || !config.content?.blocks?.length) {
    throw new Error("Notebook configuration is incomplete");
  }
  return config;
}

/** Resolve the localized notebook title with an English fallback. */
export function notebookTitle(config, locale = DEFAULT_LOCALE) {
  return config.title?.[locale] ?? config.title?.[DEFAULT_LOCALE] ?? config.id;
}

/** Load widget strings and CMS prose for every supported locale. */
export async function loadNotebookContent(
  config,
  {
    locales = LOCALES,
    defaultLocale = DEFAULT_LOCALE,
    fetchImpl = fetch,
  } = {},
) {
  const textEntries = await Promise.all(
    locales.map(async (locale) => [
      locale,
      await fetchRequired(
        contentUrl(config.textDir, `${locale}.json`),
        "json",
        fetchImpl,
      ),
    ]),
  );
  const text = Object.fromEntries(textEntries);
  const fallback = text[defaultLocale];
  for (const locale of locales) {
    text[locale] = Lang.withFallback(text[locale], fallback);
  }

  const sectionEntries = await Promise.all(
    locales.map(async (locale) => {
      const blocks = await Promise.all(
        config.content.blocks.map(async (id) => {
          const raw = await fetchRequired(
            contentUrl(config.textDir, `${id}.${locale}.md`),
            "text",
            fetchImpl,
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
