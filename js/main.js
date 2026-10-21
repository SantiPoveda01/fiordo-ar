// FIORDO — experiencia de realidad aumentada
// Seguimiento de imagen (MindAR) + filtro facial ICE + 3 diálogos de producto + sonido.
import * as THREE from 'three';
import { sounds } from './audio.js';
import { DIALOGS, DIALOG_ORDER } from './content.js';
import { loadBrandFonts } from './textures.js';

const MARKER_SRC = 'assets/marker/targets.mind';
const START_TIMEOUT = 30000;

const $ = (id) => document.getElementById(id);
const ui = {
	splash: $('splash'), hud: $('hud'), container: $('ar-container'),
	start: $('start-button'), face: $('face-button'),
	progress: $('progress'), fill: $('progress-fill'), label: $('progress-label'),
	scanHint: $('scan-hint'), scanText: $('scan-text'),
	modeLabel: $('mode-label'), modeToggle: $('mode-toggle'), soundToggle: $('sound-toggle'),
	dialog: $('dialog'), backdrop: $('dialog-backdrop'), dKicker: $('dialog-kicker'), dTitle: $('dialog-title'),
	dBody: $('dialog-body'), dCount: $('dialog-count'), dClose: $('dialog-close'),
	toast: $('toast'), error: $('error'), errorText: $('error-text'), errorRetry: $('error-retry'),
};

const app = {
	mode: null,          // 'image' | 'face'
	mindar: null,
	product: null,
	face: null,
	clock: new THREE.Clock(),
	targetVisible: false,
	lastFound: 0,
	loaded: null,        // promesa de precarga
	libs: {},
	starting: false,
	pendingEffect: null,
};
window.fiordo = app; // útil para depurar desde la consola

// ------------------------------------------------------------------
// Progreso real de carga
// ------------------------------------------------------------------
function setProgress(pct, text, isError = false) {
	ui.fill.style.width = `${Math.round(pct)}%`;
	ui.label.textContent = text;
	ui.progress.classList.toggle('is-error', isError);
}

async function fetchWithProgress(url, onProgress) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`No se encontró ${url} (HTTP ${res.status})`);
	const total = +res.headers.get('content-length') || 0;
	if (!res.body || !total) { const b = await res.arrayBuffer(); onProgress(1); return b; }
	const reader = res.body.getReader();
	const chunks = []; let got = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value); got += value.length;
		onProgress(Math.min(1, got / total));
	}
	const out = new Uint8Array(got); let o = 0;
	for (const c of chunks) { out.set(c, o); o += c.length; }
	return out.buffer;
}

function preload() {
	if (app.loaded) return app.loaded;
	app.loaded = (async () => {
		setProgress(4, 'Cargando tipografías…');
		await loadBrandFonts();

		setProgress(12, 'Cargando motor de realidad aumentada…');
		app.libs.image = await import('./lib/mindar/mindar-image-three.prod.js');
		setProgress(45, 'Cargando el producto 3D…');
		app.libs.product = await import('./product.js');

		setProgress(50, 'Descargando imagen de seguimiento…');
		const mind = await fetchWithProgress(MARKER_SRC, (k) => setProgress(50 + k * 25, 'Descargando imagen de seguimiento…'));
		app.markerUrl = URL.createObjectURL(new Blob([mind]));

		setProgress(76, 'Cargando sonidos…');
		await sounds.preload((k) => setProgress(76 + k * 20, 'Cargando sonidos…'));

		setProgress(100, 'Listo. Pulsa iniciar');
	})().catch((e) => {
		app.loaded = null;
		console.error('[FIORDO] Error de carga:', e);
		setProgress(100, 'Error al cargar. Pulsa para reintentar', true);
		throw e;
	});
	return app.loaded;
}

// ------------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------------
function withTimeout(promise, ms, msg) {
	let t;
	return Promise.race([
		promise.finally(() => clearTimeout(t)),
		new Promise((_, ko) => { t = setTimeout(() => ko(new Error(msg)), ms); }),
	]);
}

async function checkCamera() {
	if (!window.isSecureContext) throw new Error('La cámara solo funciona en una conexión segura (https).');
	if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador no permite usar la cámara.');
}

function cameraErrorMessage(e) {
	const name = e?.name || '';
	if (name === 'NotAllowedError') return 'Necesitamos permiso para usar la cámara. Habilítalo en la configuración del navegador y vuelve a intentarlo.';
	if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No encontramos una cámara disponible en este dispositivo.';
	if (name === 'NotReadableError') return 'La cámara está siendo usada por otra aplicación. Ciérrala y vuelve a intentarlo.';
	return e?.message || 'Revisa que la cámara esté disponible y que hayas permitido el acceso.';
}

