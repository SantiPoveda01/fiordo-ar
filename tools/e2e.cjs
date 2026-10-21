// Prueba de extremo a extremo con cámara simulada (video del marcador).
// Uso: node tools/e2e.cjs [url] [outdir]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const url = process.argv[2] || 'http://localhost:8765/';
const out = process.argv[3] || '/tmp';
const fake = process.env.FAKE_VIDEO;

(async () => {
	const browser = await chromium.launch({
		executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
		args: [
			'--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
			'--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
			`--use-file-for-fake-video-capture=${fake}`,
			'--autoplay-policy=no-user-gesture-required',
		],
	});
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['camera'] });
	const page = await ctx.newPage();
	const errors = [], logs = [];
	page.on('console', m => { const t = `[${m.type()}] ${m.text()}`; logs.push(t); if (m.type() === 'error') errors.push(t); });
	page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
	page.on('requestfailed', r => errors.push('[requestfailed] ' + r.url() + ' ' + r.failure()?.errorText));
	page.on('response', r => { if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url()}`); });

	const t0 = Date.now();
	const step = (s) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s  ${s}`);

	await page.goto(url);
	await page.waitForFunction(() => document.getElementById('progress-label').textContent.includes('Listo'), null, { timeout: 120000 });
	step('precarga: ' + await page.textContent('#progress-label'));
	await page.screenshot({ path: `${out}/01-inicio.png` });

	await page.click('#start-button');
	await page.waitForFunction(() => document.getElementById('hud').classList.contains('is-active') || !document.getElementById('error').hidden, null, { timeout: 120000 });
	if (!(await page.isHidden('#error'))) { step('ERROR: ' + await page.textContent('#error-text')); }
	step('HUD activo');

	await page.waitForFunction(() => window.fiordo.targetVisible === true, null, { timeout: 120000, polling: 500 });
	step('marcador detectado');
	await page.waitForTimeout(2500);
	await page.screenshot({ path: `${out}/02-detectado.png` });

	const audio = await page.evaluate(() => ({ state: window.fiordo && document.querySelector('canvas') ? 'canvas-ok' : 'no-canvas' }));
	step('canvas: ' + audio.state);

	for (const [i, key] of ['origen', 'formula', 'ritual'].entries()) {
		await page.click(`.dock-btn[data-dialog="${key}"]`);
		await page.waitForTimeout(1200);
		const title = await page.textContent('#dialog-title');
		const open = await page.evaluate(() => document.getElementById('dialog').classList.contains('is-open'));
		step(`diálogo ${key}: abierto=${open} título="${title}"`);
		await page.screenshot({ path: `${out}/0${3 + i}-dialogo-${key}.png` });
		await page.click('#dialog-close');
		await page.waitForTimeout(1500);
	}
	const closed = await page.evaluate(() => document.getElementById('dialog').hidden);
	step('diálogo cerrado: ' + closed);

	const snd = await page.evaluate(async () => {
		const m = await import('/js/audio.js');
		return { ctx: m.sounds.ctx?.state, buffers: Object.keys(m.sounds.buffers), ambient: !!m.sounds.ambient };
	});
	step('audio: ' + JSON.stringify(snd));

	console.log('\nERRORES:', errors.length ? '\n' + errors.join('\n') : 'ninguno');
	console.log('LOGS relevantes:\n' + logs.filter(l => /FIORDO|error|warn/i.test(l)).slice(0, 20).join('\n'));
	await browser.close();
})().catch(e => { console.error('FALLO:', e.message); process.exit(1); });
