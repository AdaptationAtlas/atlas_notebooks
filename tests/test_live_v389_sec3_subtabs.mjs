import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const LIVE_URL = 'https://peetmate.github.io/ke-enso-explorer/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });

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

  // Switch to Section 3
  console.log('Switching to Section 3 on live site...');
  await page.evaluate(() => window.switchTab('tab-graphs'));
  await page.waitForTimeout(2000);

  // Capture Subtab 3.1
  await page.screenshot({ path: `${ARTIFACT_DIR}/live_deployed_v389_sec3_subtab31.png` });
  console.log('Saved live_deployed_v389_sec3_subtab31.png');

  // Switch to Subtab 3.2
  console.log('Switching to Subtab 3.2 on live site...');
  await page.evaluate(() => window.switchClimateSubTab('subtab-climate-32'));
  await page.waitForTimeout(2000);

  // Capture Subtab 3.2
  await page.screenshot({ path: `${ARTIFACT_DIR}/live_deployed_v389_sec3_subtab32.png` });
  console.log('Saved live_deployed_v389_sec3_subtab32.png');

  // Verify sticky subnav on live site
  const stickyInfo = await page.evaluate(() => {
    const host = document.getElementById('stickySubNav');
    const btns = Array.from(host.querySelectorAll('.ke-subnav-btn')).map(b => ({
      text: b.innerText.trim(),
      active: b.classList.contains('active')
    }));
    return {
      title: host.querySelector('.subnav-title')?.innerText,
      buttons: btns
    };
  });
  console.log('Live Sticky Subnav Info:', JSON.stringify(stickyInfo, null, 2));

  await browser.close();
})();
