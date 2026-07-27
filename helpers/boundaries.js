let wkxModulePromise;
let bufferModulePromise;
let topojsonClientPromise;

export async function geojsonFromWKB_wk(wkb, data = null) {
  if (!wkxModulePromise) {
    wkxModulePromise = import("https://bundle.run/wkx@0.5.0");
  }
  if (!bufferModulePromise) {
    bufferModulePromise = import("https://cdn.jsdelivr.net/npm/buffer@6.0.3/+esm");
  }

  const wkx = await wkxModulePromise;
  const { Buffer } = await bufferModulePromise;

  if (data && wkb.length !== data.length) {
    throw new Error(`Data length mismatch: expected ${wkb.length}, got ${data.length}`);
  }

  return {
    type: "FeatureCollection",
    features: wkb.map((wkbItem, i) => ({
      ...wkx.Geometry.parse(Buffer.from(wkbItem)).toGeoJSON(),
      properties: data ? data[i] : null
    }))
  };
}

export async function read_topojson(url, objectName) {
  if (!topojsonClientPromise) {
    topojsonClientPromise = import("https://cdn.jsdelivr.net/npm/topojson-client@3/+esm");
  }
  const { feature } = await topojsonClientPromise;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch TopoJSON: ${response.statusText}`);
  }

  const topology = await response.json();

  if (!topology.objects[objectName]) {
    throw new Error(`Object "${objectName}" not found in TopoJSON.`);
  }

  return feature(topology, topology.objects[objectName]);
}

  