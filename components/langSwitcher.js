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

function setLang(key) {
  window.atlasLang = key;
  document.documentElement.lang = key;
  const url = new URL(location);
  if (key === LANGS[0].key) url.searchParams.delete("lang");
  else url.searchParams.set("lang", key);
  history.replaceState(null, "", url);
  window.dispatchEvent(new CustomEvent("atlas:lang", { detail: key }));
}

// In the nav list so Bootstrap's collapse hides it behind the hamburger for free,
// as its own <li> because a bare <select> is not valid in a <ul>.
function mountControl() {
  const list = document.querySelector(".navbar-collapse .navbar-nav");
  if (!list || document.getElementById("nav-lang-selector")) return;

  list.insertAdjacentHTML(
    "afterbegin",
    `<li class="nav-item"><select id="nav-lang-selector" aria-label="Language">${
      LANGS.map((l) => `<option value="${l.key}">${l.label}</option>`).join("")
    }</select></li>`,
  );

  const select = document.getElementById("nav-lang-selector");
  select.value = window.atlasLang;
  select.addEventListener("change", () => setLang(select.value));
}

// State first: ?lang has to apply even if the navbar markup ever stops matching.
setLang(initialLang());

document.addEventListener("DOMContentLoaded", mountControl);
