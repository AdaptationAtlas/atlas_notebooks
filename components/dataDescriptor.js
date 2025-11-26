export function buildDatasetDescriptor(datasets) {
  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const escapeAttr = escapeHtml;

  const escapeJsString = (str) =>
    String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  const slugify = (str) =>
    String(str)
      .trim()
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return datasets
    .map((ds) => {
      const key = ds.key || "Unnamed dataset";
      const description = ds.description?.trim() || "No description provided.";
      const s3Path = ds.s3_path || "";
      const localPath = ds.local_path || "";
      const downloadHref = localPath || s3Path || "#";

      const sections = Array.isArray(ds.sections) ? ds.sections : [];
      const stacUrl = ds.stac?.trim() ? ds.stac : null;

      const sectionsHtml = sections
        .map((section) => {
          const id = slugify(section);
          return `<a href="#${escapeAttr(id)}" class="dataset-section-link">${escapeHtml(
            section,
          )}</a>`;
        })
        .join(", ");

      const stacHtml = stacUrl
        ? `<a href="${escapeAttr(
            stacUrl,
          )}" target="_blank" class="dataset-stac-link">Open STAC catalog</a>`
        : `<span>No STAC catalog link</span>`;

      const s3Html = s3Path
        ? `
          <div class="dataset-s3">
            <code class="dataset-s3-path">${escapeHtml(s3Path)}</code>
            <button
              type="button"
              class="dataset-copy-btn"
              onclick="navigator.clipboard.writeText('${escapeJsString(
                s3Path,
              )}')"
            >
              Copy S3 path
            </button>
          </div>`
        : `<div class="dataset-s3">No S3 path available</div>`;

      const downloadHtml = `
        <a href="${escapeAttr(downloadHref)}"
           class="dataset-download-btn"
           download>
          Download dataset
        </a>`;

      return `
        <article class="dataset-card">
          <header class="dataset-header">
            <h3 class="dataset-title">${escapeHtml(key)}</h3>
          </header>

          <p class="dataset-description">${escapeHtml(description)}</p>

          <dl class="dataset-meta">
            <div>
              <dt>Sections</dt>
              <dd>${sectionsHtml || "<span>None</span>"}</dd>
            </div>

            <div>
              <dt>STAC</dt>
              <dd>${stacHtml}</dd>
            </div>

            <div>
              <dt>Data location</dt>
              <dd>${s3Html}</dd>
            </div>
          </dl>

          <footer class="dataset-actions">
            ${downloadHtml}
          </footer>
        </article>
      `;
    })
    .join("\n");
}
