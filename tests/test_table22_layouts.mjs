import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const URL = 'http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1600 } });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.switchTab('tab-outlook'));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.switchOutlookSubTab('subtab-outlook-24'));
  await page.waitForTimeout(1500);

  // --- OPTION A: 2x2 Grid ---
  await page.evaluate(() => {
    const grid = document.querySelector('.kmsa-advisory-grid');
    if (grid) {
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      grid.style.gap = '1rem';
    }
    const items = document.querySelectorAll('.kmsa-advisory-item');
    const colors = ['#16a34a', '#d97706', '#0284c7', '#e11d48'];
    const bgs = ['#f0fdf4', '#fffbeb', '#f0f9ff', '#fff1f2'];
    items.forEach((item, idx) => {
      item.style.borderLeft = `4px solid ${colors[idx]}`;
      item.style.padding = '1rem 1.15rem';
      item.style.background = '#ffffff';
      item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      const ul = item.querySelector('ul');
      if (ul) {
        ul.style.margin = '0 0 0.65rem';
        ul.style.paddingLeft = '1.1rem';
        ul.style.fontSize = '0.81rem';
        ul.style.lineHeight = '1.45';
      }
      const lis = item.querySelectorAll('li');
      lis.forEach(li => li.style.marginBottom = '0.35rem');
      const attr = item.querySelector('.onpage-attribution-bar');
      if (attr) {
        attr.style.padding = '0.45rem 1.15rem';
        attr.style.fontSize = '0.74rem';
      }
    });
  });

  const cardA = await page.$('#section-kmsa-advisories');
  if (cardA) {
    await cardA.screenshot({ path: `${ARTIFACT_DIR}/table22_optionA_2x2_grid.png` });
    console.log('Saved option A: 2x2 grid screenshot');
  }

  // --- OPTION B: Structured Table Matrix ---
  await page.evaluate(() => {
    const card = document.querySelector('#section-kmsa-advisories');
    const oldGrid = card.querySelector('.kmsa-advisory-grid');
    if (!oldGrid) return;

    const data = [
      {
        sector: 'Agriculture & Food Security',
        color: '#16a34a',
        bg: '#dcfce7',
        icon: '🌱',
        title: 'Crop Production & Post-Harvest Advisory',
        source: 'KMSA Seasonal Advisory Guidelines (Agriculture Sector) • Ministry of Agriculture & Livestock Development',
        actions: [
          { bold: 'Certified Drought-Tolerant Seeds:', text: 'Promote dryland cereals (sorghum, finger millet) and pulses (green grams, cowpeas, dolichos lablab) certified by KALRO and state agricultural offices.' },
          { bold: 'Moisture Conservation:', text: 'Deploy in-situ rainwater harvesting techniques including zai pits, tied ridges, and stone contour bunds across agro-pastoral zones.' },
          { bold: 'Post-Harvest Protection:', text: 'If above-normal rains extend into harvest periods, mobilize hermetic storage bags and mobile grain dryers to prevent post-harvest mold and aflatoxin contamination.' }
        ]
      },
      {
        sector: 'Pastoralism & Livestock',
        color: '#d97706',
        bg: '#fef3c7',
        icon: '🐄',
        title: 'Rangeland & Animal Health Advisory',
        source: 'KMSA Pastoral Advisory Matrix • Directorate of Veterinary Services • NDMA',
        actions: [
          { bold: 'Strategic Pasture Grazing Reserves:', text: 'Demarcate dry-season grazing areas and establish fodder banks (hay baling, reseeding of denuded rangelands) ahead of dry spells.' },
          { bold: 'Epizootic Disease Surveillance:', text: 'Flood conditions following severe drought trigger acute outbreaks of mosquito-borne Rift Valley Fever (RVF) and Contagious Caprine Pleuropneumonia (CCPP). Pre-position ring-vaccination doses.' },
          { bold: 'Strategic Commercial De-stocking:', text: 'During developing drought phases, trigger commercial offtake before animal body condition deteriorates below market exchange thresholds.' }
        ]
      },
      {
        sector: 'Water & Sanitation',
        color: '#0284c7',
        bg: '#e0f2fe',
        icon: '💧',
        title: 'Water Infrastructure & Quality Management',
        source: 'KMSA Water Advisory Protocol • Ministry of Water, Sanitation & Irrigation',
        actions: [
          { bold: 'Dam & Pan Desilting:', text: 'Desilt earth dams and municipal water pans prior to seasonal rains to maximize volumetric surface capture.' },
          { bold: 'Borehole Protection & Water Treatment:', text: 'Raise borehole wellhead aprons above historical flood lines. Stock community distribution centres with chlorine powder and household water purification sachets.' },
          { bold: 'Flood Spillway Reinforcement:', text: 'Inspect spillways of community water storage structures to prevent breach during high-intensity flash-flood events.' }
        ]
      },
      {
        sector: 'Disaster Risk Management',
        color: '#e11d48',
        bg: '#ffe4e6',
        icon: '🛡️',
        title: 'Emergency Contingency & Transport Access',
        source: 'KMSA DRM Early Warning Protocols • NDMA Standard Operating Procedures',
        actions: [
          { bold: 'Transport Drainage & Culvert Clearing:', text: 'Clear seasonal storm runoff culverts along primary road corridors and feeder roads before onset to prevent transport severance.' },
          { bold: 'County Committee Activation:', text: 'Convene the County Disaster Risk Management Committee (CDRMC) under the National Disaster Risk Management Act, 2026 (Act No. 16 of 2026), co-chaired by the County Governor and County Commissioner upon KMSA alert issuance.' },
          { bold: 'Community Early Warning:', text: 'Transmit CDM downscaled advisories in local pastoral languages via vernacular FM radio and NDMA community channels.' }
        ]
      }
    ];

    const tableHtml = `
      <div id="table22-matrix-wrap" style="overflow-x: auto; border: 1.5px solid #cbd5e1; border-radius: 8px; margin: 1rem 0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left; background: #ffffff;">
          <thead style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
            <tr>
              <th style="padding: 10px 14px; width: 24%; color: #0f172a; font-weight: 800; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em;">Sector &amp; Mandated Scope</th>
              <th style="padding: 10px 14px; width: 54%; color: #0f172a; font-weight: 800; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em;">Priority Operational Triggers &amp; Preparedness Actions</th>
              <th style="padding: 10px 14px; width: 22%; color: #0f172a; font-weight: 800; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em;">Institutional Sourcing &amp; Lead Agency</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((row, idx) => `
              <tr style="border-bottom: ${idx === data.length - 1 ? 'none' : '1px solid #e2e8f0'}; background: ${idx % 2 === 0 ? '#ffffff' : '#fcfdfe'};">
                <td style="padding: 12px 14px; vertical-align: top; border-right: 1px solid #f1f5f9; border-left: 4px solid ${row.color};">
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <span style="font-size: 1.1rem;">${row.icon}</span>
                    <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: ${row.color};">
                      ${row.sector}
                    </span>
                  </div>
                  <strong style="font-size: 0.88rem; color: #0f172a; display: block; line-height: 1.35; margin-top: 4px;">
                    ${row.title}
                  </strong>
                </td>
                <td style="padding: 12px 14px; vertical-align: top; border-right: 1px solid #f1f5f9;">
                  <ul style="margin: 0; padding-left: 1.15rem; color: #334155; line-height: 1.5; font-size: 0.80rem;">
                    ${row.actions.map(a => `
                      <li style="margin-bottom: 0.35rem;">
                        <strong style="color: #0f172a;">${a.bold}</strong> ${a.text}
                      </li>
                    `).join('')}
                  </ul>
                </td>
                <td style="padding: 12px 14px; vertical-align: top; font-size: 0.76rem; color: #475569; line-height: 1.45;">
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;">
                    <div style="font-weight: 700; color: #1e293b; margin-bottom: 3px;">Official Source:</div>
                    ${row.source}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    oldGrid.outerHTML = tableHtml;
  });

  if (cardA) {
    await cardA.screenshot({ path: `${ARTIFACT_DIR}/table22_optionB_matrix_table.png` });
    console.log('Saved option B: matrix table screenshot');
  }

  await browser.close();
})();
