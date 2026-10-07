import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const URL = 'http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1600 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.toString()));

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  // Switch to Section 2 (tab-outlook)
  console.log('Switching to Section 2 (tab-outlook)...');
  await page.evaluate(() => window.switchTab('tab-outlook'));
  await page.waitForTimeout(1000);

  // Switch to Subtab 2.4 (Official Early Warning Advisories & Directory)
  console.log('Switching to Subtab 2.4...');
  await page.evaluate(() => window.switchOutlookSubTab('subtab-outlook-24'));
  await page.waitForTimeout(2000);

  // Check subtab 2.4 visibility and content of #kmdCapAlertsHost
  const alertHost = await page.$('#kmdCapAlertsHost');
  if (!alertHost) throw new Error('#kmdCapAlertsHost not found');

  const alertHostText = await alertHost.innerText();
  console.log('Alert Host Text preview:', alertHostText.slice(0, 300));

  // Verify "No Active Severe Weather Warnings in Effect"
  if (!alertHostText.includes('No Active Severe Weather Warnings in Effect')) {
    throw new Error('FAIL: Expected "No Active Severe Weather Warnings in Effect" banner');
  }

  // Screenshot the KMD CAP Card in closed archive state
  await alertHost.screenshot({ path: `${ARTIFACT_DIR}/subtab24_kmd_normal_monitoring.png` });
  console.log(`Saved ${ARTIFACT_DIR}/subtab24_kmd_normal_monitoring.png`);

  // Open the collapsible Historical Advisory Archive details
  const details = await alertHost.$('details.enso-more-details');
  if (details) {
    await page.evaluate(el => el.open = true, details);
    await page.waitForTimeout(500);
    await alertHost.screenshot({ path: `${ARTIFACT_DIR}/subtab24_kmd_archive_expanded.png` });
    console.log(`Saved ${ARTIFACT_DIR}/subtab24_kmd_archive_expanded.png`);
  }

  console.log('Console errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
    process.exit(1);
  }

  console.log('ALL SUBTAB 2.4 KMD CAP AUDIT VERIFICATIONS PASSED WITH 0 CONSOLE ERRORS!');
  await browser.close();
})();
