const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +(process.env.W||600), height: +(process.env.H||800) } });
  p.on('pageerror', e => console.log('pageerror', e.message)); p.on('console', m => m.type()==='error' && console.log(m.text()));
  await p.goto(process.argv[2]); await p.waitForFunction(() => window.__done, null, { timeout: 120000 });
  await p.screenshot({ path: process.argv[3] }); await b.close();
})();
