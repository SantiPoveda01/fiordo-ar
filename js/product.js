// Contenido 3D sobre el marcador: frasco FIORDO, caja del empaque, cristales de hielo y bruma.
// Unidades: 1 = ancho de la imagen de seguimiento. Origen = centro del marcador, +Y arriba, +Z hacia la cámara.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { labelTexture, boxFrontTexture, boxSideTexture, softDotTexture, haloTexture } from './textures.js';

const easeOutBack = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const easeInOut = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// Perfil del frasco (radio, altura): cuerpo redondeado, hombros suaves y cuello corto.
const PROFILE = [
	[0.000, 0.000], [0.150, 0.000], [0.182, 0.008], [0.198, 0.030], [0.205, 0.070],
	[0.206, 0.330], [0.200, 0.400], [0.185, 0.455], [0.160, 0.500], [0.125, 0.535],
	[0.090, 0.556], [0.068, 0.566], [0.062, 0.580], [0.062, 0.620],
];

function bottleGradientMaterial() {
	// Vidrio en degradado: azul profundo arriba → transparente abajo (diapositiva 4).
	return new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		uniforms: {
			topColor: { value: new THREE.Color('#08141C') },
			midColor: { value: new THREE.Color('#1A3444') },
			bottomColor: { value: new THREE.Color('#CFE3EC') },
			rimColor: { value: new THREE.Color('#E8F3F8') },
			height: { value: 0.62 },
			opacity: { value: 1 },
		},
		vertexShader: /* glsl */`
			varying float vH;
			varying vec3 vN;
			varying vec3 vV;
			uniform float height;
			void main() {
				vH = position.y / height;
				vec4 mv = modelViewMatrix * vec4(position, 1.0);
				vN = normalize(normalMatrix * normal);
				vV = normalize(-mv.xyz);
				gl_Position = projectionMatrix * mv;
			}`,
		fragmentShader: /* glsl */`
			varying float vH;
			varying vec3 vN;
			varying vec3 vV;
			uniform vec3 topColor, midColor, bottomColor, rimColor;
			uniform float opacity;
			void main() {
				float h = clamp(vH, 0.0, 1.0);
				vec3 col = mix(bottomColor, midColor, smoothstep(0.0, 0.34, h));
				col = mix(col, topColor, smoothstep(0.26, 0.7, h));
				float a = mix(0.22, 0.97, smoothstep(0.02, 0.6, h));
				float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
				col = mix(col, rimColor, fres * 0.3);
				// reflejos verticales de estudio sobre el vidrio
				float nx = normalize(vN).x;
				float spec = smoothstep(0.42, 0.5, nx) * (1.0 - smoothstep(0.5, 0.62, nx)) + 0.6 * smoothstep(-0.74, -0.7, nx) * (1.0 - smoothstep(-0.7, -0.62, nx));
				col += rimColor * spec * 0.55;
				a = max(a, spec * 0.6);
				a = clamp(a + fres * 0.25, 0.0, 1.0);
				gl_FragColor = vec4(col, a * opacity);
				#include <colorspace_fragment>
			}`,
	});
}

