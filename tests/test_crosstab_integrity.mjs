import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const URL = 'http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1600 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  console.log(`Loading ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(4000);

  // =========================================================================
  // 1. SECTION 0 EXECUTIVE COUNTY BRIEF VALUE EXTRACTION (MARSABIT)
  // =========================================================================
  console.log('--- 1. Testing Section 0 Executive County Brief (Marsabit) ---');
  await page.waitForSelector('#sec0ExecutiveBriefHost .brief-wrapper', { timeout: 15000 });
  const briefText = await page.evaluate(() => document.getElementById('sec0ExecutiveBriefHost').innerText);

  // Assertions on Brief values
  if (!briefText.includes('Marsabit')) throw new Error('FAIL: Brief missing Marsabit county name');
  if (!briefText.includes('459,785')) throw new Error('FAIL: Brief missing Marsabit 2019 Census population 459,785');
  if (!briefText.includes('6 of 8 seasons (75%) were Wet')) throw new Error('FAIL: Brief missing 6 of 8 seasons (75%) were Wet');
  if (!briefText.includes('LOOCV: RPSS +0.30 • 64% Hit')) throw new Error('FAIL: Brief missing LOOCV: RPSS +0.30 • 64% Hit');
  if (!briefText.includes('Rank #1 • 2015') || !briefText.includes('Rank #2 • 1982') || !briefText.includes('Rank #3 • 1997')) {
    throw new Error('FAIL: Brief missing expected top 3 analogue years (2015, 1982, 1997)');
  }
  console.log('PASS: Section 0 Executive County Brief values extracted and verified!');

  // =========================================================================
  // 2. CROSS-TAB VALUE EQUALITY ON TAB 2 (SEASONAL OUTLOOK / FIGURE 2.1)
  // =========================================================================
  console.log('--- 2. Testing Tab 2 (Figure 2.1 Cross-Tab Equality & About Expander) ---');
  await page.evaluate(() => window.switchTab('tab-outlook', 'subtab-outlook-22'));
  await page.waitForTimeout(2000);
  await page.waitForSelector('#fig21TercileHost', { state: 'visible', timeout: 15000 });

  const f21Host = await page.$('#fig21TercileHost');
  const f21Text = await page.evaluate(el => el.innerText, f21Host);

  // Cross-tab assertions: Figure 2.1 must match Section 0 Brief
  if (!f21Text.includes('161 mm')) throw new Error('FAIL: Figure 2.1 normal baseline 161 mm does not match Brief baseline');
  if (!f21Text.includes('+0.30') || !f21Text.includes('RPSS')) throw new Error('FAIL: Figure 2.1 RPSS does not match Brief +0.30');
  if (!f21Text.includes('64% Hit Rate')) throw new Error('FAIL: Figure 2.1 Hit Rate does not match Brief 64% Hit Rate');
  if (!f21Text.includes('75% Wetter') || !f21Text.includes('6 of 8')) throw new Error('FAIL: Figure 2.1 tercile distribution does not match Brief 75% / 6 of 8');
  if (!f21Text.includes('2015') || !f21Text.includes('1982') || !f21Text.includes('1997')) {
    throw new Error('FAIL: Figure 2.1 top analogue pills do not match Brief top 3 years');
  }
  console.log('PASS: Section 2 Figure 2.1 exactly matches Section 0 Executive Brief values!');

  // Verify Figure 2.1 "About this plot" foldout
  console.log('Testing Figure 2.1 "About this plot" expander...');
  const fig21Footer = await page.$('#fig21FooterHost');
  const fig21AboutDetails = await page.$('#fig21FooterHost details.plot-caption-details');
  if (!fig21AboutDetails) throw new Error('FAIL: Figure 2.1 missing About this plot details expander');
  
  // Click to open About expander
  const fig21AboutSummary = await page.$('#fig21FooterHost details.plot-caption-details summary');
  await fig21AboutSummary.click();
  await page.waitForTimeout(500);

  const fig21AboutText = await page.evaluate(el => el.innerText, fig21AboutDetails);
  if (!fig21AboutText.includes('Historical Short Rains (OND)') && !fig21AboutText.includes('Short Rains (OND)')) {
    throw new Error('FAIL: Figure 2.1 About text content missing or empty');
  }
  console.log('PASS: Figure 2.1 About this plot expander successfully opened with verified content!');

  const fig21Card = await page.$('#section-figure-2-1');
  if (fig21Card) {
    await fig21Card.screenshot({ path: `${ARTIFACT_DIR}/fig21_with_about_expanded.png` });
    console.log(`Saved ${ARTIFACT_DIR}/fig21_with_about_expanded.png`);
  }

  // =========================================================================
  // 3. TAB 3 (CLIMATE EVIDENCE: FIGURE 3.1 & 3.1B ABOUT EXPANDERS)
  // =========================================================================
  console.log('--- 3. Testing Tab 3 (Figure 3.1 & 3.1B About Expanders) ---');
  await page.evaluate(() => window.switchTab('tab-graphs'));
  await page.waitForTimeout(2000);

  // Check Figure 3.1 About
  const fig31About = await page.$('#fig31FooterHost details.plot-caption-details');
  if (!fig31About) throw new Error('FAIL: Figure 3.1 missing About this plot expander');
  const fig31Summary = await page.$('#fig31FooterHost details.plot-caption-details summary');
  await fig31Summary.click();
  await page.waitForTimeout(400);
  const fig31AboutText = await page.evaluate(el => el.innerText, fig31About);
  if (!fig31AboutText.includes('CHIRPS v3')) throw new Error('FAIL: Figure 3.1 About text missing CHIRPS v3 reference');
  console.log('PASS: Figure 3.1 About this plot expander verified!');

  // Check Figure 3.1B About
  const fig31bAbout = await page.$('#fig31bFooterHost details.plot-caption-details');
  if (!fig31bAbout) throw new Error('FAIL: Figure 3.1B missing About this plot expander');
  const fig31bSummary = await page.$('#fig31bFooterHost details.plot-caption-details summary');
  await fig31bSummary.click();
  await page.waitForTimeout(400);
  const fig31bAboutText = await page.evaluate(el => el.innerText, fig31bAbout);
  if (!fig31bAboutText.includes('KNBS production-year convention')) throw new Error('FAIL: Figure 3.1B About text missing KNBS convention reference');
  console.log('PASS: Figure 3.1B About this plot expander verified!');

  // =========================================================================
  // 4. TAB 4 (HISTORICAL IMPACTS: FIGURE 4.4B ABOUT EXPANDER)
  // =========================================================================
  console.log('--- 4. Testing Tab 4 (Figure 4.4B Cross-Border Trade About Expander) ---');
  await page.evaluate(() => window.switchTab('tab-impacts'));
  await page.waitForTimeout(2000);

  const fig44bAboutText = await page.evaluate(() => {
    const host = document.getElementById('fig44bFooterHost');
    const details = host?.querySelector('details.plot-caption-details');
    if (!details) return null;
    details.open = true;
    details.scrollIntoView({ block: 'center' });
    return details.innerText;
  });

  if (!fig44bAboutText) throw new Error('FAIL: Figure 4.4B missing About this plot expander');
  if (!fig44bAboutText.includes('FEWS NET East Africa Cross-Border Trade')) {
    throw new Error('FAIL: Figure 4.4B About text missing FEWS NET XBT reference');
  }
  console.log('PASS: Figure 4.4B About this plot expander verified!');

  await page.evaluate(() => document.getElementById('fig44bFooterHost')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/fig44b_with_about_expanded.png` });
  console.log(`Saved ${ARTIFACT_DIR}/fig44b_with_about_expanded.png`);

  // =========================================================================
  // 5. REACTIVITY CHECK: SWITCH TO TURKANA COUNTY
  // =========================================================================
  console.log('--- 5. Testing County Reactivity: Switch to Turkana ---');
  await page.evaluate(() => window.switchTab('tab-start'));
  await page.waitForTimeout(1000);

  // Change county dropdown to Turkana
  await page.selectOption('#globalControlsHost select', 'Turkana');
  await page.waitForTimeout(3000);

  const turkanaBriefText = await page.evaluate(() => document.getElementById('sec0ExecutiveBriefHost').innerText);
  if (!turkanaBriefText.includes('Turkana')) throw new Error('FAIL: Executive Brief did not update to Turkana');
  if (!turkanaBriefText.includes('926,976')) throw new Error('FAIL: Turkana census population 926,976 missing in Brief');
  console.log('PASS: Executive Brief dynamically re-calculated and verified for Turkana (926,976 headcount)!');

  // Check Tab 2 for Turkana
  await page.evaluate(() => window.switchTab('tab-outlook'));
  await page.waitForTimeout(2000);
  const turkanaF21Text = await page.evaluate(() => document.getElementById('fig21TercileHost').innerText);
  if (!turkanaF21Text.includes('Turkana County')) throw new Error('FAIL: Figure 2.1 did not update to Turkana');
  console.log('PASS: Figure 2.1 dynamically re-calculated and verified for Turkana!');

  // =========================================================================
  // 6. CONSOLE ERROR CHECK
  // =========================================================================
  console.log('\n--- AUDIT SUMMARY ---');
  const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('goatcounter'));
  console.log(`Console errors: ${realErrors.length}`);
  if (realErrors.length > 0) {
    realErrors.forEach(err => console.error('CONSOLE ERROR:', err));
    throw new Error(`FAIL: Encountered ${realErrors.length} console errors`);
  }
  console.log('ALL CROSS-TAB INTEGRITY AND ABOUT EXPANDER ASSERTIONS PASSED WITH 0 CONSOLE ERRORS!');

  await browser.close();
})();
