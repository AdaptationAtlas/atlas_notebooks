// Vanilla navbar language switcher — owns the page's language state so the
// toggle works before (and without) the OJS runtime. Load it from a notebook
// with: <script src="/components/langSwitcher.js"></script>
//
// State surface (what notebooks consume):
//   window.atlasLang                     current language key ("en" | "fr")
//   "atlas:lang" CustomEvent on window   detail = new key, fired on change
//   document.documentElement.lang        kept in sync
//   ?lang= query param                   read on load, updated on toggle
//
// OJS side subscribes with one cell:
//   langKey = Generators.observe((notify) => {
//     notify(window.atlasLang ?? "en");
//     const onChange = (e) => notify(e.detail);
//     window.addEventListener("atlas:lang", onChange);
//     return () => window.removeEventListener("atlas:lang", onChange);
//   })
//
// If the site moves to per-language builds (/fr/ profile), this component
// becomes navigation between the two page trees and the event goes away.
// (That variant is implemented on the feat/cms reference branch.)

const LANGS = [
  { key: "en", label: "English" },
  { key: "fr", label: "Français" },
];

function initialLang() {
  const param = new URLSearchParams(location.search).get("lang");
  if (LANGS.some((l) => l.key === param)) return param;
  const docLang = document.documentElement.lang;
  return LANGS.some((l) => l.key === docLang) ? docLang : LANGS[0].key;
}

function setLang(key, buttons) {
  window.atlasLang = key;
  document.documentElement.lang = key;
  const url = new URL(location);
  if (key === LANGS[0].key) url.searchParams.delete("lang");
  else url.searchParams.set("lang", key);
  history.replaceState(null, "", url);
  for (const b of buttons) {
    b.setAttribute("aria-pressed", String(b.dataset.lang === key));
  }
  window.dispatchEvent(new CustomEvent("atlas:lang", { detail: key }));
}

function init() {
  const navEnd = document.querySelector(".navbar-nav.ms-auto .nav-item.compact");
  if (!navEnd || document.getElementById("nav-lang-selector")) return;

  const style = document.createElement("style");
  style.textContent = `
    #nav-lang-selector { display: flex; align-items: center; gap: 0.25rem; margin-left: 10px; }
    #nav-lang-selector button { background: none; border: none; padding: 0.25rem 0.4rem; cursor: pointer; font: inherit; color: inherit; opacity: 0.6; }
    #nav-lang-selector button[aria-pressed="true"] { opacity: 1; font-weight: 600; text-decoration: underline; }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.id = "nav-lang-selector";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Language");

  const buttons = LANGS.map((lang) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.lang = lang.key;
    b.textContent = lang.label;
    b.addEventListener("click", () => setLang(lang.key, buttons));
    wrap.appendChild(b);
    return b;
  });

  navEnd.parentNode.appendChild(wrap);
  setLang(initialLang(), buttons);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
