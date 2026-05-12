export function toSqlString(value) {
  return !value ? null : `'${String(value).replace(/'/g, "''")}'`;
}

export function toSqlInList(values) {
  return values.map(toSqlString).join(", ");
}

// Clean escape single quotes in admin queeries.
// cleanAdminInput_SQL = (name) => {
//   return !name ? null : name.replace(/'/g, "''");
// };
//
// removals = {
//   // Not all data avalaible for all countries (i.e. exposure is ssa only, so filter to these countries)
//   const country_list = await FileAttachment("/data/shared/atlas_countries.json").json();
//   const excluded = country_list
//     .filter(({ include }) => !include)
//     .map(({ admin0_name }) => admin0_name);
//
//   return excluded;
// };

export function sqlAdminQuery(admin0_name, admin1_name) {
  const admin0 = toSqlInList(admin0_name);
  const admin1 = toSqlInList(admin1_name);
  // const admin2 = toSqlString(admin2Select?.admin2_name);

  const conditions = [
    admin0
      ? `admin0_name IN (${admin0}) AND admin1_name IS NOT NULL`
      : `admin1_name IS NULL`,

    admin1 ? `admin1_name IN (${admin1})` : `admin2_name IS NULL`,

    admin1 && `admin2_name IS NOT NULL`,

    // `admin0_name NOT IN ('${removals.join("', '")}')`,
  ];

  return conditions.filter(Boolean).join(" AND ");
}

export function sqlAdminQuerySpecific(admin0_name, admin1_name, admin2_name) {
  const admin0 = toSqlString(admin0_name);
  const admin1 = toSqlString(admin1_name);
  const admin2 = toSqlString(admin2_name);

  const conditions = [
    admin0 ? `admin0_name = ${admin0}` : `admin0_name = 'SSA'`,
    admin1 ? `admin1_name = ${admin1}` : `admin1_name IS NULL`,
    admin2 ? `admin2_name = ${admin2}` : `admin2_name IS NULL`,
  ];

  return conditions.join(" AND ");
}
