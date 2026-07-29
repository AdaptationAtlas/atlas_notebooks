// Owns language state before OJS loads, syncing <html>, ?lang, and window.atlasLang.
// Notebook cells subscribe to the "atlas:lang" event.

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

function setLang(key, select) {
  window.atlasLang = key;
  document.documentElement.lang = key;
  const url = new URL(location);
  if (key === LANGS[0].key) url.searchParams.delete("lang");
  else url.searchParams.set("lang", key);
  history.replaceState(null, "", url);
  if (select) select.value = key;
  window.dispatchEvent(new CustomEvent("atlas:lang", { detail: key }));
}

function init() {
  const navEnd = document.querySelector(".navbar-nav.ms-auto .nav-item.compact");
  if (!navEnd || document.getElementById("nav-lang-selector")) return;

  const style = document.createElement("style");
  style.textContent = `
    #nav-lang-selector {
      margin-left: 10px;
      font: inherit;
      color: #000;
      background: transparent;
      border: none;
      padding: 0.15rem 0.3rem;
      cursor: pointer;
      transition: color 0.15s;
    }
    #nav-lang-selector:hover,
    #nav-lang-selector:focus-visible {
      color: var(--atlas-color-primary, #2e7636);
    }
    #nav-lang-selector option { color: initial; }
  `;
  document.head.appendChild(style);

  const select = document.createElement("select");
  select.id = "nav-lang-selector";
  select.setAttribute("aria-label", "Language");
  for (const lang of LANGS) {
    const opt = document.createElement("option");
    opt.value = lang.key;
    opt.textContent = lang.label;
    select.appendChild(opt);
  }
  select.addEventListener("change", () => setLang(select.value, select));

  navEnd.parentNode.appendChild(select);
  setLang(initialLang(), select);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
