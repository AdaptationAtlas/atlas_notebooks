/**
 * Build SQL placeholders while collecting their parameter values in order.
 *
 * Use the returned fragments only where SQL values are expected. Table names,
 * column names, and other SQL syntax cannot be parameterized this way.
 *
 * @returns {{
 *   value: (value: *) => string,
 *   list: (values: Array<*>) => string,
 *   readonly params: Array<*>
 * }}
 */
export function createSqlBindings() {
  const params = [];

  return {
    value(value) {
      params.push(value);
      return "?";
    },

    list(values) {
      if (!Array.isArray(values)) {
        throw new TypeError("list() expects an array");
      }

      if (values.length === 0) return "NULL";

      params.push(...values);
      return values.map(() => "?").join(", ");
    },

    get params() {
      return [...params];
    },
  };
}

/**
 * Build the WHERE fragment that selects Atlas rows at the administrative level
 * implied by a selection, drilling down as the user selects.
 *
 * The Atlas tables store one row per unit at every level, with the deeper name
 * columns NULL — so the level is chosen by which columns are constrained:
 *
 *   nothing selected     -> admin1_name IS NULL AND admin2_name IS NULL   (countries)
 *   countries selected   -> those countries, admin1_name IS NOT NULL      (regions)
 *   regions also chosen  -> those regions, admin2_name IS NOT NULL        (districts)
 *
 * Values go through `bind`, so names containing apostrophes (Côte d'Ivoire) need
 * no escaping. Because the parameters are positional, build the fragments in the
 * order they appear in the SQL — call this before appending further `bind`
 * fragments that follow it in the statement.
 *
 * Selecting districts is not a filtering level: an admin-2 selection highlights
 * districts inside the selected regions, so the query still returns every admin-2
 * row for those regions.
 *
 * `maxLevel` is how deep the table itself goes, and it is the same idea as
 * `maxLevel` in helpers/adminBoundaries.js — keep the two in step for one dataset,
 * or the map and the rows disagree about which level is on screen. A table that
 * stops at admin 1 must say so, otherwise a region selection asks it for
 * `admin2_name IS NOT NULL` and it returns nothing at all.
 *
 * @param {{admin0?: string[], admin1?: string[]}} selection
 *   Arrays of `admin0_name` / `admin1_name` values.
 * @param {ReturnType<typeof createSqlBindings>} bind
 * @param {object} [options]
 * @param {number} [options.maxLevel=2] Deepest level present in the table.
 * @returns {string} WHERE fragment, safe to interpolate (contains only `?`)
 */
export function sqlAdminWhere(
  { admin0 = [], admin1 = [] } = {},
  bind,
  { maxLevel = 2 } = {},
) {
  if (!bind || typeof bind.list !== "function") {
    throw new TypeError("sqlAdminWhere() requires bindings from createSqlBindings()");
  }

  const names = (values) => (Array.isArray(values) ? values.filter(Boolean) : []);
  const [a0, a1] = [names(admin0), names(admin1)];

  // Same rule as the boundary resolver: a selection deeper than the table stops
  // narrowing and becomes a highlight, so the rows stay at the level it can reach.
  const level = Math.min(a0.length === 0 ? 0 : a1.length === 0 ? 1 : 2, maxLevel);

  // Levels above the target scope it; then the target's name column must be
  // present and everything deeper absent, which is what picks out one level.
  const conditions = [];
  if (level >= 1) conditions.push(`admin0_name IN (${bind.list(a0)})`);
  if (level >= 2) conditions.push(`admin1_name IN (${bind.list(a1)})`);
  conditions.push(level >= 1 ? "admin1_name IS NOT NULL" : "admin1_name IS NULL");
  conditions.push(level >= 2 ? "admin2_name IS NOT NULL" : "admin2_name IS NULL");

  return conditions.join(" AND ");
}
