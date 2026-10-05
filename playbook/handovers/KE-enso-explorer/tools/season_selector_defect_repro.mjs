// season_selector_defect_repro.mjs — KE-49 item 2 / Decision D39.
//
// Shows that 6 of the 16 driver x season combinations the UI offers throw a
// TypeError, and that 2 more return a silently wrong series.
//
//   run:  node season_selector_defect_repro.mjs
//
// Why a unit repro and not a browser one: driving the live page from this
// sandbox did not work. notebook_v3.html loads with 0 console errors and 0
// failed requests under both a plain static server and `quarto preview`, but
// the OJS cells never evaluate there, so the controls are not reachable. The
// functions below are therefore copied VERBATIM from notebook_v3.qmd
// (seasonMonthsFor qmd:14619, zByYear qmd:14859, phaseDefs, zSeries qmd:14868)
// with only the d3 helpers stubbed, so the control flow is the notebook's own.
// A 2-click manual confirm in a real browser is still worth doing before the
// issue is closed.
//
// The call site that matters is qmd:11902, inside the Section 3 composite
// panel, which passes the GLOBAL `season` straight into zSeries:
//       const m = zSeries(drvName, season);
// `seasonMonthsFor` has only OND and MAM keys, so `annual` and `OND+MAM`
// resolve to undefined and reach `mons.includes(...)` at qmd:14862.
//
// Note the two "ok" cells that are not ok: ENSO (RONI) with annual or OND+MAM
// does not throw, because the roni branch short-circuits on
// `season === "OND" ? roniZOnd : roniZMam` -- so an `annual` selection is
// silently served the MAM z-series.


const d3 = {
  rollups: (arr, red, key) => {
    const m = new Map();
    for (const d of arr) { const k = key(d); if (!m.has(k)) m.set(k, []); m.get(k).push(d); }
    return [...m].map(([k, v]) => [k, red(v)]);
  },
  mean: (a, f) => { const v = f ? a.map(f) : a; return v.reduce((s, x) => s + x, 0) / v.length; },
  deviation: (a) => 1,
};

// a couple of plausible rows; the shape is all that matters here
const drivers = [
  {year: 2019, month: 11, roni: 0.4, dmi_hadisst: 1.9, dmi_ersst: 1.9, wnp_std_mam: 0.1},
  {year: 2019, month: 4,  roni: 0.6, dmi_hadisst: 0.2, dmi_ersst: 0.2, wnp_std_mam: 0.3},
];
const roniZOnd = new Map([[2019, 0.4]]), roniZMam = new Map([[2019, 0.6]]);

// --- qmd:14619 ---
const seasonMonthsFor = ({OND: [10, 11, 12], MAM: [3, 4, 5]});

// --- qmd:14859 ---
const zByYear = (col, mons) => {
  const getCol = (d) => d[col] ?? (col === "dmi_hadisst" ? d.dmi_ersst : null);
  const byYear = d3.rollups(
    drivers.filter((d) => mons.includes(d.month) && getCol(d) != null),
    (v) => d3.mean(v, (d) => getCol(d)), (d) => d.year);
  const ref = byYear.filter(([y]) => y >= 1991 && y <= 2020).map(([, v]) => v);
  const m = d3.mean(ref), s = d3.deviation(ref) || 1;
  return new Map(byYear.map(([y, v]) => [y, (v - m) / s]));
};

// --- qmd:14839-ish ---
const phaseDefs = ({
  "ENSO + IOD":      {members: ["roni", "dmi_hadisst"], pos: "El Niño/+IOD", neg: "La Niña/−IOD"},
  "ENSO (RONI)":     {members: ["roni"], pos: "El Niño", neg: "La Niña"},
  "IOD (DMI)":       {members: ["dmi_hadisst"], pos: "+IOD", neg: "−IOD"},
  "Western-V (WNP)": {members: ["wnp_std_mam"], pos: "High Western-V", neg: "Low Western-V"},
});

// --- qmd:14868 ---
const zSeries = (driver, season) => {
  const def = phaseDefs[driver] ?? phaseDefs["ENSO (RONI)"], mons = seasonMonthsFor[season];
  const maps = def.members.map((c) =>
    (c === "roni" || c === "nino34_anom_noaa") ? (season === "OND" ? roniZOnd : roniZMam) : zByYear(c, mons));
  const raw = new Map();
  for (const y of maps[0].keys()) {
    const zs = maps.map((m) => m.get(y));
    if (zs.every((z) => z != null && !Number.isNaN(z))) raw.set(y, d3.mean(zs));
  }
  return raw;
};

// qmd:11902 call site is  zSeries(drvName, season)  with the GLOBAL season.
const drivers_ui = ["ENSO (RONI)", "IOD (DMI)", "Western-V (WNP)", "ENSO + IOD"];
const seasons_ui = ["OND", "MAM", "OND+MAM", "annual"];

console.log("zSeries(driver, season) — global season reaches qmd:11902 unguarded\n");
console.log("driver".padEnd(18) + seasons_ui.map(s => s.padEnd(12)).join(""));
for (const dv of drivers_ui) {
  let row = dv.padEnd(18);
  for (const se of seasons_ui) {
    let r;
    try { zSeries(dv, se); r = "ok"; }
    catch (e) { r = "THROWS " + e.constructor.name; }
    row += r.padEnd(12);
  }
  console.log(row);
}
console.log("\nexample message:");
try { zSeries("IOD (DMI)", "annual"); } catch (e) { console.log("  " + e.message); }
