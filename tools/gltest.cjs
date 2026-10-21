const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  for (const args of [['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'], ['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']]) {
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
    const p = await b.newPage();
    console.log(args.join(' '), await p.evaluate(() => { const c=document.createElement('canvas'); const g=c.getContext('webgl2')||c.getContext('webgl'); return g ? g.getParameter(g.VERSION) : 'NO GL'; }));
    await b.close();
  }
})();
