import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
/**
 *
 * Calculates the average loss reduction by simulating normal distributions
 * with and without a specified change in standard deviation.
 * The reduction is expressed as a proportion of the total without the change.
 *
 * @function avlossCalc
 * @param {number} cv - Coefficient of variation (standard deviation / mean) representing the baseline variability.
 * @param {number} change - The proposed change in standard deviation.
 * @param {boolean} [fixed=false] - If true, treats `change` as an absolute reduction in CV; if false, treats it as proportional.
 * @param {number} [reps=1e6] - Number of random samples to simulate. Higher = more accurate, slower.
 * @param {boolean} [approx=true] - If true, uses a subsample of 50,000 shuffled values for faster approximate median computation.
 * @returns {number} - The estimated average loss (bounded between 0 and 1). Returns `NaN` if invalid input leads to negative SD.
 *
 */
export function avlossCalc(
  cv,
  change,
  fixed = false,
  reps = 1e6,
  approx = true,
) {
  // Calculate new standard deviation
  const sd_with = fixed
    ? Math.max(0, cv - Math.min(change, cv))
    : cv * (1 - change);
  if (sd_with < 0) return NaN;

  const sd_without = cv;

  // Generate random normal values using Box-Muller transform
  const rnorm = (n, sd) => {
    const out = new Float64Array(n);
    for (let i = 0; i < n; i += 2) {
      const u1 = Math.random();
      const u2 = Math.random();
      const mag = Math.sqrt(-2 * Math.log(u1));
      const angle = 2 * Math.PI * u2;
      out[i] = 1 + mag * Math.cos(angle) * sd;
      if (i + 1 < n) out[i + 1] = 1 + mag * Math.sin(angle) * sd;
    }
    return out;
  };

  const withArr = rnorm(reps, sd_with);
  const withoutArr = rnorm(reps, sd_without);

  // Compute medians
  const median = (arr) =>
    approx
      ? d3.median(d3.shuffle(Array.from(arr)).slice(0, 50000)) // fast sample median
      : d3.median(arr);

  const medWith = median(withArr);
  const medWithout = median(withoutArr);

  // Compute sums of lower halves
  let with_lh = 0,
    without_lh = 0,
    totalWithout = 0;
  for (let i = 0; i < reps; i++) {
    if (withArr[i] <= medWith) with_lh += withArr[i];
    if (withoutArr[i] <= medWithout) without_lh += withoutArr[i];
    totalWithout += withoutArr[i];
  }
  // Calculate average loss reduction and express as proportion of total without innovation
  return Math.max(0, (with_lh - without_lh) / totalWithout);
}

// === Custom IRR (secant method)
export function calcIRR(cf, guess = 0.1, maxIterations = 100, tol = 1e-6) {
  const npv = (rate) =>
    cf.reduce((acc, val, i) => acc + val / Math.pow(1 + rate, i), 0);

  let r0 = guess;
  let r1 = guess + 0.05;

  for (let i = 0; i < maxIterations; i++) {
    const npv0 = npv(r0);
    const npv1 = npv(r1);
    const denom = npv1 - npv0;
    if (Math.abs(denom) < 1e-10) return null;
    const r2 = r1 - (npv1 * (r1 - r0)) / denom;
    if (Math.abs(r2 - r1) < tol) return r2;
    r0 = r1;
    r1 = r2;
  }
  return null;
}

export function calcMIRR(cf, financeRate, reinvestRate) {
  const n = cf.length - 1;
  const inflows = cf.map((x) => (x > 0 ? x : 0));
  const outflows = cf.map((x) => (x < 0 ? x : 0));

  const FV_inflows = inflows.reduce(
    (acc, x, i) => acc + x * Math.pow(1 + reinvestRate, n - i),
    0,
  );
  const PV_outflows = outflows.reduce(
    (acc, x, i) => acc + x / Math.pow(1 + financeRate, i),
    0,
  );

  if (PV_outflows === 0 || FV_inflows <= 0) return null;

  return Math.pow(FV_inflows / Math.abs(PV_outflows), 1 / n) - 1;
}

export function npvDiscreteCumulative(values, discountRate) {
  return values.map((_, i) =>
    values
      .slice(0, i + 1)
      .reduce((acc, val, j) => acc + val / Math.pow(1 + discountRate, j), 0),
  );
}

function quantileSummary(values, qLow = 0.1, qMid = 0.5, qHigh = 0.9) {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  return {
    p10: d3.quantileSorted(sorted, qLow) ?? null,
    p50: d3.quantileSorted(sorted, qMid) ?? null,
    p90: d3.quantileSorted(sorted, qHigh) ?? null,
    mean: sorted.length ? d3.mean(sorted) : null,
    n: sorted.length,
  };
}

function sampleTriangular(low, mode, high) {
  if (!(low <= mode && mode <= high)) return mode;
  const u = Math.random();
  const c = (mode - low) / (high - low || 1);
  if (u < c) return low + Math.sqrt(u * (high - low) * (mode - low));
  return high - Math.sqrt((1 - u) * (high - low) * (high - mode));
}

/**
 * Run avlossCalc repeatedly to get uncertainty bounds for avloss itself.
 * Useful for numerical jitter checks and as an avloss input sampler.
 */
