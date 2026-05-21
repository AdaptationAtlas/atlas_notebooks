"""
Reference implementation of Mann-Kendall + Theil-Sen + Yue et al. (2002) TFPW.
Used to generate ground-truth values for the trend.ojs JS implementation
validation matrix.

Three test series:
  A) Strong linear trend, low AC (~ Angola TAVG)
  B) Weak trend with moderate AC (~ borderline PTOT case)
  C) Pure noise, no trend (negative control)

For each, we report:
  - Plain MK p, Theil-Sen slope + 95% CI
  - Yue TFPW MK p (correct algorithm)
  - The current trend.ojs algorithm MK p (showing the bug)
"""

import numpy as np
from itertools import combinations
from math import sqrt, erf

# ---------------- core implementations ----------------

def theil_sen(x, y):
    """Theil-Sen slope = median of pairwise slopes; intercept = median residual."""
    slopes = [(y[j] - y[i]) / (x[j] - x[i])
              for i, j in combinations(range(len(x)), 2)
              if x[j] != x[i]]
    slopes.sort()
    n = len(slopes)
    slope = slopes[n // 2] if n % 2 else 0.5 * (slopes[n // 2 - 1] + slopes[n // 2])
    intercept = float(np.median(y - slope * x))
    return slope, intercept, slopes

def mk_stats(y):
    """MK S, varS (with tie correction), Z (with continuity correction), two-sided p."""
    n = len(y)
    S = 0
    for i in range(n - 1):
        for j in range(i + 1, n):
            d = y[j] - y[i]
            if d > 0: S += 1
            elif d < 0: S -= 1
    # ties
    _, counts = np.unique(y, return_counts=True)
    ties = counts[counts > 1]
    tieSum = sum(t * (t - 1) * (2 * t + 5) for t in ties)
    varS = (n * (n - 1) * (2 * n + 5) - tieSum) / 18
    if S > 0:   Z = (S - 1) / sqrt(varS)
    elif S < 0: Z = (S + 1) / sqrt(varS)
    else:       Z = 0.0
    p = 2 * (1 - 0.5 * (1 + erf(abs(Z) / sqrt(2))))
    return S, varS, Z, p

def ts_ci(slopes, varS, alpha=0.05):
    """Hollander-Wolfe rank-based CI on Theil-Sen slope. Matches R trend::sens.slope."""
    from scipy.stats import norm
    z_a2 = norm.ppf(1 - alpha / 2)
    cA = z_a2 * sqrt(varS)
    N = len(slopes)
    lower_idx = int(round((N - cA) / 2))           # 0-indexed
    upper_idx = int(round((N + cA) / 2)) - 1
    lower_idx = max(0, lower_idx)
    upper_idx = min(N - 1, upper_idx)
    return slopes[lower_idx], slopes[upper_idx]

def lag1_ac(arr):
    """Lag-1 autocorrelation, biased estimator (n in denominator)."""
    a = np.asarray(arr, float)
    n = len(a)
    m = a.mean()
    d = a - m
    den = np.sum(d * d)
    num = np.sum(d[:-1] * d[1:])
    return float(num / den) if den > 0 else 0.0

def yue_tfpw(x, y, threshold=0.1):
    """Correct Yue et al. (2002) TFPW: detrend → whiten residuals → re-add trend."""
    slope, intercept, _ = theil_sen(x, y)
    detr = y - (slope * x + intercept)
    r = lag1_ac(detr)
    if abs(r) <= threshold:
        return y.copy(), False, r
    # Whiten the DETRENDED residuals.
    wr = np.empty_like(detr)
    wr[0] = detr[0]
    for t in range(1, len(detr)):
        wr[t] = detr[t] - r * detr[t - 1]
    # Re-add the deterministic Theil-Sen line.
    z = wr + slope * x + intercept
    return z, True, r

def buggy_tfpw(x, y, threshold=0.1):
    """Reproduces the current trend.ojs algorithm — whitens the OBSERVED series
    and re-adds slope*Δx per step. Wrong relative to Yue."""
    slope, intercept, _ = theil_sen(x, y)
    detr = y - (slope * x + intercept)
    r = lag1_ac(detr)
    if abs(r) <= threshold:
        return y.copy(), False, r
    z = np.empty_like(y)
    z[0] = y[0]
    for t in range(1, len(y)):
        z[t] = y[t] - r * y[t - 1] + slope * (x[t] - x[t - 1])
    return z, True, r

# ---------------- synthetic series ----------------

rng = np.random.default_rng(42)

# Series A: strong trend, low AC — ~ Angola TAVG
xA = np.arange(1980, 2026, dtype=float)         # n = 46
trendA = 0.020 * (xA - 1980)                    # +0.20 °C/decade
noiseA = rng.normal(0, 0.20, len(xA))           # σ = 0.2 °C, white
yA = 23.0 + trendA + noiseA

# Series B: weak trend, moderate AC — borderline PTOT-like case
xB = np.arange(1981, 2026, dtype=float)         # n = 45
trendB = 0.5 * (xB - 1981)                      # +5 mm/decade (small)
# AR(1) noise with phi = 0.35
noiseB = np.zeros(len(xB))
noiseB[0] = rng.normal(0, 60)
for t in range(1, len(xB)):
    noiseB[t] = 0.35 * noiseB[t - 1] + rng.normal(0, 60)
yB = 800 + trendB + noiseB                       # mm, around 800 mm/yr baseline

# Series C: no trend, low AC — negative control
xC = np.arange(1981, 2026, dtype=float)         # n = 45
yC = 23.5 + rng.normal(0, 0.25, len(xC))

# ---------------- report ----------------

def report(name, x, y, units):
    slope, intercept, slopes = theil_sen(x, y)
    S, varS, Z, p_plain = mk_stats(y)
    lo, hi = ts_ci(slopes, varS)
    ac1 = lag1_ac(y - (slope * x + intercept))
    z_yue, used_yue, r_yue = yue_tfpw(x, y)
    _, _, _, p_yue = mk_stats(z_yue) if used_yue else (None, None, None, p_plain)
    z_bug, used_bug, r_bug = buggy_tfpw(x, y)
    _, _, _, p_bug = mk_stats(z_bug) if used_bug else (None, None, None, p_plain)
    print(f"\n=== {name}  (n = {len(y)}, {units}) ===")
    print(f"  Theil-Sen slope/year        = {slope:.6f}")
    print(f"  Theil-Sen slope/decade      = {slope*10:.4f}")
    print(f"  95% CI on slope/decade      = [{lo*10:.4f}, {hi*10:.4f}]")
    print(f"  lag-1 AC of residuals       = {ac1:.4f}")
    print(f"  plain MK p-value            = {p_plain:.6f}  {'<0.05 ✓' if p_plain < 0.05 else '≥0.05'}")
    print(f"  Yue TFPW applied?           = {used_yue}")
    if used_yue:
        print(f"  Yue TFPW p-value (CORRECT)  = {p_yue:.6f}  {'<0.05 ✓' if p_yue < 0.05 else '≥0.05'}")
    print(f"  Buggy TFPW applied?         = {used_bug}")
    if used_bug:
        print(f"  Buggy code p-value          = {p_bug:.6f}  {'<0.05 ✓' if p_bug < 0.05 else '≥0.05'}")
        diff = abs(p_bug - p_yue) if used_yue else 0
        print(f"  |Buggy - Yue| p             = {diff:.6f}")

report("A · Strong trend, low AC",      xA, yA, "°C")
report("B · Weak trend, moderate AC",   xB, yB, "mm")
report("C · No trend, low AC",          xC, yC, "°C")

# Series D: strong trend + strong AC — the bug's worst case
rng2 = np.random.default_rng(7)
xD = np.arange(1980, 2026, dtype=float)
trendD = 0.015 * (xD - 1980)
noiseD = np.zeros(len(xD))
noiseD[0] = rng2.normal(0, 0.4)
for t in range(1, len(xD)):
    noiseD[t] = 0.55 * noiseD[t - 1] + rng2.normal(0, 0.4)
yD = 24.0 + trendD + noiseD

report("D · Strong trend + strong AC", xD, yD, "°C")
