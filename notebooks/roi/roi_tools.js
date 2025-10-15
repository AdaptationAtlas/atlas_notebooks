/**
 *
 * Calculates the average loss reduction by simulating normal distributions
 * with and without a specified change in standard deviation.
 * The reduction is expressed as a proportion of the total without the change.
 *
 * @function avloss
 * @param {number} cv - Coefficient of variation (standard deviation / mean) representing the baseline variability.
 * @param {number} change - The proposed change in standard deviation.
 * @param {boolean} [fixed=false] - If true, treats `change` as an absolute reduction in CV; if false, treats it as proportional.
 * @param {number} [reps=1e6] - Number of random samples to simulate. Higher = more accurate, slower.
 * @param {boolean} [approx=true] - If true, uses a subsample of 50,000 shuffled values for faster approximate median computation.
 * @returns {number} - The estimated average loss (bounded between 0 and 1). Returns `NaN` if invalid input leads to negative SD.
 *
 */
function avloss(cv, change, fixed = false, reps = 1e6, approx = true) {
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

  // Not as fast but cleaner & can add seed w/ https://observablehq.com/@d3/random-source
  // const rnorm = (n, sd) => {
  //   const randNormal = d3.randomNormal(1, sd);
  //   const out = new Float64Array(n);
  //   for (let i = 0; i < n; i++) {
  //     out[i] = randNormal();
  //   }
  //   return out;
  // };

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
