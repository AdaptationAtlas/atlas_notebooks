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

/** Select rows at the implied admin level, capped to the table's maxLevel. */
export function sqlAdminWhere(
  { admin0 = [], admin1 = [] } = {},
  bind,
  { maxLevel = 2, iso3 } = {},
) {
  if (!bind || typeof bind.list !== "function") {
    throw new TypeError("sqlAdminWhere() requires bindings from createSqlBindings()");
  }

  const names = (values) => (Array.isArray(values) ? values.filter(Boolean) : []);
  const [a0, a1] = [names(admin0), names(admin1)];

  // Deeper selections become highlights when the table stops at a higher level.
  const level = Math.min(a0.length === 0 ? 0 : a1.length === 0 ? 1 : 2, maxLevel);

  // Scope by parent names, then select one level via nullability.
  const conditions = [];
  if (iso3) conditions.push(`iso3 IN (${bind.list([...iso3])})`);
  if (level >= 1) conditions.push(`admin0_name IN (${bind.list(a0)})`);
  if (level >= 2) conditions.push(`admin1_name IN (${bind.list(a1)})`);
  conditions.push(level >= 1 ? "admin1_name IS NOT NULL" : "admin1_name IS NULL");
  conditions.push(level >= 2 ? "admin2_name IS NOT NULL" : "admin2_name IS NULL");

  return conditions.join(" AND ");
}
