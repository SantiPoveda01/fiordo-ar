// Texturas generadas en canvas con la tipografía y la paleta de FIORDO.
import * as THREE from 'three';

export const PALETTE = {
	fjord: '#1B2A35',
	ice: '#E8EEF1',
	glacier: '#8FB8C9',
	slate: '#5E6E75',
	abyss: '#0D1418',
	mist: '#B7BFC3',
};

export async function loadBrandFonts() {
	await Promise.all([
		document.fonts.load('700 64px Oswald'),
		document.fonts.load('500 32px Oswald'),
		document.fonts.load('400 24px Inter'),
	]).catch(() => {});
}

function canvas(w, h) {
	const c = document.createElement('canvas');
	c.width = w; c.height = h;
	return [c, c.getContext('2d')];
}

function tracked(ctx, text, x, y, spacing) {
	// Dibuja texto centrado con espaciado entre letras.
	const chars = [...text];
	const widths = chars.map(ch => ctx.measureText(ch).width);
	const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
	let cx = x - total / 2;
	ctx.textAlign = 'left';
	chars.forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += widths[i] + spacing; });
}

// Símbolo: horizonte + montaña + reflejo del agua
export function drawMark(ctx, cx, cy, w, { line = '#FFFFFF', water = PALETTE.glacier, lw = null } = {}) {
	const s = w / 400;
	ctx.save();
	ctx.translate(cx - w / 2, cy - 55 * s);
	ctx.lineJoin = 'miter';
	ctx.lineCap = 'square';
	ctx.strokeStyle = line;
	ctx.lineWidth = lw ?? 7 * s;
	ctx.beginPath();
	ctx.moveTo(0, 40 * s); ctx.lineTo(128 * s, 40 * s); ctx.lineTo(162 * s, 6 * s); ctx.lineTo(200 * s, 58 * s);
	ctx.lineTo(238 * s, 6 * s); ctx.lineTo(272 * s, 40 * s); ctx.lineTo(400 * s, 40 * s);
	ctx.stroke();
	ctx.strokeStyle = water;
	ctx.lineCap = 'round';
	ctx.lineWidth = (lw ?? 7 * s) * 0.7;
	for (const [a, b, y] of [[70, 160, 64], [240, 330, 64], [110, 180, 82], [220, 290, 82], [160, 240, 100]]) {
		ctx.beginPath(); ctx.moveTo(a * s, y * s); ctx.lineTo(b * s, y * s); ctx.stroke();
	}
	ctx.restore();
}

// Etiqueta rectangular centrada del frasco (diapositiva 4)
export function labelTexture() {
	const [c, ctx] = canvas(1024, 600);
	ctx.clearRect(0, 0, 1024, 600);
	ctx.fillStyle = 'rgba(13,20,24,.28)';
	ctx.fillRect(14, 14, 996, 572);
	ctx.strokeStyle = 'rgba(232,238,241,.7)';
	ctx.lineWidth = 5;
	ctx.strokeRect(14, 14, 996, 572);
	ctx.strokeStyle = 'rgba(143,184,201,.55)';
	ctx.lineWidth = 2;
	ctx.strokeRect(34, 34, 956, 532);
	ctx.fillStyle = '#8FB8C9';
	ctx.font = '500 40px Oswald';
	tracked(ctx, 'FRESCURA DEL NORTE', 512, 118, 14);
	ctx.fillStyle = '#FFFFFF';
	ctx.font = '700 220px Oswald';
	tracked(ctx, 'FIORDO', 512, 340, 10);
	drawMark(ctx, 512, 410, 440);
	ctx.font = '400 34px Inter';
	ctx.fillStyle = 'rgba(232,238,241,.9)';
	tracked(ctx, 'LOCIÓN PARA HOMBRE', 512, 530, 10);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}

