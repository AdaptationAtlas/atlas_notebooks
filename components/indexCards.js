function getNotebookList(data) {
  const notebooks = Array.isArray(data)
    ? data
    : Array.isArray(data?.notebooks)
      ? data.notebooks
      : [];

  return notebooks.filter((nb) => !nb.hide);
}

function notebookUrl(path) {
  if (typeof path !== "string") return null;

  const href = path.replace(/\.qmd(?=($|[?#]))/, ".html");

  try {
    const url = new URL(href, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? href : null;
  } catch {
    return null;
  }
}

function statusMessage(message) {
  const status = document.createElement("p");
  status.textContent = message;
  return status;
}

function notebookCard(notebook) {
  const title =
    notebook?.title?.en || notebook?.id || "Notebook";
  const href = notebookUrl(notebook?.path);
  if (!href) return null;

  const card = document.createElement("a");
  card.className = "notebook-card";
  card.href = href;

  const imageWrap = document.createElement("div");
  imageWrap.className = "notebook-card__image-wrap";

  const image = document.createElement("img");
  image.className = "notebook-card__image";
  image.src = notebook?.image || "images/default_crop.webp";
  image.alt = String(title);
  image.loading = "lazy";
  image.decoding = "async";
  imageWrap.appendChild(image);

  const heading = document.createElement("p");
  heading.className = "notebook-card__title";
  heading.textContent = String(title);

  card.append(imageWrap, heading);
  return card;
}

function renderNotebookCards(grid, notebooks) {
  if (!notebooks.length) {
    grid.replaceChildren(statusMessage("No notebooks found."));
    return;
  }

  const cards = notebooks.map(notebookCard).filter(Boolean);
  grid.replaceChildren(
    ...(cards.length ? cards : [statusMessage("No notebooks found.")]),
  );
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
    grid.replaceChildren(
      statusMessage("Error loading notebooks. Please try again later."),
    );
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", initNotebookGrid);
