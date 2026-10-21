// Filtro facial ICE (diapositiva 6): escarcha de cristales de hielo en pómulos y sienes,
// sin cubrir el rostro, con un leve brillo azulado en la piel.
import * as THREE from 'three';
import { drawIceCrystal } from './textures.js';

// Índices de landmarks del modelo facial (MediaPipe Face Mesh, 468 puntos)
const ZONES = [
	{ ids: [50, 101, 118, 117, 123, 187], r: 0.085, n: 9 },   // pómulo derecho
	{ ids: [280, 330, 347, 346, 352, 411], r: 0.085, n: 9 },  // pómulo izquierdo
	{ ids: [127, 139, 71, 21], r: 0.05, n: 5 },               // sien derecha
	{ ids: [356, 368, 301, 251], r: 0.05, n: 5 },             // sien izquierda
];

export function createFaceFilter(mindar) {
	const faceMesh = mindar.addFaceMesh();
	const uv = faceMesh.geometry.attributes.uv;
	const SIZE = 1024;

	// Centros de zona en espacio UV (la textura usa flipY, así que v → 1 - v en el canvas)
	const zones = ZONES.map(z => {
		let u = 0, v = 0;
		for (const id of z.ids) { u += uv.getX(id); v += uv.getY(id); }
		u /= z.ids.length; v /= z.ids.length;
		return { x: u * SIZE, y: (1 - v) * SIZE, r: z.r * SIZE, n: z.n };
	});

	// Capa estática: tinte azulado + cristales
	const base = document.createElement('canvas');
	base.width = base.height = SIZE;
	const b = base.getContext('2d');
	b.fillStyle = 'rgba(143,184,201,0.10)';
	b.fillRect(0, 0, SIZE, SIZE);

	const rnd = mulberry(42);
	const sparkles = [];
	for (const z of zones) {
		const g = b.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r * 1.25);
		g.addColorStop(0, 'rgba(205,232,243,0.42)');
		g.addColorStop(0.6, 'rgba(143,184,201,0.22)');
		g.addColorStop(1, 'rgba(143,184,201,0)');
		b.fillStyle = g;
		b.beginPath(); b.arc(z.x, z.y, z.r * 1.25, 0, Math.PI * 2); b.fill();
		for (let i = 0; i < z.n; i++) {
			const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * z.r;
			const cr = z.r * (0.18 + rnd() * 0.3);
			drawIceCrystal(b, z.x + Math.cos(a) * d, z.y + Math.sin(a) * d * 0.8, cr, 0.55 + rnd() * 0.45, rnd() * Math.PI);
		}
		for (let i = 0; i < 26; i++) {
			const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * z.r * 1.15;
			sparkles.push({ x: z.x + Math.cos(a) * d, y: z.y + Math.sin(a) * d * 0.8, s: 2 + rnd() * 5, p: rnd() * 6.28, f: 1.5 + rnd() * 3 });
		}
	}

	// Capa final (base + destellos animados)
	const out = document.createElement('canvas');
	out.width = out.height = SIZE;
	const o = out.getContext('2d');
	const tex = new THREE.CanvasTexture(out);
	tex.colorSpace = THREE.SRGBColorSpace;

	faceMesh.material = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
	mindar.scene.add(faceMesh);

	let acc = 1;
	function update(dt, time) {
		acc += dt;
		if (acc < 0.08) return;
		acc = 0;
		o.clearRect(0, 0, SIZE, SIZE);
		o.drawImage(base, 0, 0);
		for (const s of sparkles) {
			const k = Math.max(0, Math.sin(time * s.f + s.p));
			if (k < 0.35) continue;
			const r = s.s * k;
			o.fillStyle = `rgba(255,255,255,${0.9 * k})`;
			o.beginPath(); o.arc(s.x, s.y, r * 0.45, 0, Math.PI * 2); o.fill();
			o.fillRect(s.x - r * 2, s.y - 0.7, r * 4, 1.4);
			o.fillRect(s.x - 0.7, s.y - r * 2, 1.4, r * 4);
		}
		tex.needsUpdate = true;
	}

	return { faceMesh, update };
}

function mulberry(a) {
	return function () {
		a |= 0; a = a + 0x6D2B79F5 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
