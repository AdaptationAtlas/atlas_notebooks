import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const URL = 'http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });

  console.log('Navigating to', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  // Switch to Section 3 (Evidence)
  const tab3 = page.locator('#btn-tab-graphs');
  await tab3.click();
  await page.waitForTimeout(2000);

  // 1. Section 3 Overview (Guide card + County Baseline card)
  const sec3Overview = page.locator('#subtab-climate-31 > div.card, #sec3SubcountyCompareHost');
  await page.locator('#subtab-climate-31').screenshot({
    path: `${ARTIFACT_DIR}/v390_sec3_subtab31_top.png`,
    clip: { x: 0, y: 0, width: 1440, height: 850 }
  });

  // 2. Figure 3.1
  const fig31 = page.locator('#section-rain-climatology');
  await fig31.screenshot({ path: `${ARTIFACT_DIR}/v390_fig31_full.png` });

  // 3. Figure 3.1B (Sequence View)
  const fig31b = page.locator('#section-consecutive-sequence');
  await fig31b.screenshot({ path: `${ARTIFACT_DIR}/v390_fig31b_full.png` });

  // 4. Figure 3.2 (Contingency Table)
  const fig32 = page.locator('#section-tercile-contingency');
  await fig32.screenshot({ path: `${ARTIFACT_DIR}/v390_fig32_full.png` });

  // 5. Figure 3.3 (Driver Scatter)
  const fig33 = page.locator('#section-driver-scatter');
  await fig33.screenshot({ path: `${ARTIFACT_DIR}/v390_fig33_full.png` });

  // Switch to Sub-tab 3.2 for Spatial Grids & Flood Explorer
  const btnSubtab32 = page.locator('#btn-subtab-climate-32');
  if (await btnSubtab32.count() > 0) {
    await btnSubtab32.click();
    await page.waitForTimeout(2000);
  }

  // 6. Figure 3.4 (Raster Grid)
  const fig34 = page.locator('#section-raster-grid');
  await fig34.screenshot({ path: `${ARTIFACT_DIR}/v390_fig34_full.png` });

  // 7. Figure 3.5 (Flood Explorer)
  const fig35 = page.locator('#section-flood-explorer');
  await fig35.screenshot({ path: `${ARTIFACT_DIR}/v390_fig35_full.png` });

  console.log('Screenshots captured successfully!');
  await browser.close();
})();