// MindAR no informa por qué falló getUserMedia: probamos el permiso antes para dar un mensaje claro.
async function probeCamera(facingMode) {
	const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
	s.getTracks().forEach(t => t.stop());
}

let toastTimer;
function toast(text, ms = 2200) {
	ui.toast.textContent = text;
	ui.toast.classList.add('is-visible');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => ui.toast.classList.remove('is-visible'), ms);
}

function showError(text) {
	ui.errorText.textContent = text;
	ui.error.hidden = false;
}

// ------------------------------------------------------------------
// Modos AR
// ------------------------------------------------------------------
function stopAR() {
	const m = app.mindar;
	if (!m) return;
	try { m.renderer.setAnimationLoop(null); } catch {}
	try { m.stop(); } catch {}
	try { m.renderer.dispose(); } catch {}
	ui.container.replaceChildren();
	app.mindar = null;
	app.product = null;
	app.face = null;
	app.targetVisible = false;
	sounds.ambientOff();
}

async function startImageMode() {
	const { MindARThree } = app.libs.image;
	const mindar = new MindARThree({
		container: ui.container,
		imageTargetSrc: app.markerUrl,
		uiLoading: 'no', uiScanning: 'no', uiError: 'no',
		filterMinCF: 0.0005, filterBeta: 0.01,
		warmupTolerance: 3, missTolerance: 6,
	});
	app.mindar = mindar;
	const { renderer, scene, camera } = mindar;
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x000000, 0);

	const product = app.libs.product.createProduct(renderer, scene);
	app.product = product;
	const anchor = mindar.addAnchor(0);
	anchor.group.add(product.root);

	anchor.onTargetFound = () => {
		app.targetVisible = true;
		ui.scanHint.classList.add('is-hidden');
		const now = performance.now();
		if (now - app.lastFound > 2500) {
			product.show();
			sounds.play('deteccion');
		}
		app.lastFound = now;
		sounds.ambientOn();
		if (app.pendingEffect) { runEffect(app.pendingEffect); app.pendingEffect = null; }
	};
	anchor.onTargetLost = () => {
		app.targetVisible = false;
		app.lastFound = performance.now();
		ui.scanHint.classList.remove('is-hidden');
		sounds.ambientOff();
	};

	await withTimeout(mindar.start(), START_TIMEOUT, 'La cámara tardó demasiado en iniciar.');

	app.clock.getDelta();
	renderer.setAnimationLoop(() => {
		const dt = Math.min(app.clock.getDelta(), 0.1);
		const t = app.clock.elapsedTime;
		product.update(dt, t);
		renderer.render(scene, camera);
	});

	// Tocar el frasco lo hace girar
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	renderer.domElement.addEventListener('pointerdown', (ev) => {
		if (!app.targetVisible) return;
		const r = renderer.domElement.getBoundingClientRect();
		ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
		ray.setFromCamera(ndc, camera);
		if (ray.intersectObjects(product.pickables, false).length) {
			product.spin(1.4);
			sounds.play('deteccion', { volume: 0.5, rate: 1.25 });
		}
	});

	ui.modeLabel.textContent = 'Empaque AR';
	ui.scanText.textContent = 'Apunta la cámara a la imagen FIORDO';
}

async function startFaceMode() {
	if (!app.libs.face) {
		toast('Cargando filtro ICE…', 6000);
		app.libs.face = await import('./lib/mindar/mindar-face-three.prod.js');
		app.libs.faceFilter = await import('./face.js');
	}
	const { MindARThree } = app.libs.face;
	const mindar = new MindARThree({ container: ui.container, uiLoading: 'no', uiScanning: 'no', uiError: 'no', filterMinCF: 0.0005, filterBeta: 10 });
	app.mindar = mindar;
	const { renderer, scene, camera } = mindar;
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	const face = app.libs.faceFilter.createFaceFilter(mindar);
	app.face = face;

	await withTimeout(mindar.start(), START_TIMEOUT * 1.5, 'El filtro facial tardó demasiado en iniciar. Revisa tu conexión.');

	app.clock.getDelta();
	renderer.setAnimationLoop(() => {
		const dt = Math.min(app.clock.getDelta(), 0.1);
		face.update(dt, app.clock.elapsedTime);
		renderer.render(scene, camera);
	});
	ui.modeLabel.textContent = 'Filtro ICE';
	toast('Filtro ICE activo');
	sounds.ambientOn();
}

