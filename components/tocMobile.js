// Quarto builds its collapsible sidebar toggle only for sites that declare
// `sidebar:` navigation; this one is navbar-only, so below 768px Quarto simply
// display:none's the margin TOC and mobile readers get no TOC at all.
//
// Wrap nav#TOC in a native <details> instead — the same disclosure the prose
// notes use — reusing the existing bilingual #toc-title as its <summary>. On
// small screens the whole sidebar div moves into <main>, where it is a normal
// block rather than a grid cell that would overlap the article; moving the div
// (not just the nav) keeps every .sidebar-scoped rule in styles/toc.css.
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("quarto-margin-sidebar");
  const nav = sidebar?.querySelector('nav[role="doc-toc"]');
  const main = document.getElementById("quarto-document-content");
  const content = document.getElementById("quarto-content");
  if (!nav || !main || !content) return;

  const details = document.createElement("details");
  details.className = "toc-mobile";
  const summary = document.createElement("summary");
  // ponytail: toc-title is set in _quarto.yml, so the h2 is always there.
  summary.append(nav.querySelector("h2"));
  details.append(summary, nav);
  sidebar.append(details);

  // Keep in sync with the 768px breakpoint in styles/toc.css. `change` fires on
  // rotation too, which crosses this breakpoint on most phones.
  const wide = window.matchMedia("(min-width: 768px)");
  const place = () => {
    details.open = wide.matches;
    (wide.matches ? content : main).prepend(sidebar);
  };
  wide.addEventListener("change", place);
  place();
});
