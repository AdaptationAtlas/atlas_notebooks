export function patchWindowsCache(url) {
  let isWindows = false;
  if (navigator.userAgentData) { // not supported by Fx, although issue seems isolated to Chromium browsers
    isWindows = navigator.userAgentData.platform === "Windows";
  } else {
    isWindows = navigator.userAgent.toLowerCase().includes("windows");
  }

  return isWindows
    ? `${url}?t=${Date.now()}`
    : url;
}


export const boundary_paths = { // NOTE: These are the current boundaries, but they will be updated soon to use new and signifigantly smaller file size boundaries
  admin0_path: "/data/shared/atlas-region_admin0_simplified.json",
  admin1_path: "https://digital-atlas.s3.us-east-1.amazonaws.com/domain=boundaries/type=admin/source=geoboundaries/region=ssa/processing=simplified/level=adm1/atlas-region_admin1_simplified.parquet",
  admin2_path: "https://digital-atlas.s3.us-east-1.amazonaws.com/domain=boundaries/type=admin/source=geoboundaries/region=ssa/processing=simplified/level=adm1/atlas-region_admin2_simplified.parquet",
};