export function avlossCalcUncertainty(
  cv,
  change,
  {
    runs = 9,
    reps = 200000,
    approx = true,
    qLow = 0.1,
    qMid = 0.5,
    qHigh = 0.9,
  } = {},
) {
  const samples = Array.from({ length: runs }, () =>
    Math.abs(avlossCalc(cv, change, false, reps, approx) ?? 0),
  );
  return {
    ...quantileSummary(samples, qLow, qMid, qHigh),
    samples,
  };
}

/**
 * Uncertainty simulation using notebook cashflow rows directly.
 * With benefitScale/costScale fixed at 1, this should align with the deterministic notebook outputs.
 */
export function runSimulationFromCashflowRows(
  cashflowRows,
  {
    simulations = 2000,
    yearKey = "year",
    benefitKey = "project_benefit",
    costKey = "cost",
    discountRate = null,
    benefitScale = { low: 1, mode: 1, high: 1 },
    costScale = { low: 1, mode: 1, high: 1 },
    qLow = 0.1,
    qMid = 0.5,
    qHigh = 0.9,
  } = {},
) {
  if (!Array.isArray(cashflowRows) || cashflowRows.length === 0) {
    return {
      simulations: 0,
      yearly: [],
      final: {
        npv: quantileSummary([], qLow, qMid, qHigh),
        irr: quantileSummary([], qLow, qMid, qHigh),
        mirr: quantileSummary([], qLow, qMid, qHigh),
        bcr: quantileSummary([], qLow, qMid, qHigh),
        probNpvPositive: null,
        probBcrAbove1: null,
      },
    };
  }

  const rows = [...cashflowRows]
    .filter((r) => Number.isFinite(r?.[yearKey]))
    .sort((a, b) => a[yearKey] - b[yearKey]);

  const rate =
    discountRate ??
    rows.find((r) => Number.isFinite(r.discount_rate))?.discount_rate ??
    0.12;

  const paths = [];
  for (let s = 0; s < simulations; s++) {
    const drawBenefitScale = sampleTriangular(
      benefitScale.low,
      benefitScale.mode,
      benefitScale.high,
    );
    const drawCostScale = sampleTriangular(
      costScale.low,
      costScale.mode,
      costScale.high,
    );

    const benefitSeries = rows.map(
      (r) => (Number(r[benefitKey]) || 0) * drawBenefitScale,
    );
    const costSeries = rows.map(
      (r) => (Number(r[costKey]) || 0) * drawCostScale,
    );
    const cashflowSeries = benefitSeries.map((b, i) => b - costSeries[i]);

    const npvSeries = npvDiscreteCumulative(cashflowSeries, rate);
    const benefitNpvSeries = npvDiscreteCumulative(benefitSeries, rate);
    const costNpvSeries = npvDiscreteCumulative(costSeries, rate);
    const bcrSeries = benefitNpvSeries.map((b, i) => {
      const c = costNpvSeries[i];
      return c === 0 ? null : b / c;
    });
    const irrSeries = cashflowSeries.map((_, i) => {
      const irr = calcIRR(cashflowSeries.slice(0, i + 1));
      return irr == null ? null : irr * 100;
    });
    const mirrSeries = cashflowSeries.map((_, i) => {
      const mirr = calcMIRR(cashflowSeries.slice(0, i + 1), rate, rate);
      return mirr == null ? null : mirr * 100;
    });

    paths.push({
      npvSeries,
      bcrSeries,
      irrSeries,
      mirrSeries,
      irrFinal: calcIRR(cashflowSeries),
      mirrFinal: calcMIRR(cashflowSeries, rate, rate),
    });
  }

  const yearly = rows.map((r, i) => {
    const npvVals = paths.map((p) => p.npvSeries[i]).filter(Number.isFinite);
    const bcrVals = paths.map((p) => p.bcrSeries[i]).filter(Number.isFinite);
    const irrVals = paths.map((p) => p.irrSeries[i]).filter(Number.isFinite);
    const mirrVals = paths.map((p) => p.mirrSeries[i]).filter(Number.isFinite);
    return {
      year: r[yearKey],
      npv: quantileSummary(npvVals, qLow, qMid, qHigh),
      bcr: quantileSummary(bcrVals, qLow, qMid, qHigh),
      irr: quantileSummary(irrVals, qLow, qMid, qHigh),
      mirr: quantileSummary(mirrVals, qLow, qMid, qHigh),
    };
  });

  const npvFinal = paths.map((p) => p.npvSeries.at(-1)).filter(Number.isFinite);
  const irrFinal = paths
    .map((p) => (p.irrFinal == null ? null : p.irrFinal * 100))
    .filter(Number.isFinite);
  const mirrFinal = paths
    .map((p) => (p.mirrFinal == null ? null : p.mirrFinal * 100))
    .filter(Number.isFinite);
  const bcrFinal = paths.map((p) => p.bcrSeries.at(-1)).filter(Number.isFinite);

  return {
    simulations,
    yearly,
    final: {
      npv: quantileSummary(npvFinal, qLow, qMid, qHigh),
      irr: quantileSummary(irrFinal, qLow, qMid, qHigh),
      mirr: quantileSummary(mirrFinal, qLow, qMid, qHigh),
      bcr: quantileSummary(bcrFinal, qLow, qMid, qHigh),
      probNpvPositive: npvFinal.length
        ? npvFinal.filter((x) => x > 0).length / npvFinal.length
        : null,
      probBcrAbove1: bcrFinal.length
        ? bcrFinal.filter((x) => x > 1).length / bcrFinal.length
        : null,
    },
  };
}
