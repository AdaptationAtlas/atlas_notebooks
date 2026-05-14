const SECTION_ORDER = [
  "keyFacts",
  "recentChanges",
  "futureProjections",
  "extremeEvents",
  "hazardExposure",
];

const SECTION_LABELS = {
  keyFacts: "Key Demographic and Economic Facts",
  recentChanges: "Recent Changes in Key Climatic Indicators",
  futureProjections: "Future Climate Projections",
  extremeEvents: "Extreme Events",
  hazardExposure: "Crop and Livestock Exposure to Climate Hazards",
};

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

  const bySection = new Map();
  for (const ds of datasets) {
    const sections = Array.isArray(ds.sections) ? ds.sections : [];
    for (const section of sections) {
      if (!bySection.has(section)) bySection.set(section, []);
      bySection.get(section).push(ds);
    }
  }

  const sectionsOrdered = [
    ...SECTION_ORDER.filter((s) => bySection.has(s)),
    ...[...bySection.keys()].filter((s) => !SECTION_ORDER.includes(s)),
  ];

  const renderCard = (ds) => {
    const title = ds.name?.trim() || ds.key || "Unnamed dataset";
    const description =
      ds.description?.trim() || "No description provided.";

    const s3Paths =
      Array.isArray(ds.s3_paths) && ds.s3_paths.length
        ? ds.s3_paths
        : ds.s3_path
          ? [ds.s3_path]
          : [];

    const stacUrl = ds.stac?.trim() ? ds.stac : null;

    const s3RowsHtml = s3Paths.length
      ? s3Paths
          .map(
            (p) => `
              <div class="dataset-s3-row">
                <code class="dataset-s3-path">${escapeHtml(p)}</code>
                <button
                  type="button"
                  class="dataset-copy-btn"
                  onclick="navigator.clipboard.writeText('${escapeJsString(p)}')"
                >
                  Copy S3 path
                </button>
              </div>`,
          )
          .join("")
      : `<div class="dataset-s3-row">No S3 path available</div>`;

    const stacHtml = stacUrl
      ? `
          <div>
            <dt>STAC</dt>
            <dd>
              <a href="${escapeAttr(stacUrl)}"
                 target="_blank"
                 class="dataset-stac-link">Open STAC catalog</a>
            </dd>
          </div>`
      : "";

    const downloadHref = ds.local_path || s3Paths[0] || "#";
    const downloadDisabled = downloadHref === "#" ? "disabled" : "";

    return `
      <article class="dataset-card">
        <header class="dataset-header">
          <h3 class="dataset-title">${escapeHtml(title)}</h3>
        </header>

        <p class="dataset-description">${escapeHtml(description)}</p>

        <dl class="dataset-meta">
          ${stacHtml}

          <div>
            <dt>Data location</dt>
            <dd>${s3RowsHtml}</dd>
          </div>
        </dl>

        <footer class="dataset-actions">
          <a href="${escapeAttr(downloadHref)}"
             class="dataset-download-btn"
             ${downloadDisabled}
             download>
            Download dataset
          </a>
        </footer>
      </article>
    `;
  };

  return sectionsOrdered
    .map((section) => {
      const label = SECTION_LABELS[section] || section;
      const cards = bySection.get(section).map(renderCard).join("\n");
      return `
        <section class="dataset-section">
          <h3 class="dataset-section-heading">${escapeHtml(label)}</h3>
          ${cards}
        </section>
      `;
    })
    .join("\n");
}
