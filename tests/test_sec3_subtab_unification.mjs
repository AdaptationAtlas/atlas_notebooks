import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const URL = 'http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  // 1. Verify Top Main Tab Nav
  console.log('--- 1. Testing Main Tab 3 Navigation ---');
  const tab3Btn = await page.$('#btn-tab-graphs');
  if (!tab3Btn) throw new Error('FAIL: #btn-tab-graphs not found in #mainTabNav');

  const tab3Text = await page.evaluate(el => el.innerText, tab3Btn);
  console.log('Tab 3 Button Text:', JSON.stringify(tab3Text));
  if (!tab3Text.includes('3') || !tab3Text.toLowerCase().includes('climate')) {
    throw new Error(`FAIL: Tab 3 button unexpected text: ${tab3Text}`);
  }

  // Switch to Section 3
  await tab3Btn.click();
  await page.waitForTimeout(1000);

  const tab3Active = await page.evaluate(() => {
    const btn = document.getElementById('btn-tab-graphs');
    const pane = document.getElementById('tab-graphs');
    return {
      btnActive: btn.classList.contains('active'),
      paneActive: pane.classList.contains('active') && !pane.hasAttribute('hidden')
    };
  });
  console.log('Section 3 Activation:', tab3Active);
  if (!tab3Active.btnActive || !tab3Active.paneActive) {
    throw new Error('FAIL: Section 3 did not activate properly');
  }

  // 2. Verify Sticky Sub-Navigation Bar
  console.log('--- 2. Testing Sticky Sub-Navigation for Section 3 ---');
  const stickySubNavInfo = await page.evaluate(() => {
    const wrapper = document.getElementById('stickySubNavWrapper');
    const host = document.getElementById('stickySubNav');
    const btns = Array.from(host.querySelectorAll('.ke-subnav-btn')).map(b => ({
      text: b.innerText.trim(),
      active: b.classList.contains('active'),
      onclick: b.getAttribute('onclick')
    }));
    return {
      wrapperVisible: wrapper.style.display !== 'none',
      title: host.querySelector('.subnav-title')?.innerText,
      buttons: btns
    };
  });
  console.log('Sticky Sub-Nav Info:', JSON.stringify(stickySubNavInfo, null, 2));
  if (!stickySubNavInfo.wrapperVisible) {
    throw new Error('FAIL: #stickySubNavWrapper is not visible for Section 3');
  }
  if (!stickySubNavInfo.title?.toLowerCase().includes('section 3')) {
    throw new Error(`FAIL: Unexpected sticky subnav title: ${stickySubNavInfo.title}`);
  }
  if (stickySubNavInfo.buttons.length !== 2) {
    throw new Error(`FAIL: Expected 2 sub-nav buttons, got ${stickySubNavInfo.buttons.length}`);
  }

  // 3. Verify Sub-tab 3.1 Display
  console.log('--- 3. Testing In-Page Sub-tab 3.1 ---');
  const sub31State = await page.evaluate(() => {
    const p31 = document.getElementById('subtab-climate-31');
    const p32 = document.getElementById('subtab-climate-32');
    const btn31 = document.getElementById('btn-subtab-climate-31');
    const btn32 = document.getElementById('btn-subtab-climate-32');
    return {
      p31Display: window.getComputedStyle(p31).display,
      p32Display: window.getComputedStyle(p32).display,
      btn31Active: btn31.classList.contains('active'),
      btn32Active: btn32.classList.contains('active')
    };
  });
  console.log('Sub-tab 3.1 Initial State:', sub31State);
  if (sub31State.p31Display === 'none' || sub31State.p32Display !== 'none') {
    throw new Error('FAIL: Sub-tab 3.1 not displaying properly initially');
  }

  // Screenshot Subtab 3.1
  const sub31Pane = await page.$('#subtab-climate-31');
  if (sub31Pane) {
    await page.screenshot({ path: `${ARTIFACT_DIR}/sec3_subtab31_view.png` });
    console.log('Saved sec3_subtab31_view.png');
  }

  // 4. Switch to Sub-tab 3.2 via button
  console.log('--- 4. Testing Switch to Sub-tab 3.2 ---');
  await page.evaluate(() => window.switchClimateSubTab('subtab-climate-32'));
  await page.waitForTimeout(1000);

  const sub32State = await page.evaluate(() => {
    const p31 = document.getElementById('subtab-climate-31');
    const p32 = document.getElementById('subtab-climate-32');
    const btn31 = document.getElementById('btn-subtab-climate-31');
    const btn32 = document.getElementById('btn-subtab-climate-32');
    const stickyBtns = Array.from(document.querySelectorAll('#stickySubNav .ke-subnav-btn')).map(b => ({
      text: b.innerText.trim(),
      active: b.classList.contains('active')
    }));
    return {
      p31Display: window.getComputedStyle(p31).display,
      p32Display: window.getComputedStyle(p32).display,
      btn31Active: btn31.classList.contains('active'),
      btn32Active: btn32.classList.contains('active'),
      stickyBtns
    };
  });
  console.log('Sub-tab 3.2 Active State:', JSON.stringify(sub32State, null, 2));
  if (sub32State.p32Display === 'none' || sub32State.p31Display !== 'none') {
    throw new Error('FAIL: Sub-tab 3.2 not displaying properly after switch');
  }
  if (!sub32State.stickyBtns[1]?.active) {
    throw new Error('FAIL: Sticky subnav button for 3.2 did not become active');
  }

  // Screenshot Subtab 3.2
  await page.screenshot({ path: `${ARTIFACT_DIR}/sec3_subtab32_view.png` });
  console.log('Saved sec3_subtab32_view.png');

  // Capture Section 3 Top Header + Sub-tab Bar
  const sec3Header = await page.$('#tab-graphs');
  if (sec3Header) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${ARTIFACT_DIR}/sec3_subtab_handle_full.png` });
    console.log('Saved sec3_subtab_handle_full.png');
  }

  console.log(`Console errors: ${errors.length}`);
  if (errors.length > 0) {
    console.error('Errors:', errors);
    throw new Error('Console errors encountered');
  }

  console.log('ALL SECTION 3 SUB-TAB UNIFICATION ASSERTIONS PASSED WITH 0 CONSOLE ERRORS!');
  await browser.close();
})();
