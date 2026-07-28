/**
 * Resolve an Atlas administrative selection into the boundaries a map should draw.
 *
 * Every Atlas notebook that lets the reader drill through admin levels wants the
 * same rule:
 *
 *   nothing selected      -> draw admin 0, whole region
 *   a country selected    -> draw its admin 1 units
 *   an admin 1 selected   -> draw its admin 2 units, outlining any that are selected
 *
 * with one wrinkle: a dataset does not always reach admin 2. When the selection
 * goes deeper than the boundaries do, the extra selection stops filtering and
 * starts highlighting instead — so an admin-1-only dataset shows a country's
 * regions and outlines the chosen one, rather than showing nothing.
 *
 * That falls out of one rule: `level = min(selectionDepth, maxLevel)`. Levels
 * above `level` scope which features are drawn; the selection *at* `level` is
 * outlined, because it cannot narrow the view any further.
 *
 * This resolves a selection; it does not plot, fetch, or filter. `selectedAtLevel`
 * is plain data — the field to read and the names selected in it — because callers
 * want different things from that fact: an outline on a map, a count in a sentence,
 * a column in an export. What it does not leave to the caller is pairing the field
 * with the level, which is the rule this owns: at full depth the leaf is the admin-2
 * selection, under maxLevel 1 it is the admin-1 one.
 *
 * `adminKey` stays a function on purpose. A join key has to be built the same way
 * on both sides or the join silently matches nothing, so the convention — which
 * fields, in what order, how nulls are handled — belongs here rather than being
 * retyped per call site.
 *
 * Drawing an outline is `makeChoropleth`'s `adminHighlight` (helpers/atlasMap.ojs);
 * joining data to the features is `mergeDataToBoundaries`.
 */

const LEVEL_NAME = ["admin0_name", "admin1_name", "admin2_name"];

/**
 * Accepts what `createAdminSelectors` produces at any level — an array in
 * multiple-select mode, a single object or null in single-select mode — as well
 * as a plain array of names, and returns the names.
 */
function selectedNames(value, field) {
  const list = value == null ? [] : Array.isArray(value) ? value : [value];
  return list
    .map((entry) => (entry && typeof entry === "object" ? entry[field] : entry))
    .filter((name) => name != null);
}

/**
 * @param {object} config
 * @param {{admin0?: object, admin1?: object, admin2?: object}} config.boundaries
 *   GeoJSON FeatureCollection per level, as `getAdminBoundaries()` returns. The
 *   deepest one present sets how far the map can drill unless `maxLevel` says less.
 * @param {{admin0?: *, admin1?: *, admin2?: *}} config.selection
 *   A `createAdminSelectors` value, or arrays of names.
 * @param {number} [config.maxLevel] Deepest level to draw. Defaults to the deepest
 *   boundary set supplied — pass it explicitly when the *data* is shallower than
 *   the geometry.
 * @returns {{level: number, boundaries: object, adminKey: (props: object) => string,
 *   selectedAtLevel: {field: string, names: string[]}|null}}
 */
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

  // How deep the reader has drilled: picking a country asks for its regions,
  // picking a region asks for its districts.
  const requested =
    selected[0].length === 0 ? 0 : selected[1].length === 0 ? 1 : 2;
  const level = Math.min(requested, deepest);

  const collection = boundaries[`admin${level}`];

  // Levels above the drawn one narrow it. An empty level imposes nothing, which
  // only arises when maxLevel capped a deeper request.
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

  // The selection at the drawn level cannot narrow the view, so it marks units
  // instead. Reported as the field to look at and the names in it; null when
  // nothing is selected there, so `if (!selectedAtLevel)` is the whole check.
  const namesAtLevel = selected[level] ?? [];
  const selectedAtLevel = namesAtLevel.length
    ? { field: LEVEL_NAME[level], names: namesAtLevel }
    : null;

  const keyFields = LEVEL_NAME.slice(0, level + 1);
  const adminKey = (properties) =>
    keyFields.map((field) => properties?.[field] ?? "").join("|");

  return { level, boundaries: scoped, adminKey, selectedAtLevel };
}
