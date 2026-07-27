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
 * Selecting districts is not a filtering level: the CIS notebook uses an admin-2
 * selection to highlight districts inside the selected regions, so the query
 * still returns the admin-2 rows for those regions. Add an `admin2` clause when a
 * notebook actually needs to filter by it.
 *
 * @param {{admin0?: string[], admin1?: string[]}} selection
 *   Arrays of `admin0_name` / `admin1_name` values.
 * @param {ReturnType<typeof createSqlBindings>} bind
 * @returns {string} WHERE fragment, safe to interpolate (contains only `?`)
 */
export function sqlAdminWhere({ admin0 = [], admin1 = [] } = {}, bind) {
  if (!bind || typeof bind.list !== "function") {
    throw new TypeError("sqlAdminWhere() requires bindings from createSqlBindings()");
  }

  const names = (values) => (Array.isArray(values) ? values.filter(Boolean) : []);
  const [a0, a1] = [names(admin0), names(admin1)];

  const conditions = [
    a0.length
      ? `admin0_name IN (${bind.list(a0)}) AND admin1_name IS NOT NULL`
      : "admin1_name IS NULL",
    a1.length
      ? `admin1_name IN (${bind.list(a1)}) AND admin2_name IS NOT NULL`
      : "admin2_name IS NULL",
  ];

  return conditions.join(" AND ");
}
