/**
 * Add a cache-busting query string to URLs when running on Windows,
 * to prevent TopoJSON from being loaded from cache.
 *
 * https://github.com/duckdb/duckdb-wasm/issues/1658
 *
 * @param {string} url - URL to patch
 * @returns {string} patched URL if on Windows, original URL otherwise
 */
export function patchWindowsCache(url) {
  let isWindows = false;
  if (navigator.userAgentData) {
    // not supported by Fx, although issue seems isolated to Chromium browsers
    isWindows = navigator.userAgentData.platform === "Windows";
  } else {
    isWindows = navigator.userAgent.toLowerCase().includes("windows");
  }

  return isWindows ? `${url}?t=${Date.now()}` : url;
}

export const boundary_paths = {
  admin0_path: "/data/shared/atlas_gaul24_a0_africa_simple-vlowres.topojson", // lyr: atlas_gaul24_a0_africa
  admin1_path: "/data/shared/atlas_gaul24_a1_africa_simple-vlowres.topojson", // lyr: atlas_gaul24_a1_africa
  admin2_path: "/data/shared/atlas_gaul_a2_africa_simple-lowres.topojson", // lyr: atlas_gaul_a2_africa
};