// Caja del empaque: cara frontal con logotipo
export function boxFrontTexture() {
	const [c, ctx] = canvas(512, 768);
	const g = ctx.createLinearGradient(0, 0, 0, 768);
	g.addColorStop(0, '#22343F'); g.addColorStop(1, '#141F27');
	ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 768);
	ctx.strokeStyle = 'rgba(143,184,201,.6)'; ctx.lineWidth = 3; ctx.strokeRect(26, 26, 460, 716);
	ctx.strokeStyle = 'rgba(232,238,241,.25)'; ctx.lineWidth = 1.5; ctx.strokeRect(40, 40, 432, 688);
	ctx.fillStyle = PALETTE.glacier;
	ctx.font = '500 22px Oswald';
	tracked(ctx, 'FRESCURA DEL NORTE', 256, 170, 8);
	ctx.fillStyle = '#FFFFFF';
	ctx.font = '700 118px Oswald';
	tracked(ctx, 'FIORDO', 256, 330, 4);
	drawMark(ctx, 256, 410, 280);
	ctx.fillStyle = 'rgba(232,238,241,.8)';
	ctx.font = '400 18px Inter';
	tracked(ctx, 'LOCIÓN FACIAL PARA HOMBRE', 256, 610, 5);
	ctx.fillStyle = PALETTE.glacier;
	tracked(ctx, 'AGUA TERMAL · MENTOL', 256, 650, 5);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 4;
	return t;
}

export function boxSideTexture() {
	const [c, ctx] = canvas(256, 768);
	const g = ctx.createLinearGradient(0, 0, 0, 768);
	g.addColorStop(0, '#1E2F3A'); g.addColorStop(1, '#111A20');
	ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 768);
	ctx.save();
	ctx.translate(128, 384); ctx.rotate(-Math.PI / 2);
	ctx.fillStyle = 'rgba(232,238,241,.85)';
	ctx.font = '600 40px Oswald';
	tracked(ctx, 'FIORDO', 0, 14, 14);
	ctx.restore();
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

// Punto suave para partículas de bruma
export function softDotTexture() {
	const [c, ctx] = canvas(64, 64);
	const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	g.addColorStop(0, 'rgba(255,255,255,1)');
	g.addColorStop(0.35, 'rgba(232,242,247,.55)');
	g.addColorStop(1, 'rgba(143,184,201,0)');
	ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
	return new THREE.CanvasTexture(c);
}

// Halo radial para el pedestal
export function haloTexture() {
	const [c, ctx] = canvas(256, 256);
	const g = ctx.createRadialGradient(128, 128, 30, 128, 128, 128);
	g.addColorStop(0, 'rgba(143,184,201,.0)');
	g.addColorStop(0.62, 'rgba(143,184,201,.55)');
	g.addColorStop(0.7, 'rgba(232,238,241,.9)');
	g.addColorStop(0.78, 'rgba(143,184,201,.35)');
	g.addColorStop(1, 'rgba(143,184,201,0)');
	ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
	return new THREE.CanvasTexture(c);
}

// Cristal de hielo dendrítico (hexagonal) — usado en el filtro facial
export function drawIceCrystal(ctx, x, y, r, alpha = 1, rot = 0) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rot);
	ctx.strokeStyle = `rgba(240,248,252,${0.85 * alpha})`;
	ctx.shadowColor = `rgba(143,184,201,${alpha})`;
	ctx.shadowBlur = r * 0.25;
	ctx.lineCap = 'round';
	for (let k = 0; k < 6; k++) {
		ctx.rotate(Math.PI / 3);
		ctx.lineWidth = Math.max(1, r * 0.06);
		ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r); ctx.stroke();
		ctx.lineWidth = Math.max(1, r * 0.035);
		for (const f of [0.35, 0.6, 0.82]) {
			const b = r * (0.42 - f * 0.3);
			ctx.beginPath();
			ctx.moveTo(-b, -r * f - b * 0.8); ctx.lineTo(0, -r * f); ctx.lineTo(b, -r * f - b * 0.8);
			ctx.stroke();
		}
	}
	ctx.restore();
}
