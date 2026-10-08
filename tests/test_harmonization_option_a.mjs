import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const URL = 'http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });

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

  // 1. Inspect Section 2 to verify analogue years
  console.log('--- 1. Inspecting Section 2 Forecast Analogues ---');
  const tab2 = await page.$('#btn-tab-outlook');
  if (tab2) {
    await tab2.click();
    await page.waitForTimeout(1500);
  }

  // 2. Navigate to Section 3 (Historical Evidence)
  console.log('--- 2. Navigating to Section 3 (Climate Evidence) ---');
  const tab3 = await page.$('#btn-tab-graphs');
  if (!tab3) throw new Error('FAIL: #btn-tab-graphs not found');
  await tab3.click();
  await page.waitForTimeout(2000);

  // 3. Inspect Figure 3.1 Empirical Chips
  console.log('--- 3. Inspecting Figure 3.1 Empirical Chips ---');
  const analogueChip = page.locator('.enso-analogue-chip');
  if (await analogueChip.count() === 0) {
    throw new Error('FAIL: .enso-analogue-chip (Section 2 Forecast Analogues chip) not found in Figure 3.1!');
  }
  const chipText = await analogueChip.first().innerText();
  console.log(`Found Analogue Chip: "${chipText.replace(/\n/g, ' ')}"`);

  // Verify other phase chips also exist
  const allChips = page.locator('.enso-empirical-chip');
  const chipCount = await allChips.count();
  console.log(`Total empirical chips rendered: ${chipCount}`);
  if (chipCount < 3) {
    throw new Error(`FAIL: Expected at least 3 empirical chips, found ${chipCount}`);
  }

  // 4. Click the Forecast Analogues Chip to highlight Section 2 analogues
  console.log('--- 4. Clicking "🎯 Forecast Analogues (Sec 2)" Chip ---');
  await analogueChip.first().click();
  await page.waitForTimeout(1500);

  const isPressed = await analogueChip.first().getAttribute('aria-pressed');
  console.log(`Analogue chip aria-pressed: ${isPressed}`);
  if (isPressed !== 'true') {
    throw new Error(`FAIL: Expected aria-pressed="true", got "${isPressed}"`);
  }

  // Screenshot Figure 3.1 with analogue highlighting
  const fig31Card = page.locator('#section-rain-climatology');
  await fig31Card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await fig31Card.screenshot({ path: `${ARTIFACT_DIR}/fig31_sec2_analogues_highlighted.png` });
  console.log('Saved fig31_sec2_analogues_highlighted.png');

  // 5. Verify Sticky Header Synchronization
  console.log('--- 5. Verifying Sticky Header Synchronization ---');
  const btnToggleSimilar = page.locator('#btnToggleSimilar');
  if (await btnToggleSimilar.count() > 0) {
    const btnText = await btnToggleSimilar.innerText();
    console.log(`Sticky button text: "${btnText}"`);
    if (!btnText.includes('Similar years')) {
      throw new Error(`FAIL: Expected sticky button to show Similar years, got ${btnText}`);
    }
  }

  const selSimilarMode = page.locator('#selSimilarMode');
  if (await selSimilarMode.count() > 0) {
    const selectedMode = await selSimilarMode.inputValue();
    console.log(`Sticky select mode: "${selectedMode}"`);
    if (selectedMode !== 'analogues') {
      throw new Error(`FAIL: Expected selSimilarMode="analogues", got "${selectedMode}"`);
    }
  }

  // 6. Inspect Figure 3.3 Driver Scatter Plot Badge
  console.log('--- 6. Verifying Figure 3.3 Scatter Plot Highlight Badge ---');
  const scatterCard = page.locator('#plotDriverScatterHost');
  if (await scatterCard.count() > 0) {
    await scatterCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const badge = page.locator('span:has-text("Sec 2 Forecast Analogues")');
    if (await badge.count() === 0) {
      throw new Error('FAIL: Figure 3.3 badge did not display "Sec 2 Forecast Analogues"');
    }
    const badgeText = await badge.first().innerText();
    console.log(`Figure 3.3 Highlight Badge: "${badgeText}"`);

    await scatterCard.screenshot({ path: `${ARTIFACT_DIR}/fig33_sec2_analogues_scatter.png` });
    console.log('Saved fig33_sec2_analogues_scatter.png');
  }

  // 7. Test Mode Switching in Sticky Header
  console.log('--- 7. Testing Mode Switching via Sticky Header ---');
  if (await selSimilarMode.count() > 0) {
    // Switch to projected (Peak Phase)
    await selSimilarMode.selectOption('projected');
    await page.waitForTimeout(1000);
    const badgePeak = page.locator('span:has-text("Peak Phase Climatology")');
    console.log('Switched to "projected" mode; Peak badge count:', await badgePeak.count());

    // Switch back to analogues
    await selSimilarMode.selectOption('analogues');
    await page.waitForTimeout(1000);
    const badgeAnalogues = page.locator('span:has-text("Sec 2 Forecast Analogues")');
    console.log('Switched back to "analogues" mode; Analogue badge count:', await badgeAnalogues.count());
    if (await badgeAnalogues.count() === 0) {
      throw new Error('FAIL: Badge did not restore to Sec 2 Forecast Analogues after switching mode');
    }
  }

  // 8. Test Toggle Off
  console.log('--- 8. Testing Toggle Off ---');
  await analogueChip.first().click();
  await page.waitForTimeout(1000);
  const isPressedAfter = await analogueChip.first().getAttribute('aria-pressed');
  console.log(`Analogue chip aria-pressed after toggle off: ${isPressedAfter}`);
  if (isPressedAfter !== 'false') {
    throw new Error(`FAIL: Expected aria-pressed="false" after toggle off, got "${isPressedAfter}"`);
  }

  // Re-enable for final screenshot
  await analogueChip.first().click();
  await page.waitForTimeout(1000);
  await fig31Card.scrollIntoViewIfNeeded();
  await fig31Card.screenshot({ path: `${ARTIFACT_DIR}/fig31_harmonization_final_verified.png` });
  console.log('Saved fig31_harmonization_final_verified.png');

  // Verify console errors
  console.log('Console errors:', errors.length);
  if (errors.length > 0) {
    console.error('Console errors detected:', errors);
    throw new Error(`FAIL: Detected ${errors.length} console errors`);
  }

  console.log('🎉 ALL HARMONIZATION OPTION A TESTS PASSED WITH 0 CONSOLE ERRORS!');
  await browser.close();
})();
