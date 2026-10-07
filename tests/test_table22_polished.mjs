import { chromium } from '/tmp/pw-verify/node_modules/playwright/index.mjs';

const ARTIFACT_DIR = '/Users/pstewarda/.gemini/antigravity/brain/ef0a6d9e-a7e9-4d4b-b638-72992f6f90bf';
const URL = 'http://localhost:4333/notebooks/KE-enso-explorer/notebook_v3.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.switchTab('tab-outlook'));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.switchOutlookSubTab('subtab-outlook-24'));
  await page.waitForTimeout(1500);

  // Apply highly polished Table 2.2 Matrix
  await page.evaluate(() => {
    const card = document.querySelector('#section-kmsa-advisories');
    const oldGrid = card.querySelector('.kmsa-advisory-grid');
    if (!oldGrid) return;

    const data = [
      {
        sector: 'Agriculture & Food Security',
        color: '#16a34a',
        bg: '#f0fdf4',
        border: '#86efac',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        icon: '🌱',
        title: 'Crop Production & Post-Harvest Advisory',
        lead: 'Ministry of Agriculture & Livestock Development / KALRO',
        source: 'KMSA Seasonal Advisory Guidelines (Agriculture Sector)',
        actions: [
          { bold: 'Certified Drought-Tolerant Seeds:', text: 'Promote dryland cereals (sorghum, finger millet) and pulses (green grams, cowpeas, dolichos lablab) certified by KALRO and state agricultural offices.' },
          { bold: 'Moisture Conservation:', text: 'Deploy in-situ rainwater harvesting techniques including zai pits, tied ridges, and stone contour bunds across agro-pastoral zones.' },
          { bold: 'Post-Harvest Protection:', text: 'If above-normal rains extend into harvest periods, mobilize hermetic storage bags and mobile grain dryers to prevent post-harvest mold and aflatoxin contamination.' }
        ]
      },
      {
        sector: 'Pastoralism & Livestock',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        badgeBg: '#fef3c7',
        badgeColor: '#92400e',
        icon: '🐄',
        title: 'Rangeland & Animal Health Advisory',
        lead: 'Directorate of Veterinary Services / NDMA',
        source: 'KMSA Pastoral Advisory Matrix',
        actions: [
          { bold: 'Strategic Pasture Grazing Reserves:', text: 'Demarcate dry-season grazing areas and establish fodder banks (hay baling, reseeding of denuded rangelands) ahead of dry spells.' },
          { bold: 'Epizootic Disease Surveillance:', text: 'Flood conditions following severe drought trigger acute outbreaks of mosquito-borne Rift Valley Fever (RVF) and Contagious Caprine Pleuropneumonia (CCPP). Pre-position ring-vaccination doses.' },
          { bold: 'Strategic Commercial De-stocking:', text: 'During developing drought phases, trigger commercial offtake before animal body condition deteriorates below market exchange thresholds.' }
        ]
      },
      {
        sector: 'Water & Sanitation',
        color: '#0284c7',
        bg: '#f0f9ff',
        border: '#bae6fd',
        badgeBg: '#e0f2fe',
        badgeColor: '#0369a1',
        icon: '💧',
        title: 'Water Infrastructure & Quality Management',
        lead: 'Ministry of Water, Sanitation & Irrigation',
        source: 'KMSA Water Advisory Protocol',
        actions: [
          { bold: 'Dam & Pan Desilting:', text: 'Desilt earth dams and municipal water pans prior to seasonal rains to maximize volumetric surface capture.' },
          { bold: 'Borehole Protection & Water Treatment:', text: 'Raise borehole wellhead aprons above historical flood lines. Stock community distribution centres with chlorine powder and household water purification sachets.' },
          { bold: 'Flood Spillway Reinforcement:', text: 'Inspect spillways of community water storage structures to prevent breach during high-intensity flash-flood events.' }
        ]
      },
      {
        sector: 'Disaster Risk Management',
        color: '#e11d48',
        bg: '#fff1f2',
        border: '#fecdd3',
        badgeBg: '#ffe4e6',
        badgeColor: '#be123c',
        icon: '🛡️',
        title: 'Emergency Contingency & Transport Access',
        lead: 'County Disaster Risk Management Committee (CDRMC) / NDMA',
        source: 'KMSA DRM Early Warning Protocols (Act No. 16 of 2026)',
        actions: [
          { bold: 'Transport Drainage & Culvert Clearing:', text: 'Clear seasonal storm runoff culverts along primary road corridors and feeder roads before onset to prevent transport severance.' },
          { bold: 'County Committee Activation:', text: 'Convene the County Disaster Risk Management Committee (CDRMC) under the National Disaster Risk Management Act, 2026 (Act No. 16 of 2026), co-chaired by the County Governor and County Commissioner upon KMSA alert issuance.' },
          { bold: 'Community Early Warning:', text: 'Transmit CDM downscaled advisories in local pastoral languages via vernacular FM radio and NDMA community channels.' }
        ]
      }
    ];

    const tableHtml = `
      <div id="table22-matrix-wrap" style="overflow-x: auto; border: 1px solid #cbd5e1; border-radius: 8px; margin: 1rem 0; box-shadow: 0 1px 4px rgba(0,0,0,0.03);">
        <table style="width: 100%; min-width: 860px; border-collapse: collapse; font-size: 0.82rem; text-align: left; background: #ffffff;">
          <thead style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
            <tr>
              <th style="padding: 10px 14px; width: 23%; color: #1e293b; font-weight: 800; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em;">Sector &amp; Advisory Scope</th>
              <th style="padding: 10px 16px; width: 55%; color: #1e293b; font-weight: 800; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em;">Priority Operational Triggers &amp; Preparedness Actions</th>
              <th style="padding: 10px 14px; width: 22%; color: #1e293b; font-weight: 800; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em;">Lead Institutional Partners</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((row, idx) => `
              <tr style="border-bottom: ${idx === data.length - 1 ? 'none' : '1px solid #e2e8f0'}; background: ${idx % 2 === 0 ? '#ffffff' : '#fcfdfe'};">
                <td style="padding: 12px 14px; vertical-align: top; border-right: 1px solid #f1f5f9; border-left: 4px solid ${row.color};">
                  <div style="display: inline-flex; align-items: center; gap: 5px; background: ${row.badgeBg}; color: ${row.badgeColor}; border: 1px solid ${row.border}; padding: 2px 7px; border-radius: 4px; font-size: 0.70rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px;">
                    <span>${row.icon}</span>
                    <span>${row.sector}</span>
                  </div>
                  <strong style="font-size: 0.88rem; color: #0f172a; display: block; line-height: 1.35; margin-top: 2px;">
                    ${row.title}
                  </strong>
                </td>
                <td style="padding: 12px 16px; vertical-align: top; border-right: 1px solid #f1f5f9;">
                  <ul style="margin: 0; padding-left: 1.15rem; color: #334155; line-height: 1.48; font-size: 0.80rem;">
                    ${row.actions.map(a => `
                      <li style="margin-bottom: 0.35rem;">
                        <strong style="color: #0f172a;">${a.bold}</strong> ${a.text}
                      </li>
                    `).join('')}
                  </ul>
                </td>
                <td style="padding: 12px 14px; vertical-align: top; font-size: 0.76rem; color: #475569; line-height: 1.45;">
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 10px;">
                    <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px; font-size: 0.74rem;">Mandated Lead:</div>
                    <div style="color: #334155; font-weight: 600;">${row.lead}</div>
                    <div style="border-top: 1px solid #e2e8f0; margin-top: 5px; padding-top: 4px; font-size: 0.71rem; color: #64748b;">
                      ${row.source}
                    </div>
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

  const card = await page.$('#section-kmsa-advisories');
  if (card) {
    await card.screenshot({ path: `${ARTIFACT_DIR}/table22_matrix_table_polished.png` });
    console.log('Saved polished matrix table screenshot');
  }

  // Also capture the view including both Table 2.2 and Table 2.3 for overall flow
  const pane = await page.$('#subtab-outlook-24');
  if (pane) {
    await pane.screenshot({ path: `${ARTIFACT_DIR}/subtab24_flow_with_table22_matrix.png` });
    console.log('Saved subtab 24 full flow screenshot');
  }

  await browser.close();
})();
