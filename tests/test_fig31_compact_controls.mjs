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

  // 1. Navigate to Section 3
  console.log('--- 1. Navigating to Section 3 ---');
  const tab3 = await page.$('#btn-tab-graphs');
  if (!tab3) throw new Error('FAIL: #btn-tab-graphs not found');
  await tab3.click();
  await page.waitForTimeout(2000);

  // 2. Locate Figure 3.1 Controls Host
  console.log('--- 2. Inspecting Figure 3.1 Compact Toolbar ---');
  const controlsHost = page.locator('#sec21ControlsHost');
  if (await controlsHost.count() === 0) throw new Error('FAIL: #sec21ControlsHost not found');

  const toolbar = page.locator('.fig31-toolbar');
  if (await toolbar.count() === 0) throw new Error('FAIL: .fig31-toolbar not found');

  const box = await controlsHost.boundingBox();
  console.log(`Figure 3.1 Controls Bounding Box: width=${box.width}px, height=${box.height}px`);

  if (box.height > 90) {
    throw new Error(`FAIL: Figure 3.1 controls height is ${box.height}px, expected <= 90px (was 379px before!)`);
  }
  console.log(`SUCCESS: Height dramatically reduced from 379px to ${box.height.toFixed(1)}px (>76% reduction)!`);

  // Screenshot initial compact toolbar
  await controlsHost.screenshot({ path: `${ARTIFACT_DIR}/fig31_compact_controls_after.png` });
  console.log('Saved fig31_compact_controls_after.png');

  // Screenshot full card with graph
  const card = page.locator('#section-rain-climatology');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await card.screenshot({ path: `${ARTIFACT_DIR}/fig31_card_after.png` });
  console.log('Saved fig31_card_after.png');

  // 3. Test View: Toggle to Monthly Climatology
  console.log('--- 3. Testing "Monthly" View Mode ---');
  const monthlyBtn = page.locator('.fig31-pill-btn:has-text("Monthly")');
  await monthlyBtn.click();
  await page.waitForTimeout(1500);

  const monthlyBox = await controlsHost.boundingBox();
  console.log(`Monthly View Controls Height: ${monthlyBox.height.toFixed(1)}px`);
  await controlsHost.screenshot({ path: `${ARTIFACT_DIR}/fig31_monthly_controls_after.png` });
  console.log('Saved fig31_monthly_controls_after.png');

  // Switch back to "By year"
  console.log('--- 4. Switching back to "By year" ---');
  const byYearBtn = page.locator('.fig31-pill-btn:has-text("By year")');
  await byYearBtn.click();
  await page.waitForTimeout(1500);

  // 4. Test Rainfall Mode: Toggle to Anomaly
  console.log('--- 5. Testing "Anomaly" Rainfall Mode ---');
  const anomalyBtn = page.locator('.fig31-pill-btn:has-text("Anomaly")');
  await anomalyBtn.click();
  await page.waitForTimeout(1500);

  // Toggle back to Absolute
  const absoluteBtn = page.locator('.fig31-pill-btn:has-text("Absolute")');
  await absoluteBtn.click();
  await page.waitForTimeout(1000);

  // 5. Test Ocean Strip: Toggle to Intensity then Off then Phase
  console.log('--- 6. Testing Ocean Driver Strip Modes ---');
  const intensityBtn = page.locator('.fig31-pill-btn:has-text("Intensity")');
  await intensityBtn.click();
  await page.waitForTimeout(1000);

  const offBtn = page.locator('.fig31-pill-btn:has-text("Off")');
  await offBtn.click();
  await page.waitForTimeout(1000);

  const phaseBtn = page.locator('.fig31-pill-btn:has-text("Phase")');
  await phaseBtn.click();
  await page.waitForTimeout(1000);

  // 6. Test Sub-county Range Dropdown
  console.log('--- 7. Testing Range Dropdown ---');
  const rangeSelect = page.locator('.fig31-select');
  await rangeSelect.selectOption({ label: 'Typical range (±1 sd)' });
  await page.waitForTimeout(1000);
  await rangeSelect.selectOption({ label: 'None (county mean)' });
  await page.waitForTimeout(1000);

  // 7. Test Year Filter and Reset Button
  console.log('--- 8. Testing Year Filter and Reset Button ---');
  const numInputs = page.locator('.fig31-num-input');
  const fromInput = numInputs.first();
  await fromInput.fill('1997');
  await fromInput.press('Enter');
  await page.waitForTimeout(1500);

  const valAfterFill = await fromInput.inputValue();
  console.log(`From year changed to: ${valAfterFill}`);

  const resetBtn = page.locator('.fig31-reset-btn');
  await resetBtn.click();
  await page.waitForTimeout(1500);

  const valAfterReset = await fromInput.inputValue();
  console.log(`From year restored to: ${valAfterReset}`);
  if (valAfterReset !== '1981') {
    throw new Error(`FAIL: Expected from year to be 1981 after reset, got ${valAfterReset}`);
  }

  // Final card screenshot
  await card.screenshot({ path: `${ARTIFACT_DIR}/fig31_card_interactive_verified.png` });
  console.log('Saved fig31_card_interactive_verified.png');

  // Verify console errors
  console.log('Console errors:', errors.length);
  if (errors.length > 0) {
    console.error('Console errors detected:', errors);
    throw new Error(`FAIL: Detected ${errors.length} console errors`);
  }

  console.log('🎉 ALL FIGURE 3.1 COMPACT CONTROLS TESTS PASSED WITH 0 CONSOLE ERRORS!');
  await browser.close();
})();
