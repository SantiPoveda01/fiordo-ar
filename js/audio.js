// Sonidos de FIORDO con Web Audio (un solo contexto, desbloqueado con el gesto del usuario).

const FILES = {
	ambiente: 'assets/audio/ambiente.mp3',
	deteccion: 'assets/audio/deteccion.mp3',
	clic: 'assets/audio/clic.mp3',
	abrir: 'assets/audio/abrir.mp3',
	cerrar: 'assets/audio/cerrar.mp3',
	bruma: 'assets/audio/bruma.mp3',
};

const VOLUME = { ambiente: 0.55, deteccion: 0.8, clic: 0.5, abrir: 0.55, cerrar: 0.45, bruma: 0.6 };

class SoundBank {

	constructor() {
		this.ctx = null;
		this.master = null;
		this.buffers = {};
		this.muted = false;
		this.ambient = null;
		this.ambientGain = null;
	}

	// Descarga los archivos (no necesita gesto del usuario).
	async preload(onProgress) {
		const entries = Object.entries(FILES);
		let done = 0;
		this.raw = {};
		await Promise.all(entries.map(async ([name, url]) => {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Audio ${url}: HTTP ${res.status}`);
			this.raw[name] = await res.arrayBuffer();
			done++;
			onProgress?.(done / entries.length);
		}));
	}

	// Debe llamarse dentro de un gesto del usuario (clic en "Iniciar").
	async unlock() {
		if (!this.ctx) {
			const Ctx = window.AudioContext || window.webkitAudioContext;
			if (!Ctx) return;
			this.ctx = new Ctx();
			this.master = this.ctx.createGain();
			this.master.gain.value = this.muted ? 0 : 1;
			this.master.connect(this.ctx.destination);
		}
		if (this.ctx.state === 'suspended') await this.ctx.resume();
		if (this.raw) {
			await Promise.all(Object.entries(this.raw).map(async ([name, data]) => {
				if (this.buffers[name]) return;
				this.buffers[name] = await new Promise((ok, ko) => this.ctx.decodeAudioData(data.slice(0), ok, ko));
			}));
		}
	}

	play(name, { volume = 1, rate = 1 } = {}) {
		if (!this.ctx || !this.buffers[name]) return;
		const src = this.ctx.createBufferSource();
		src.buffer = this.buffers[name];
		src.playbackRate.value = rate;
		const g = this.ctx.createGain();
		g.gain.value = (VOLUME[name] ?? 1) * volume;
		src.connect(g).connect(this.master);
		src.start();
	}

	ambientOn() {
		if (!this.ctx || !this.buffers.ambiente) return;
		if (!this.ambient) {
			const src = this.ctx.createBufferSource();
			const buf = this.buffers.ambiente;
			src.buffer = buf;
			src.loop = true;
			// Recorta el relleno del codificador MP3 para que el loop no tenga corte.
			src.loopStart = 0.06;
			src.loopEnd = buf.duration - 0.06;
			this.ambientGain = this.ctx.createGain();
			this.ambientGain.gain.value = 0;
			src.connect(this.ambientGain).connect(this.master);
			src.start(0, 0.06);
			this.ambient = src;
		}
		const t = this.ctx.currentTime;
		this.ambientGain.gain.cancelScheduledValues(t);
		this.ambientGain.gain.setTargetAtTime(VOLUME.ambiente, t, 0.6);
	}

	ambientOff() {
		if (!this.ambientGain) return;
		const t = this.ctx.currentTime;
		this.ambientGain.gain.cancelScheduledValues(t);
		this.ambientGain.gain.setTargetAtTime(0.0001, t, 0.5);
	}

	setMuted(m) {
		this.muted = m;
		if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
	}

	// Pausa todo cuando la pestaña queda oculta.
	suspend() { this.ctx?.state === 'running' && this.ctx.suspend(); }
	resume() { this.ctx?.state === 'suspended' && this.ctx.resume(); }
}

export const sounds = new SoundBank();