export function createProduct(renderer, scene) {

	// Iluminación de estudio fría + reflejos (acero cepillado, vidrio).
	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
	pmrem.dispose();
	const hemi = new THREE.HemisphereLight(0xE8F3F8, 0x1B2A35, 0.9);
	const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(0.6, 1.2, 1.4);
	const rim = new THREE.DirectionalLight(0x8FB8C9, 1.6); rim.position.set(-1.2, 0.6, -0.8);
	scene.add(hemi, key, rim);

	const root = new THREE.Group();     // va dentro del anchor de MindAR
	root.name = 'FiordoProduct';
	const stage = new THREE.Group();    // escala de entrada
	stage.position.set(0, -0.42, 0.2);
	const SCALE = 0.82;
	root.add(stage);

	// ---------- Frasco ----------
	const bottle = new THREE.Group();
	bottle.name = 'Bottle';
	stage.add(bottle);

	const pts = PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
	const bodyGeo = new THREE.LatheGeometry(pts, 96);

	const inner = new THREE.Mesh(new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(Math.max(0, r - 0.012), y)), 96), bottleGradientMaterial());
	inner.renderOrder = 1;
	inner.name = 'inner';
	bottle.add(inner);

	const glass = new THREE.Mesh(bodyGeo, new THREE.MeshPhysicalMaterial({
		color: 0xDDEEF5, roughness: 0.04, metalness: 0,
		transparent: true, opacity: 0.08, envMapIntensity: 0.7, depthWrite: false,
	}));
	glass.renderOrder = 2;
	glass.name = 'glass';
	bottle.add(glass);

	// Base gruesa de vidrio
	const base = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.03, 64), new THREE.MeshPhysicalMaterial({
		color: 0xCFE3EC, roughness: 0.1, transparent: true, opacity: 0.45, envMapIntensity: 1.2, depthWrite: false,
	}));
	base.position.y = 0.015;
	base.renderOrder = 2;
	bottle.add(base);

	// Etiqueta rectangular centrada
	const label = new THREE.Mesh(
		new THREE.CylinderGeometry(0.2085, 0.2085, 0.235, 64, 1, true, -0.98, 1.96),
		new THREE.MeshBasicMaterial({ map: labelTexture(), transparent: true, depthWrite: false, side: THREE.FrontSide })
	);
	label.position.y = 0.205;
	label.renderOrder = 3;
	bottle.add(label);

	// Acero cepillado: cuello + tapa esférica
	const steel = new THREE.MeshStandardMaterial({ color: 0xC4CBD0, metalness: 1, roughness: 0.32, envMapIntensity: 1.3 });
	const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.078, 0.05, 48), steel);
	collar.position.y = 0.64;
	bottle.add(collar);
	const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.006, 12, 64), steel);
	ring.rotation.x = Math.PI / 2; ring.position.y = 0.615;
	bottle.add(ring);
	const cap = new THREE.Mesh(new THREE.SphereGeometry(0.112, 64, 48), steel);
	cap.position.y = 0.665 + 0.1;
	bottle.add(cap);

	// ---------- Caja del empaque ----------
	const side = boxSideTexture();
	const dark = new THREE.MeshStandardMaterial({ color: 0x15212A, roughness: 0.85, metalness: 0.05 });
	const boxMats = [
		new THREE.MeshStandardMaterial({ map: side, roughness: 0.8 }),
		new THREE.MeshStandardMaterial({ map: side, roughness: 0.8 }),
		dark, dark,
		new THREE.MeshStandardMaterial({ map: boxFrontTexture(), roughness: 0.75, metalness: 0.05 }),
		dark,
	];
	const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.46, 0.3), boxMats);
	box.position.set(-0.38, 0.23, -0.2);
	box.rotation.y = 0.55;
	stage.add(box);

	// ---------- Pedestal de hielo ----------
	const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshBasicMaterial({
		map: haloTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
	}));
	halo.rotation.x = -Math.PI / 2;
	halo.position.y = 0.002;
	stage.add(halo);

	const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.025, 64), new THREE.MeshPhysicalMaterial({
		color: 0x8FB8C9, roughness: 0.15, transparent: true, opacity: 0.35, envMapIntensity: 1.5, depthWrite: false,
	}));
	disc.position.y = -0.013;
	stage.add(disc);

	// ---------- Cristales de hielo en órbita ----------
	const shardMat = new THREE.MeshPhysicalMaterial({
		color: 0xD6EBF3, roughness: 0.05, metalness: 0.1, clearcoat: 1,
		transparent: true, opacity: 0.85, envMapIntensity: 2.4, flatShading: true,
	});
	const shards = [];
	for (let i = 0; i < 7; i++) {
		const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.018 + Math.random() * 0.016, 0), shardMat);
		m.scale.set(0.8, 2.2 + Math.random(), 0.8);
		m.userData = {
			a: (i / 8) * Math.PI * 2,
			r: 0.42 + Math.random() * 0.12,
			y: 0.12 + Math.random() * 0.62,
			s: 0.25 + Math.random() * 0.25,
			spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(1.5),
		};
		stage.add(m);
		shards.push(m);
	}

	// ---------- Bruma (partículas) ----------
	const dot = softDotTexture();
	const N = 220;
	const mistGeo = new THREE.BufferGeometry();
	const pos = new Float32Array(N * 3), seed = new Float32Array(N);
	for (let i = 0; i < N; i++) {
		const a = Math.random() * Math.PI * 2, r = 0.15 + Math.random() * 0.5;
		pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.random() * 1.0; pos[i * 3 + 2] = Math.sin(a) * r;
		seed[i] = Math.random();
	}
	mistGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	const mistMat = new THREE.PointsMaterial({
		map: dot, size: 0.03, color: 0xDDEFF6, transparent: true, opacity: 0.7,
		depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
	});
	const mist = new THREE.Points(mistGeo, mistMat);
	stage.add(mist);

	// Ráfaga de bruma desde la tapa (efecto del diálogo FÓRMULA)
	const B = 160;
	const burstGeo = new THREE.BufferGeometry();
	const bPos = new Float32Array(B * 3), bVel = new Float32Array(B * 3);
	burstGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
	const burstMat = new THREE.PointsMaterial({
		map: dot, size: 0.05, color: 0xEAF6FB, transparent: true, opacity: 0,
		depthWrite: false, blending: THREE.AdditiveBlending,
	});
	const burst = new THREE.Points(burstGeo, burstMat);
	burst.frustumCulled = false;
	stage.add(burst);

	// ---------- Estado / animación ----------
	const state = {
		intro: 1,          // 0→1 entrada
		spin: null,        // {t0, dur}
		shardBoost: 0,
		burstT: -1,
		baseRotY: 0,
	};
	stage.scale.setScalar(0.001);

	const api = {
		root, bottle,
		pickables: [glass, inner, label, cap, box],

		show() {
			state.intro = 0;
		},

		spin(dur = 1.8) { state.spin = { t: 0, dur }; },

		shards() { state.shardBoost = 1; },

		mist() {
			const capY = cap.position.y + 0.1;
			for (let i = 0; i < B; i++) {
				bPos[i * 3] = (Math.random() - .5) * 0.04;
				bPos[i * 3 + 1] = capY + Math.random() * 0.02;
				bPos[i * 3 + 2] = (Math.random() - .5) * 0.04;
				const a = Math.random() * Math.PI * 2, sp = 0.15 + Math.random() * 0.35;
				bVel[i * 3] = Math.cos(a) * sp; bVel[i * 3 + 1] = 0.2 + Math.random() * 0.45; bVel[i * 3 + 2] = Math.sin(a) * sp;
			}
			burstGeo.attributes.position.needsUpdate = true;
			state.burstT = 0;
		},

		update(dt, time) {
			// Entrada con rebote suave
			if (state.intro < 1) {
				state.intro = Math.min(1, state.intro + dt / 0.9);
				stage.scale.setScalar(Math.max(0.001, easeOutBack(state.intro) * SCALE));
			} else if (stage.scale.x !== SCALE) stage.scale.setScalar(SCALE);

			// Frasco: flota y oscila mostrando la etiqueta
			bottle.position.y = 0.03 + Math.sin(time * 1.3) * 0.012;
			let rotY = Math.sin(time * 0.55) * 0.45;
			if (state.spin) {
				state.spin.t += dt;
				const k = Math.min(1, state.spin.t / state.spin.dur);
				rotY += easeInOut(k) * Math.PI * 2;
				if (k >= 1) state.spin = null;
			}
			bottle.rotation.y = rotY;
			box.position.y = 0.23 + Math.sin(time * 1.1 + 1) * 0.006;

			halo.material.opacity = 0.75 + Math.sin(time * 2) * 0.2;
			halo.scale.setScalar(1 + Math.sin(time * 2) * 0.03);

			// Cristales
			state.shardBoost = Math.max(0, state.shardBoost - dt / 2.4);
			const boost = easeInOut(state.shardBoost);
			for (const m of shards) {
				const u = m.userData;
				u.a += dt * (u.s + boost * 2.2);
				const r = u.r + boost * 0.18;
				m.position.set(Math.cos(u.a) * r, u.y + Math.sin(time * 0.8 + u.a) * 0.04 + boost * 0.08, Math.sin(u.a) * r);
				m.rotation.x += u.spin.x * dt; m.rotation.y += u.spin.y * dt; m.rotation.z += u.spin.z * dt;
			}

			// Bruma ascendente
			const p = mistGeo.attributes.position.array;
			for (let i = 0; i < N; i++) {
				p[i * 3 + 1] += dt * (0.03 + seed[i] * 0.05);
				p[i * 3] += Math.sin(time * 0.7 + seed[i] * 10) * dt * 0.01;
				if (p[i * 3 + 1] > 1.0) p[i * 3 + 1] = 0;
			}
			mistGeo.attributes.position.needsUpdate = true;
			mistMat.opacity = 0.45 + Math.sin(time * 1.7) * 0.1;

			// Ráfaga
			if (state.burstT >= 0) {
				state.burstT += dt;
				const k = state.burstT / 1.8;
				for (let i = 0; i < B; i++) {
					bPos[i * 3] += bVel[i * 3] * dt; bPos[i * 3 + 1] += bVel[i * 3 + 1] * dt; bPos[i * 3 + 2] += bVel[i * 3 + 2] * dt;
					bVel[i * 3 + 1] -= dt * 0.12;
				}
				burstGeo.attributes.position.needsUpdate = true;
				burstMat.opacity = k < 0.1 ? k * 9 : Math.max(0, 0.9 * (1 - k));
				burstMat.size = 0.04 + k * 0.05;
				if (k >= 1) { state.burstT = -1; burstMat.opacity = 0; }
			}
		},
	};

	return api;
}
