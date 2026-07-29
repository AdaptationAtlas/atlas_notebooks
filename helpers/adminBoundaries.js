// Resolve drill-down depth to available boundaries; selections beyond maxLevel
// become highlights instead of filters.

const LEVEL_NAME = ["admin0_name", "admin1_name", "admin2_name"];

/** Normalize selector objects or plain values into non-null admin names. */
function selectedNames(value, field) {
  const list = value == null ? [] : Array.isArray(value) ? value : [value];
  return list
    .map((entry) => (entry && typeof entry === "object" ? entry[field] : entry))
    .filter((name) => name != null);
}

/** Return scoped boundaries, a join key, and any selection at the drawn level. */
export function adminBoundariesForSelection({
  boundaries,
  selection = {},
  maxLevel,
} = {}) {
  if (!boundaries) {
    throw new TypeError("adminBoundariesForSelection() requires boundaries");
  }

  const available = [0, 1, 2].filter((level) => boundaries[`admin${level}`]);
  if (!available.length) {
    throw new TypeError("boundaries must include at least admin0");
  }

  const deepest = Math.min(
    available[available.length - 1],
    maxLevel ?? Infinity,
  );

  const selected = LEVEL_NAME.map((field, level) =>
    selectedNames(selection[`admin${level}`], field),
  );

  // Each selection requests the next admin level.
  const requested =
    selected[0].length === 0 ? 0 : selected[1].length === 0 ? 1 : 2;
  const level = Math.min(requested, deepest);

  const collection = boundaries[`admin${level}`];

  // Selections above the drawn level scope its features.
  const scopes = [];
  for (let above = 0; above < level; above += 1) {
    if (selected[above].length) {
      scopes.push([LEVEL_NAME[above], new Set(selected[above])]);
    }
  }

  const scoped = scopes.length
    ? {
        ...collection,
        features: collection.features.filter((feature) =>
          scopes.every(([field, names]) => names.has(feature.properties[field])),
        ),
      }
    : collection;

  // A selection at the drawn level marks units instead of narrowing them.
  const namesAtLevel = selected[level] ?? [];
  const selectedAtLevel = namesAtLevel.length
    ? { field: LEVEL_NAME[level], names: namesAtLevel }
    : null;

  const keyFields = LEVEL_NAME.slice(0, level + 1);
  const adminKey = (properties) =>
    keyFields.map((field) => properties?.[field] ?? "").join("|");

  return { level, boundaries: scoped, adminKey, selectedAtLevel };
}
