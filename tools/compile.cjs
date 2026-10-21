const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage();
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => { console.log('pageerror:', e.message); process.exit(1); });
  await p.goto('http://localhost:8765/tools/compile.html');
  await p.waitForFunction(() => window.__done, null, { timeout: 600000, polling: 2000 });
  console.log(JSON.stringify(await p.evaluate(() => window.__features)));
  fs.writeFileSync(__dirname + '/../assets/marker/targets.mind', Buffer.from(await p.evaluate(() => window.__b64), 'base64'));
  await b.close();
})();
