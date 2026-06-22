const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1280, height: 720 });

  page.on('console', msg => {
    console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[PAGE ERROR] ${err.toString()}`);
  });

  console.log('Navigating to http://localhost:5174/audit.html...');
  await page.goto('http://localhost:5174/audit.html');
  await page.waitForTimeout(4000);

  // Get layout details
  const layout = await page.evaluate(() => {
    const getBox = id => {
      const el = document.querySelector(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        id,
        visible: el.style.display !== 'none',
        offsetWidth: el.offsetWidth,
        offsetHeight: el.offsetHeight,
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      };
    };
    return {
      screen: getBox('#audit-screen'),
      header: getBox('.game-header'),
      body: getBox('.game-body'),
      photoPanel: getBox('.photo-panel'),
      mapPanel: getBox('.map-panel'),
      pano: getBox('#audit-pano'),
      map: getBox('#audit-map'),
      footer: getBox('.map-footer'),
    };
  });

  console.log('Layout boxes:', JSON.stringify(layout, null, 2));

  // Save screenshot to artifacts directory
  const screenshotPath = '/Users/ryan/.gemini/antigravity/brain/1c9fa9e4-dac5-4b78-8453-d13528bd74ec/media__audit_layout.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();
})();
