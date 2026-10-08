import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const URL = 'http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1600 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  console.log('Navigating to', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  // 1. Verify Global Chrome & Section 1
  console.log('--- 1. Testing Global Chrome & Section 1 ---');
  const stickySubNav = page.locator('#stickySubNav');
  const subnavText = await stickySubNav.innerText();
  if (subnavText.includes('Sub-sections:')) {
    throw new Error('FAIL: Sticky subnav still contains redundant "Sub-sections:" label');
  }
  console.log('PASS: Sticky subnav has clean titles without redundant prefixes.');

  // Check version badge
  const heroBadge = page.locator('#heroVersionBadge');
  const badgeText = await heroBadge.innerText();
  console.log('Hero Version Badge:', badgeText);
  if (!badgeText.toLowerCase().includes('v3.9.0')) {
    throw new Error(`FAIL: Hero badge expected v3.9.0, got ${badgeText}`);
  }

  // Check Section 1 subtabs & headings
  const tab1 = page.locator('#btn-tab-profile');
  await tab1.click();
  await page.waitForTimeout(1000);
  const sec1Head = page.locator('#tab-profile .enso-section-title');
  const sec1HeadText = await sec1Head.innerText();
  console.log('Section 1 Title:', sec1HeadText);
  if (!sec1HeadText.includes('Baseline Geography and Human Stakes')) {
    throw new Error('FAIL: Section 1 header missing expected de-duplicated text');
  }
  await page.screenshot({ path: `${ARTIFACT_DIR}/v390_sec1_verified.png` });

  // 2. Section 3 Overview & Climatology Unification
  console.log('--- 2. Testing Section 3 Guide Box & County Climatology Baseline Card ---');
  const tab3 = page.locator('#btn-tab-graphs');
  await tab3.click();
  await page.waitForTimeout(2000);

  const guideCards = page.locator('#subtab-climate-31 .card div[style*="grid-template-columns"] > div');
  const guideCount = await guideCards.count();
  console.log(`Section 3 Guide Box Cards: ${guideCount} (expected 4)`);
  if (guideCount !== 4) {
    throw new Error(`FAIL: Expected 4 guide cards, found ${guideCount}`);
  }

  const baselineCard = page.locator('#sec3SubcountyCompareHost');
  if (await baselineCard.count() === 0) {
    throw new Error('FAIL: County Climatological & Hazard Baseline Card host not found!');
  }
  const baselineText = await baselineCard.innerText();
  console.log('Baseline Card Full Text:\n', baselineText);
  if (!baselineText.includes('Marsabit Countywide Climatological & Hazard Baseline')) {
    throw new Error('FAIL: Baseline Card missing title');
  }
  await baselineCard.screenshot({ path: `${ARTIFACT_DIR}/v390_sec3_baseline_card.png` });

  // 3. Figures 3.1 & 3.1B
  console.log('--- 3. Testing Figure 3.1 & 3.1B Sequence View ---');
  const kpiCards = page.locator('#sec31bKpiHost > div > div');
  const kpiCount = await kpiCards.count();
  console.log(`Figure 3.1B KPI Cards Count: ${kpiCount} (expected 3)`);
  if (kpiCount !== 3) {
    throw new Error(`FAIL: Expected 3 sequence KPI cards, found ${kpiCount}`);
  }
  const kpiText = await page.locator('#sec31bKpiHost').innerText();
  console.log('KPI Cards Content Summary:', kpiText.replace(/\n/g, ' | '));

  // Enable Similar Years to test sequence row highlighting
  const btnToggleSimilar = page.locator('#btnToggleSimilar');
  await btnToggleSimilar.click();
  await page.waitForTimeout(1000);

  const analogueBadges = page.locator('#plotSequenceHost span:has-text("ANALOGUE")');
  const analogueCount = await analogueBadges.count();
  console.log(`Figure 3.1B Analogue Rows Highlighted: ${analogueCount}`);
  if (analogueCount === 0) {
    throw new Error('FAIL: Figure 3.1B did not highlight analogue rows when Similar Years enabled');
  }
  await page.locator('#section-consecutive-sequence').screenshot({ path: `${ARTIFACT_DIR}/v390_sec31b_sequence_highlighted.png` });

  // 4. Figure 3.2 & 3.3
  console.log('--- 4. Testing Figure 3.2 Contingency & Figure 3.3 Scatter ---');
  const contingencyHost = page.locator('#plotContingencyHost');
  const contBox = await contingencyHost.boundingBox();
  console.log(`Contingency Plot Bounding Box: height=${contBox.height}px`);

  const insightHost = page.locator('#sec22InsightHost');
  const insightText = await insightHost.innerText();
  if (!insightText.includes('Short Rains (OND)') || !insightText.includes('Long Rains (MAM)')) {
    throw new Error('FAIL: Insight box missing structured dual-season cards');
  }

  // Check Table 3.2 candidate drivers position below scatter plot
  const driverTableHost = page.locator('#sec23DriverTableHost');
  if (await driverTableHost.count() === 0) {
    throw new Error('FAIL: Candidate Ocean Drivers Table host not found below scatter plot');
  }
  await page.locator('#section-driver-scatter').screenshot({ path: `${ARTIFACT_DIR}/v390_sec33_scatter_and_table.png` });

  // 5. Figure 3.5 Flood Controls
  console.log('--- 5. Testing Figure 3.5 Flood Observation Year Formatting ---');
  const floodYearSelect = page.locator('#sec23ControlsHost select').nth(1);
  if (await floodYearSelect.count() > 0) {
    const yearOptions = await floodYearSelect.locator('option').allInnerTexts();
    console.log('Flood Year Options:', yearOptions.join(', '));
    if (yearOptions.some(y => y.includes(','))) {
      throw new Error(`FAIL: Flood year options contain commas: ${yearOptions.join(', ')}`);
    }
  }

  // 6. Section 4 Subtab Bar & Control Bar
  console.log('--- 6. Testing Section 4 Sub-Tabs & In-Card Toolbar ---');
  const tab4 = page.locator('#btn-tab-impacts');
  await tab4.click();
  await page.waitForTimeout(1500);

  const sec4Subtabs = page.locator('#tab-impacts .sub-tab-bar button');
  const sec4SubtabCount = await sec4Subtabs.count();
  console.log(`Section 4 Sub-Tabs Count: ${sec4SubtabCount} (expected 4)`);
  if (sec4SubtabCount !== 4) {
    throw new Error(`FAIL: Expected 4 subtabs in Section 4, found ${sec4SubtabCount}`);
  }

  const sec4Toolbar = page.locator('#section-production-card #sec4ToolbarHost');
  if (await sec4Toolbar.count() === 0) {
    throw new Error('FAIL: Section 4 production toolbar missing inside #section-production-card');
  }
  await page.locator('#tab-impacts').screenshot({ path: `${ARTIFACT_DIR}/v390_sec4_subtabs_and_card.png` });

  // Switch to Pasture subtab to check Figure 4.2B tercile strip
  const btnPasture = page.locator('#btn-subtab-rangeland');
  await btnPasture.click();
  await page.waitForTimeout(1000);
  const pastureCard = page.locator('#subtab-rangeland');
  await pastureCard.screenshot({ path: `${ARTIFACT_DIR}/v390_sec42b_pasture_strip.png` });

  console.log('--- Audit Verification Summary ---');
  console.log('Console errors:', errors.length);
  if (errors.length > 0) {
    console.error('Console errors:', errors);
    throw new Error(`FAIL: Encountered ${errors.length} console errors`);
  }

  console.log('🎉 ALL V3.9.0 REMEDIATION VERIFICATION ASSERTIONS PASSED WITH 0 CONSOLE ERRORS!');
  await browser.close();
})();
