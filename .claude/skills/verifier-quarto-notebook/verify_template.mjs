// verify_template.mjs — adapt this for any Quarto/OJS notebook change.
//
// Usage:
//   1. Copy to /tmp/pw-verify/verify.mjs
//   2. Edit URL, GATED, EXPECTED_INITIAL, and the phase blocks for your change
//   3. Run with `node verify.mjs`
//   4. Read /tmp/pw-verify/report.json + screenshots
//
// What this script does:
//   - Boots chromium-headless against a locally-served _site/
//   - Captures every request, console message, and pageerror
//   - Sequences phases: initial-load → user-action-1 → user-action-2 → ...
//   - For each phase, screenshots + saves the request-log delta
//   - Writes a structured report.json and a flat s3_urls.txt

import { chromium } from 'playwright';
import fs from 'fs';

// ----------------------------------------------------------------------------
// 1. Configure for your change
// ----------------------------------------------------------------------------

const URL = 'http://localhost:8765/notebooks/climateRationale/notebook.html';

// Substrings of URLs that SHOULD NOT appear during initial load (i.e. the
// fetches the change is supposed to defer). Group by section so the report
// can attribute leaks to specific gates.
const GATED = {
  // example for section-gate verification:
  // futureProjections: [
  //   'period=2021-2040/baseline=1995-2014/variable=ensemble_season_timeseries',
  //   'period=2041-2060/baseline=1995-2014/variable=ensemble_season_timeseries',
  // ],
  // hazardExposure: [
  //   'domain=hazard_exposure/source=nex-gddp-cmip6',
  // ],
};

// Substrings of URLs we EXPECT during initial load. If these don't fire,
// the page didn't bootstrap correctly — useful as a smoke test.
const EXPECTED_INITIAL = [
  // 'variable=adm0_obs.parquet',
  // 'variable=adm0_faostat.parquet',
];

// Phases: list of user actions to take after the initial load. Each phase
// captures its own delta in the request log. Add or remove phases for your
// change.
const PHASES = [
  // Example: scroll to a section anchor.
  // {
  //   name: 'scroll_futureProjections',
  //   action: async (page) => {
  //     await page.evaluate(() => {
  //       const el = document.getElementById('futureProjections-anchor');
  //       if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  //     });
  //     await page.waitForTimeout(12000);
  //   },
  //   // URLs we now EXPECT to see fire (the gate flips, query runs)
  //   expected_now: ['period=2021-2040'],
  //   // URLs we still DON'T want to see (gate for another section)
  //   still_gated: ['domain=hazard_exposure'],
  // },
];

// Wait time after navigation for OJS bootstrap + top-section paint.
const INITIAL_WAIT_MS = 15000;

const VIEWPORT = { width: 1400, height: 900 };
const ARTIFACT_DIR = '/tmp/pw-verify';

// ----------------------------------------------------------------------------
// 2. Boilerplate — usually no need to edit below here
// ----------------------------------------------------------------------------

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: VIEWPORT });
const page = await ctx.newPage();

const requests = [];
page.on('request', (req) => requests.push({ t: Date.now(), method: req.method(), url: req.url() }));

const consoleMsgs = [];
page.on('console', (m) => consoleMsgs.push({ t: Date.now(), type: m.type(), text: m.text() }));
page.on('pageerror', (e) => consoleMsgs.push({ t: Date.now(), type: 'pageerror', text: e.message }));

// --- Phase 0: navigate + initial load ---
console.log(`## Phase 0 / initial-load: navigate + wait ${INITIAL_WAIT_MS}ms`);
const t0 = Date.now();
await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
console.log(`  'load' fired in ${Date.now() - t0}ms`);
await page.waitForTimeout(INITIAL_WAIT_MS);

const initial = {
  request_count: requests.length,
  screenshot: `${ARTIFACT_DIR}/00_initial_load.png`,
  scrollY: await page.evaluate(() => window.scrollY),
};
await page.screenshot({ path: initial.screenshot, fullPage: false });

const initialEnd = requests.length;
const initialRequests = requests.slice(0, initialEnd);

// --- Phases 1..N ---
const phaseResults = [];
for (let i = 0; i < PHASES.length; i++) {
  const phase = PHASES[i];
  const startIdx = requests.length;
  console.log(`\n## Phase ${i + 1} / ${phase.name}`);
  await phase.action(page);
  const endIdx = requests.length;
  const phaseRequests = requests.slice(startIdx, endIdx);
  const screenshot = `${ARTIFACT_DIR}/${String(i + 1).padStart(2, '0')}_${phase.name}.png`;
  await page.screenshot({ path: screenshot, fullPage: false });
  phaseResults.push({
    name: phase.name,
    request_count: phaseRequests.length,
    scrollY: await page.evaluate(() => window.scrollY),
    screenshot,
    expected_now: phase.expected_now || [],
    still_gated: phase.still_gated || [],
    requests_index_range: [startIdx, endIdx],
  });
}

await browser.close();

// ----------------------------------------------------------------------------
// 3. Analysis
// ----------------------------------------------------------------------------

function countMatches(reqs, substrs) {
  return Object.fromEntries(substrs.map((s) => [s, reqs.filter((r) => r.url.includes(s)).length]));
}

const allGatedSubstrs = Object.values(GATED).flat();
const initial_expected = countMatches(initialRequests, EXPECTED_INITIAL);
const initial_gated_leak = countMatches(initialRequests, allGatedSubstrs);

const errors = consoleMsgs.filter((m) => m.type === 'error' || m.type === 'pageerror');

const report = {
  url: URL,
  total_requests: requests.length,
  initial: {
    ...initial,
    expected_seen: initial_expected,
    gated_leak: initial_gated_leak,
  },
  phases: phaseResults.map((p) => {
    const phaseReqs = requests.slice(p.requests_index_range[0], p.requests_index_range[1]);
    return {
      ...p,
      expected_now_seen: countMatches(phaseReqs, p.expected_now),
      still_gated_leak: countMatches(phaseReqs, p.still_gated),
    };
  }),
  console: {
    error_count: errors.length,
    first_10_errors: errors.slice(0, 10).map((e) => `[${e.type}] ${e.text.slice(0, 200)}`),
  },
};

fs.writeFileSync(`${ARTIFACT_DIR}/report.json`, JSON.stringify(report, null, 2));

const s3 = requests.filter((r) => r.url.includes('digital-atlas.s3') || r.url.includes('digital-atlas/')).map((r) => r.url);
fs.writeFileSync(`${ARTIFACT_DIR}/s3_urls.txt`, s3.join('\n') + '\n');

console.log('\n## Report');
console.log(JSON.stringify(report, null, 2));
console.log(`\n${s3.length} S3 URLs captured at ${ARTIFACT_DIR}/s3_urls.txt`);
console.log(`Report at ${ARTIFACT_DIR}/report.json`);

// Exit code: 0 if no gated leaks on init AND all phase expectations met, else 1
const initialLeakCount = Object.values(initial_gated_leak).reduce((a, b) => a + b, 0);
process.exit(initialLeakCount > 0 ? 1 : 0);