async function enter(mode) {
	if (app.starting) return;
	app.starting = true;
	ui.start.disabled = ui.face.disabled = true;
	ui.error.hidden = true;
	try {
		await sounds.unlock().catch(() => {});      // dentro del gesto del usuario
		await preload();
		await checkCamera();
		setProgress(100, 'Solicitando acceso a la cámara…');
		await probeCamera(mode === 'face' ? 'user' : 'environment');

		stopAR();
		document.body.classList.toggle('mode-face', mode === 'face');
		ui.modeToggle.classList.toggle('is-on', mode === 'face');
		ui.modeToggle.setAttribute('aria-label', mode === 'face' ? 'Volver al empaque AR' : 'Cambiar a filtro facial ICE');
		app.mode = mode;
		setProgress(100, mode === 'face' ? 'Iniciando filtro ICE…' : 'Iniciando cámara…');

		if (mode === 'face') await startFaceMode();
		else await startImageMode();

		ui.splash.classList.remove('is-active');
		ui.hud.classList.add('is-active');
		ui.scanHint.classList.remove('is-hidden');
		sounds.play('clic');
	} catch (e) {
		console.error('[FIORDO] No se pudo iniciar:', e);
		stopAR();
		const msg = cameraErrorMessage(e);
		if (ui.splash.classList.contains('is-active')) setProgress(100, 'No se pudo iniciar', true);
		showError(msg);
	} finally {
		app.starting = false;
		ui.start.disabled = ui.face.disabled = false;
	}
}

// ------------------------------------------------------------------
// Diálogos
// ------------------------------------------------------------------
let openKey = null;

function runEffect(effect) {
	const p = app.product;
	if (!p) return;
	if (effect === 'mist') { p.mist(); sounds.play('bruma'); }
	if (effect === 'shards') p.shards();
	if (effect === 'spin') p.spin();
}

function openDialog(key) {
	const d = DIALOGS[key];
	if (!d) return;
	openKey = key;
	ui.dKicker.textContent = d.kicker;
	ui.dTitle.textContent = d.title;
	ui.dBody.innerHTML = d.html;
	ui.dCount.textContent = `${String(DIALOG_ORDER.indexOf(key) + 1).padStart(2, '0')} / 03`;
	ui.dialog.scrollTop = 0;
	ui.backdrop.hidden = false; ui.dialog.hidden = false;
	requestAnimationFrame(() => { ui.backdrop.classList.add('is-open'); ui.dialog.classList.add('is-open'); });
	document.querySelectorAll('.dock-btn').forEach(b => b.classList.toggle('is-active', b.dataset.dialog === key));
	sounds.play('abrir');
	if (app.mode === 'image') {
		if (app.targetVisible) runEffect(d.effect); else app.pendingEffect = d.effect;
	}
	ui.dClose.focus({ preventScroll: true });
}

function closeDialog() {
	if (!openKey) return;
	openKey = null;
	ui.backdrop.classList.remove('is-open'); ui.dialog.classList.remove('is-open');
	document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('is-active'));
	sounds.play('cerrar');
	setTimeout(() => { if (!openKey) { ui.backdrop.hidden = true; ui.dialog.hidden = true; } }, 450);
}

// ------------------------------------------------------------------
// Eventos
// ------------------------------------------------------------------
ui.start.addEventListener('click', () => enter('image'));
ui.face.addEventListener('click', () => enter('face'));
ui.errorRetry.addEventListener('click', () => { ui.error.hidden = true; enter(app.mode || 'image'); });

ui.modeToggle.addEventListener('click', () => {
	sounds.play('clic');
	closeDialog();
	enter(app.mode === 'face' ? 'image' : 'face');
});

ui.soundToggle.addEventListener('click', () => {
	const muted = !sounds.muted;
	sounds.setMuted(muted);
	ui.soundToggle.setAttribute('aria-pressed', String(muted));
	ui.soundToggle.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
	toast(muted ? 'Sonido desactivado' : 'Sonido activado', 1400);
});

document.querySelectorAll('.dock-btn').forEach((b) => b.addEventListener('click', () => {
	sounds.play('clic');
	if (openKey === b.dataset.dialog) closeDialog(); else openDialog(b.dataset.dialog);
}));
ui.dClose.addEventListener('click', closeDialog);
ui.backdrop.addEventListener('click', closeDialog);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDialog(); });

document.addEventListener('visibilitychange', () => { document.hidden ? sounds.suspend() : sounds.resume(); });

// Precarga automática al abrir la página
preload().catch(() => {});
