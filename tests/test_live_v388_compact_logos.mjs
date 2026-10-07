import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const LIVE_URL = 'https://peetmate.github.io/ke-enso-explorer/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 2000 } });

  console.log(`Connecting to live site: ${LIVE_URL}...`);
  await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Check version display
  const releaseVersion = await page.evaluate(async () => {
    try {
      const res = await fetch('../../data/KE-enso-explorer/release.json?t=' + Date.now());
      const data = await res.json();
      return data.version;
    } catch (e) {
      return null;
    }
  });
  console.log(`Live release.json version: ${releaseVersion}`);

  // Switch to Section 2 Subtab 2.4
  await page.evaluate(() => window.switchTab('tab-outlook'));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.switchOutlookSubTab('subtab-outlook-24'));
  await page.waitForTimeout(2000);

  // Capture Table 2.3 directory card
  const card = await page.$('.enso-figure-card:has(.approved-tools-grid)');
  if (card) {
    await card.screenshot({ path: `${ARTIFACT_DIR}/live_deployed_v388_table23.png` });
    console.log('Saved live_deployed_v388_table23.png');
  }

  // Verify all 6 images loaded (naturalWidth > 0)
  const imagesStatus = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('.tool-card-logo-img'));
    return imgs.map(img => ({
      src: img.getAttribute('src'),
      loaded: img.complete && img.naturalWidth > 0,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
  });
  console.log('Logo images status on live site:', JSON.stringify(imagesStatus, null, 2));

  await browser.close();
})();
