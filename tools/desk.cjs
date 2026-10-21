const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
  await p.screenshot({ path: process.argv[2] }); await b.close();
})();
