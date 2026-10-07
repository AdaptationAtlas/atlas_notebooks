import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const URL = 'http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 3500 } });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.switchTab('tab-outlook'));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.switchOutlookSubTab('subtab-outlook-24'));
  await page.waitForTimeout(1500);

  const card = await page.$('.enso-figure-card:has(.approved-tools-grid)');
  if (card) {
    await card.screenshot({ path: `${ARTIFACT_DIR}/table23_compact_logos_rendered.png` });
    console.log('Saved table23_compact_logos_rendered.png');
  }

  const fullPane = await page.$('#subtab-outlook-24');
  if (fullPane) {
    await fullPane.screenshot({ path: `${ARTIFACT_DIR}/subtab24_complete_rendered.png` });
    console.log('Saved subtab24_complete_rendered.png');
  }

  await browser.close();
})();
