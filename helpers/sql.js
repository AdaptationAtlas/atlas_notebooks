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
