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

  // Inject prototype of compact Table 2.3 cards with logos
  await page.evaluate(() => {
    const grid = document.querySelector('.approved-tools-grid');
    if (!grid) return;

    const cards = [
      {
        logo: '../../images/logos/kmsa_emblem.png',
        badgeClass: 'badge-kmsa',
        badgeText: 'Statutory National Authority',
        title: 'Kenya Meteorological Service Authority (KMSA)',
        subtitle: 'KMSA (formerly KMD) &bull; Meteorology Act No. 7 of 2026',
        desc: 'Sole legal authority for meteorological and climate services in Kenya. Formulates, regulates, and issues official weather forecasts, seasonal climate outlooks, and operational early warnings.',
        coverage: 'National (47 Counties)',
        cadence: 'Bi-annual &amp; 7-Day',
        tools: [
          { text: 'Seasonal Climate Outlooks (OND/MAM)', url: 'https://meteo.go.ke/our-products/seasonal-forecast/' },
          { text: '7-Day Downscaled (CDMs)', url: 'https://meteo.go.ke/our-products/county-forecast/' },
          { text: 'Severe Weather Advisories', url: 'https://meteo.go.ke/our-products/heavy-rainfall-advisories/' }
        ],
        portalText: 'meteo.go.ke Seasonal Forecasts &rarr;',
        portalUrl: 'https://meteo.go.ke/our-products/seasonal-forecast/'
      },
      {
        logo: '../../images/logos/ndma_emblem.png',
        badgeClass: 'badge-ndma',
        badgeText: 'Statutory ASAL Authority',
        title: 'National Drought Management Authority (NDMA)',
        subtitle: 'Mandated under NDMA Act, 2016 &bull; 23 ASAL Counties',
        desc: 'Coordinates drought risk management and contingency funding across Kenya\'s ASALs. Publishes monthly bulletins establishing official warning stages: Normal, Alert, Alarm, Emergency.',
        coverage: '23 ASAL Counties',
        cadence: 'Monthly Early Warning',
        tools: [
          { text: 'Monthly County Bulletins', url: 'https://www.ndma.go.ke/index.php/bulletins' },
          { text: 'National EW Bulletins', url: 'https://www.ndma.go.ke/index.php/resource-center/category/1-national-drought-early-warning-bulletins' },
          { text: 'NDEF Guidelines &amp; VCI System', url: 'https://www.ndma.go.ke' }
        ],
        portalText: 'ndma.go.ke Early Warning &rarr;',
        portalUrl: 'https://www.ndma.go.ke'
      },
      {
        logo: '../../images/logos/krcs_emblem.png',
        badgeClass: 'badge-krcs',
        badgeText: 'IFRC Anticipatory Action Protocol',
        title: 'Kenya Red Cross Society (KRCS) Early Action Protocol',
        subtitle: 'IFRC DREF-Backed EAPs for Floods &amp; Drought &bull; Implemented by KRCS',
        desc: 'Forecast-based action protocols funded by IFRC DREF. Triggers anticipatory assistance (water purification pre-positioning, livestock feed) when physical thresholds fire (SPI &le; &minus;0.98; river gauge &gt; 5 m).',
        coverage: 'High-Risk Basins',
        cadence: 'Event-Triggered (SPI &le; &minus;0.98 / Gauge &gt; 5 m)',
        tools: [
          { text: 'IFRC-Approved EAPs', url: 'https://www.anticipation-hub.org/early-action/early-action-protocols' },
          { text: 'Threshold Trigger Matrices', url: 'https://www.anticipation-hub.org/country/kenya' },
          { text: 'Pre-positioned Emergency Stocks', url: 'https://www.redcross.or.ke' }
        ],
        portalText: 'redcross.or.ke Early Actions &rarr;',
        portalUrl: 'https://www.redcross.or.ke'
      },
      {
        logo: '../../images/logos/icpac_emblem.png',
        badgeClass: 'badge-icpac',
        badgeText: 'WMO Regional Climate Centre',
        title: 'IGAD Climate Prediction &amp; Applications Centre (ICPAC)',
        subtitle: 'Regional Inter-Governmental Body &bull; Ngong, Nairobi',
        desc: 'Convenes the Greater Horn of Africa Climate Outlook Forum (GHACOF) consensus multi-model seasonal forecasts and maintains regional high-resolution hazard tracking platforms.',
        coverage: 'Greater Horn (11 States)',
        cadence: 'Tri-Annual (GHACOF) &amp; Weekly',
        tools: [
          { text: 'East Africa Hazards Watch', url: 'https://eahazardswatch.icpac.net/' },
          { text: 'GHACOF Consensus Bulletins', url: 'https://www.icpac.net/ghacof/' },
          { text: 'East Africa Drought Watch', url: 'https://droughtwatch.icpac.net/' }
        ],
        portalText: 'eahazardswatch.icpac.net &rarr;',
        portalUrl: 'https://eahazardswatch.icpac.net/'
      },
      {
        logo: '../../images/logos/fews_emblem.png',
        badgeClass: 'badge-kfssg',
        badgeText: 'Multi-Agency Coordination Body',
        title: 'Kenya Food Security Steering Group (KFSSG) / FEWS NET',
        subtitle: 'Multi-Agency Body led by NDMA &bull; Co-Chaired by WFP',
        desc: 'Coordinates the biannual Long Rains Assessment (LRA) and Short Rains Assessment (SRA) providing consensus Integrated Food Security Phase Classification (IPC) caseloads for response.',
        coverage: '23 ASAL &amp; Marginal Counties',
        cadence: 'Bi-Annual LRA / SRA (Feb / Aug)',
        tools: [
          { text: 'Biannual LRA / SRA Reports', url: 'https://www.ndma.go.ke/index.php/resource-center/category/2-long-rains-assessments' },
          { text: 'IPC Acute Classifications', url: 'https://www.ipcinfo.org/ipc-country-analysis/details-map/en/c/1156828/' },
          { text: 'FEWS NET Kenya Outlook', url: 'https://fews.net/east-africa/kenya' }
        ],
        portalText: 'fews.net/east-africa/kenya &rarr;',
        portalUrl: 'https://fews.net/east-africa/kenya'
      },
      {
        logo: '../../images/logos/ndoc_emblem.png',
        badgeClass: 'badge-ndoc',
        badgeText: 'National Coordination Centre',
        title: 'National Disaster Operations Centre (NDOC)',
        subtitle: 'Ministry of Interior &amp; National Administration &bull; 24/7 Operations',
        desc: 'The national focal point for disaster response coordination, civil protection asset deployment, and multi-agency humanitarian logistics across all 47 counties.',
        coverage: 'National (47 Counties)',
        cadence: '24/7 Continuous Monitoring',
        tools: [
          { text: 'National SitReps', url: 'https://interior.go.ke' },
          { text: 'Civil Protection Coordination', url: 'https://interior.go.ke' },
          { text: '24/7 Hotline: 0800 721 570', url: 'tel:0800721570', style: 'color: #dc2626; font-weight: 700;' }
        ],
        portalText: 'interior.go.ke Civil Protection &rarr;',
        portalUrl: 'https://interior.go.ke'
      }
    ];

    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    grid.style.gap = '1rem';
    grid.style.marginTop = '0.75rem';

    grid.innerHTML = cards.map(c => `
      <div class="approved-tool-card" style="padding: 0.95rem 1.15rem; display: flex; flex-direction: column; justify-content: space-between; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
        <div>
          <!-- Top Row: Logo + Badges + Titles -->
          <div style="display: flex; gap: 0.85rem; align-items: flex-start; margin-bottom: 0.5rem;">
            <div style="width: 52px; height: 52px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 3px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
              <img src="${c.logo}" alt="${c.title} logo" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
            <div style="flex: 1; min-width: 0;">
              <span class="tool-authority-badge ${c.badgeClass}" style="margin-bottom: 0.25rem; font-size: 0.68rem; padding: 2px 6px;">
                ${c.badgeText}
              </span>
              <h4 style="font-size: 0.90rem; font-weight: 800; color: #0f172a; margin: 0 0 2px; line-height: 1.3;">
                ${c.title}
              </h4>
              <div style="font-size: 0.74rem; color: #64748b; font-weight: 500; line-height: 1.35;">
                ${c.subtitle}
              </div>
            </div>
          </div>

          <!-- Description -->
          <p style="font-size: 0.79rem; color: #334155; line-height: 1.44; margin: 0 0 0.55rem;">
            ${c.desc}
          </p>

          <!-- Compact Unified Operational Metadata -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.45rem 0.65rem; font-size: 0.76rem; color: #475569; margin-bottom: 0.5rem; line-height: 1.45;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px;">
              <span><strong>Coverage:</strong> ${c.coverage}</span>
              <span style="color: #cbd5e1;">&bull;</span>
              <span><strong>Cadence:</strong> ${c.cadence}</span>
            </div>
            <div style="font-size: 0.75rem;">
              <strong style="color: #0f172a;">Operational Tools:</strong> 
              ${c.tools.map((t, idx) => `
                <a href="${t.url}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline; font-weight: 600; ${t.style || ''}">${t.text}</a>${idx < c.tools.length - 1 ? ' &bull; ' : ''}
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Footer Link -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 0.45rem; margin-top: 0.25rem;">
          <a href="${c.portalUrl}" target="_blank" rel="noopener" class="tool-action-link" style="font-size: 0.76rem; font-weight: 700; color: #0f766e; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            <span>${c.portalText}</span>
          </a>
        </div>
      </div>
    `).join('');
  });

  const card = await page.$('.enso-figure-card:has(#table23-matrix-wrap, .approved-tools-grid)');
  if (card) {
    await card.screenshot({ path: `${ARTIFACT_DIR}/table23_compact_logos.png` });
    console.log('Saved table23_compact_logos.png');
  }

  const fullPane = await page.$('#subtab-outlook-24');
  if (fullPane) {
    await fullPane.screenshot({ path: `${ARTIFACT_DIR}/subtab24_complete_with_compact_cards.png` });
    console.log('Saved subtab24_complete_with_compact_cards.png');
  }

  await browser.close();
})();
