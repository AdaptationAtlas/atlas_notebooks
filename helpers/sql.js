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

// A row states its own admin level through NULLs: a country row holds a NULL
// admin1_name, a region row holds an admin1_name but a NULL admin2_name. Both
// exported queries pick a level that way; `offset` is all that separates them.
function adminWhere({ admin0 = [], admin1 = [], admin2 = [] } = {}, bind, options, offset) {
  const { maxLevel = 2, iso3 } = options ?? {};

  if (!bind || typeof bind.list !== "function") {
    throw new TypeError("admin filtering requires bindings from createSqlBindings()");
  }

  const names = (values) => (Array.isArray(values) ? values.filter(Boolean) : []);
  const selected = [names(admin0), names(admin1), names(admin2)];

  // Levels chosen from the top, stopping at the first gap.
  const gap = selected.findIndex((level) => level.length === 0);
  const depth = gap === -1 ? selected.length : gap;

  // Deeper selections become highlights when the table stops at a higher level.
  const level = Math.min(Math.max(depth + offset, 0), maxLevel);

  // Scope by every name at or above the level drawn, then pick that level by
  // nullability. Never scope past `level`, or a table that stops higher would be
  // asked for a name in a column it holds NULL.
  const conditions = [];
  if (iso3) conditions.push(`iso3 IN (${bind.list([...iso3])})`);
  for (const [index, values] of selected.slice(0, Math.min(depth, level - offset)).entries()) {
    conditions.push(`${ADMIN_FIELD[index]} IN (${bind.list(values)})`);
  }
  conditions.push(level >= 1 ? "admin1_name IS NOT NULL" : "admin1_name IS NULL");
  conditions.push(level >= 2 ? "admin2_name IS NOT NULL" : "admin2_name IS NULL");

  return conditions.join(" AND ");
}

/** Select the rows inside the selection: pick a country, list its regions. */
export function sqlAdminWhere(selection, bind, options) {
  return adminWhere(selection, bind, options, 0);
}

/**
 * Select the row for the selection itself: pick a country, get that country's
 * own row. A dataset holding a whole-area row says so through the selection —
 * `{ admin0: ["SSA"] }` — rather than through an option here.
 */
export function sqlAdminAt(selection, bind, options) {
  return adminWhere(selection, bind, options, -1);
}
