// chartExportV2 — generalised chart-export helper (PNG / SVG / CSV).
//
// Plain ES-module form (`.js` not `.ojs`) so the Observable Parser stays
// out of the way. Previous `.ojs` version had a cell that wouldn't bind
// cleanly; switching to `.js` + named ES exports bypasses that.
//
// PNG / SVG strategies:
//   - bare <svg>                              → single-svg
//   - <figure> with one inner <svg> + <style> → plot-figure
//     (bake style into SVG → single-svg path; no trailing whitespace)
//   - everything else (multi-SVG grid, HTML legend wrapper, pure HTML)
//                                             → composite-html2img
//     (delegates to html-to-image — MIT, ~30 KB ESM via esm.sh)
//
// CSV: caller supplies `data` array (+ optional `columns`); helper
// produces RFC 4180-ish output with UTF-8 BOM (added by triggerDownload).

// ---------- Lazy CDN load of html-to-image -----------------------
const _libCache = { lib: null, pending: null };

function _loadLib() {
  if (_libCache.lib) return Promise.resolve(_libCache.lib);
  if (!_libCache.pending) {
    _libCache.pending = import("https://esm.sh/html-to-image@1.11.13");
  }
  return _libCache.pending.then((lib) => {
    _libCache.lib = lib;
    return lib;
  });
}

// ---------- Strategy detection -----------------------------------
export function detectExportStrategyV2(rootElement) {
  if (!rootElement) return null;
  if (rootElement.tagName && rootElement.tagName.toLowerCase() === "svg") return "single-svg";
  if (rootElement.tagName && rootElement.tagName.toLowerCase() === "figure") {
    const svgs = rootElement.querySelectorAll(":scope > svg");
    if (svgs.length === 1) return "plot-figure";
  }
  return "composite-html2img";
}

// ---------- Plot.plot <figure> style bake -----------------------
// Inline-clone the figure's sibling <style> tag into the SVG so
// class-based fills / strokes survive a standalone export.
function _bakeFigureStyles(rootElement) {
  if (!rootElement || !rootElement.tagName) return rootElement;
  if (rootElement.tagName.toLowerCase() !== "figure") return rootElement;
  const svg = rootElement.querySelector(":scope > svg");
  const styles = rootElement.querySelectorAll(":scope > style");
  if (!svg || !styles.length) return rootElement;
  for (const s of styles) {
    if (svg.querySelector(":scope > style")) break;
    svg.insertBefore(s.cloneNode(true), svg.firstChild);
  }
  return rootElement;
}

// ---------- SVG serialise ----------------------------------------
function _serialiseSvg(svg) {
  const clone = svg.cloneNode(true);
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("xmlns:xlink")) clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  const bbox = svg.getBoundingClientRect();
  if (!clone.getAttribute("width"))  clone.setAttribute("width",  bbox.width);
  if (!clone.getAttribute("height")) clone.setAttribute("height", bbox.height);
  return new XMLSerializer().serializeToString(clone);
}

// ---------- Resolve rootElement → inner SVG ---------------------
function _resolveSvg(rootElement) {
  _bakeFigureStyles(rootElement);
  if (rootElement.tagName && rootElement.tagName.toLowerCase() === "svg") return rootElement;
  if (rootElement.tagName && rootElement.tagName.toLowerCase() === "figure") {
    const inner = rootElement.querySelector(":scope > svg");
    if (inner) return inner;
  }
  const fallback = rootElement.querySelector("svg");
  if (fallback) return fallback;
  throw new Error("chartExportV2: no SVG found in rootElement for single-svg path");
}

// ---------- Single-SVG fast PNG path ----------------------------
function _singleSvgPng(svg, scale) {
  const dpr = scale || 2;
  const svgString = _serialiseSvg(svg);
  const bbox = svg.getBoundingClientRect();
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = Math.max(1, Math.round(bbox.width  * dpr));
      canvas.height = Math.max(1, Math.round(bbox.height * dpr));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => {
        URL.revokeObjectURL(url);
        if (b) resolve(b);
        else   reject(new Error("chartExportV2: canvas.toBlob returned null"));
      }, "image/png");
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("chartExportV2: Image() failed to parse single-svg payload"));
    };
    im.src = url;
  });
}

// ---------- Public: PNG ------------------------------------------
export async function exportChartPngV2(opts) {
  const o = opts || {};
  const rootElement = o.rootElement;
  const scale = o.scale;
  const strategy = o.strategy || detectExportStrategyV2(rootElement);
  if (strategy === "single-svg" || strategy === "plot-figure") {
    return _singleSvgPng(_resolveSvg(rootElement), scale);
  }
  const lib = await _loadLib();
  return lib.toBlob(rootElement, {
    pixelRatio: scale || 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });
}

// ---------- Public: SVG ------------------------------------------
export async function exportChartSvgV2(opts) {
  const o = opts || {};
  const rootElement = o.rootElement;
  const strategy = o.strategy || detectExportStrategyV2(rootElement);
  if (strategy === "single-svg" || strategy === "plot-figure") {
    return _serialiseSvg(_resolveSvg(rootElement));
  }
  const lib = await _loadLib();
  const dataUrl = await lib.toSvg(rootElement, {
    backgroundColor: "#ffffff",
    cacheBust: true,
  });
  const prefix = "data:image/svg+xml;charset=utf-8,";
  if (dataUrl.startsWith(prefix)) return decodeURIComponent(dataUrl.slice(prefix.length));
  const b64Prefix = "data:image/svg+xml;base64,";
  if (dataUrl.startsWith(b64Prefix)) return atob(dataUrl.slice(b64Prefix.length));
  return dataUrl;
}

// ---------- Public: CSV ------------------------------------------
export function exportDataCsvV2(opts) {
  const o = opts || {};
  const data = o.data;
  const columns = o.columns;
  if (!Array.isArray(data) || data.length === 0) return "";
  const cols = columns || Object.keys(data[0]);
  const esc = (v) => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = cols.map(esc).join(",");
  const body = data.map((row) => cols.map((c) => esc(row[c])).join(",")).join("\n");
  return header + "\n" + body;
}

// ---------- Public: triggerDownload ------------------------------
export function triggerDownloadV2(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
