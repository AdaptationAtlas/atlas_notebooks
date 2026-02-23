function getNotebookList(data) {
  const notebooks = Array.isArray(data)
    ? data
    : Array.isArray(data?.notebooks)
      ? data.notebooks
      : [];

  return notebooks.filter((nb) => !nb.hide);
}

function renderNotebookCards(grid, notebooks) {
  if (!notebooks.length) {
    grid.innerHTML = "<p>No notebooks found.</p>";
    return;
  }

  const cards = notebooks
    .map((nb) => {
      const image = nb.image || "images/default_crop.webp";
      const titleEn = (nb.title && nb.title.en) || nb.id || "Notebook";
      const href =
        typeof nb.path === "string" ? nb.path.replace(".qmd", ".html") : nb.path;

      return `
        <a class="notebook-card" href="${href}">
          <div class="notebook-card__image-wrap">
            <img class="notebook-card__image" src="${image}" alt="${titleEn}">
          </div>
          <p class="notebook-card__title">${titleEn}</p>
        </a>
      `;
    })
    .join("");

  grid.innerHTML = cards;
}

async function initNotebookGrid() {
  const grid = document.getElementById("notebook-grid");
  if (!grid) return;

  try {
    const response = await fetch("notebooks.json");
    if (!response.ok) throw new Error("Unable to load notebook list.");

    const data = await response.json();
    const notebooks = getNotebookList(data);
    renderNotebookCards(grid, notebooks);
  } catch (err) {
    grid.innerHTML = "<p>Error loading notebooks. Please try again later.</p>";
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", initNotebookGrid);
