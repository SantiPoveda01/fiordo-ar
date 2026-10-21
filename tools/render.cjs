const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1020, height: 1200 }, deviceScaleFactor: 1 });
  await p.goto('file://' + __dirname + '/marker.html');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.locator('#p').screenshot({ path: __dirname + '/../assets/marker/fiordo-target.png' });
  await b.close();
})();
