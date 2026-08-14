/** Build value placeholders and collect their parameters in order. */
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

const ADMIN_FIELD = ["admin0_name", "admin1_name", "admin2_name"];

/**
 * Select rows at the implied admin level, capped to the table's maxLevel.
 *
 * Drill-down (the default) reports one level below the selection, so picking a
 * country lists its regions. `exact: true` reports the selection itself instead
 * — the aggregate row for whatever is selected. That row has no admin0_name of
 * its own when nothing is selected, so name it with `aggregate`.
 */
export function sqlAdminWhere(
  { admin0 = [], admin1 = [], admin2 = [] } = {},
  bind,
  { maxLevel = 2, iso3, exact = false, aggregate } = {},
) {
  if (!bind || typeof bind.list !== "function") {
    throw new TypeError("sqlAdminWhere() requires bindings from createSqlBindings()");
  }

  const names = (values) => (Array.isArray(values) ? values.filter(Boolean) : []);
  const selected = [names(admin0), names(admin1), names(admin2)];

  // Levels chosen from the top, stopping at the first gap.
  const gap = selected.findIndex((level) => level.length === 0);
  const depth = gap === -1 ? selected.length : gap;

  // Deeper selections become highlights when the table stops at a higher level.
  const level = Math.min(exact ? Math.max(depth - 1, 0) : depth, maxLevel);

  // Scope by name, then select one level via nullability. Drill-down scopes by
  // the levels above the one it draws; `exact` also scopes by the one it draws.
  // Never past `level`, or a capped table gets asked for a name it holds NULL.
  const conditions = [];
  if (iso3) conditions.push(`iso3 IN (${bind.list([...iso3])})`);
  for (const [index, values] of selected
    .slice(0, Math.min(depth, exact ? level + 1 : level))
    .entries()) {
    conditions.push(`${ADMIN_FIELD[index]} IN (${bind.list(values)})`);
  }
  if (exact && depth === 0) conditions.push(`admin0_name = ${bind.value(aggregate)}`);
  conditions.push(level >= 1 ? "admin1_name IS NOT NULL" : "admin1_name IS NULL");
  conditions.push(level >= 2 ? "admin2_name IS NOT NULL" : "admin2_name IS NULL");

  return conditions.join(" AND ");
}
