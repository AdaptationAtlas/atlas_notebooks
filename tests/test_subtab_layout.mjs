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
  await page.waitForTimeout(5000);

  // 1. Switch to Section 2 (tab-outlook)
  console.log('Switching to Section 2 (tab-outlook)...');
  await page.evaluate(() => window.switchTab('tab-outlook'));
  await page.waitForTimeout(1000);

  // Check subtab 2.1 is active, others hidden
  const sub21Active = await page.evaluate(() => {
    const p21 = document.getElementById('subtab-outlook-21');
    const p22 = document.getElementById('subtab-outlook-22');
    return {
      p21Display: window.getComputedStyle(p21).display,
      p22Display: window.getComputedStyle(p22).display,
      scrollY: window.scrollY
    };
  });
  console.log('Subtab 2.1 status:', sub21Active);
  if (sub21Active.p21Display !== 'block' || sub21Active.p22Display !== 'none') {
    throw new Error('FAIL: subtab-outlook-21 should be block and subtab-outlook-22 should be none');
  }

  // Screenshot 2.1 hero cards
  const heroCard = await page.$('#sec5LiveHeroHost');
  if (heroCard) {
    await heroCard.screenshot({ path: `${ARTIFACT_DIR}/sec21_3cards_on_one_line.png` });
    console.log(`Saved ${ARTIFACT_DIR}/sec21_3cards_on_one_line.png`);
  }

  // 2. Switch to Section 2.2
  console.log('Switching to Subtab 2.2...');
  await page.evaluate(() => window.switchOutlookSubTab('subtab-outlook-22'));
  await page.waitForTimeout(1000);

  const sub22Active = await page.evaluate(() => {
    const p21 = document.getElementById('subtab-outlook-21');
    const p22 = document.getElementById('subtab-outlook-22');
    const fig21 = document.getElementById('section-figure-2-1');
    const mam = document.getElementById('section-mam-teleconnection');
    return {
      p21Display: window.getComputedStyle(p21).display,
      p22Display: window.getComputedStyle(p22).display,
      fig21Width: fig21 ? fig21.offsetWidth : 0,
      mamWidth: mam ? mam.offsetWidth : 0
    };
  });
  console.log('Subtab 2.2 status:', sub22Active);
  if (sub22Active.p22Display !== 'block' || sub22Active.p21Display !== 'none') {
    throw new Error('FAIL: subtab-outlook-22 should be block and subtab-outlook-21 should be none');
  }

  const sec22Pane = await page.$('#subtab-outlook-22');
  if (sec22Pane) {
    await sec22Pane.screenshot({ path: `${ARTIFACT_DIR}/fig21_fullwidth_with_mam_below.png` });
    console.log(`Saved ${ARTIFACT_DIR}/fig21_fullwidth_with_mam_below.png`);
  }

  // 3. Switch to Section 2.3
  console.log('Switching to Subtab 2.3...');
  await page.evaluate(() => window.switchOutlookSubTab('subtab-outlook-23'));
  await page.waitForTimeout(1500);

  const sec23Pane = await page.$('#subtab-outlook-23');
  if (sec23Pane) {
    await sec23Pane.screenshot({ path: `${ARTIFACT_DIR}/sec23_4cards_on_one_line.png` });
    console.log(`Saved ${ARTIFACT_DIR}/sec23_4cards_on_one_line.png`);
  }

  // 4. Test Section 1 Subtabs
  console.log('Testing Section 1 (tab-profile) subtabs...');
  await page.evaluate(() => window.switchTab('tab-profile'));
  await page.waitForTimeout(1000);

  const p11Active = await page.evaluate(() => {
    const p11 = document.getElementById('subtab-profile-11');
    const p12 = document.getElementById('subtab-profile-12');
    return {
      p11Display: window.getComputedStyle(p11).display,
      p12Display: window.getComputedStyle(p12).display
    };
  });
  console.log('Section 1 Subtab 1.1 status:', p11Active);
  if (p11Active.p11Display !== 'block' || p11Active.p12Display !== 'none') {
    throw new Error('FAIL: Section 1 subtab-profile-11 should be block');
  }

  console.log(`Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors found:', consoleErrors);
    throw new Error('Console errors encountered');
  }

  console.log('ALL SUBTAB LAYOUT AND SCREENSHOT VERIFICATIONS PASSED WITH 0 CONSOLE ERRORS!');
  await browser.close();
})();
