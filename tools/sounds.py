# Genera los sonidos de FIORDO por síntesis (obra original, sin licencias de terceros).
import numpy as np, subprocess, os, wave
SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'audio')
rng = np.random.default_rng(7)

def lp(x, a):  # filtro paso bajo de un polo
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y

def lp_fast(x, a):
    from scipy.signal import lfilter
    return lfilter([a], [1, -(1 - a)], x)

try:
    import scipy  # noqa
    lowpass = lp_fast
except ImportError:
    lowpass = lp

def bandpass(x, lo, hi):
    a_hi = 1 - np.exp(-2 * np.pi * hi / SR); a_lo = 1 - np.exp(-2 * np.pi * lo / SR)
    return lowpass(x, a_hi) - lowpass(x, a_lo)

def reverb(x, wet=0.35):
    y = x.copy()
    for d, g in [(0.029, .5), (0.037, .45), (0.053, .4), (0.071, .33), (0.097, .27), (0.131, .2)]:
        n = int(d * SR); z = np.zeros_like(x); z[n:] = x[:-n] * g; y += z * wet
    return y

def save(name, x, br='128k'):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    w = os.path.join(OUT, name + '.wav')
    with wave.open(w, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((x * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-codec:a', 'libmp3lame', '-b:a', br, os.path.join(OUT, name + '.mp3')], check=True)
    os.remove(w)

def t(sec): return np.arange(int(sec * SR)) / SR

# 1) Ambiente: viento nórdico + agua del fiordo (loop de 24 s sin corte)
L = 24; tt = t(L); n = len(tt)
white = rng.standard_normal(n)
wind = bandpass(white, 180, 900)
gust = 0.55 + 0.45 * np.sin(2 * np.pi * tt / L * 3 + 1) * np.sin(2 * np.pi * tt / L * 2)
wind *= gust
whistle = bandpass(rng.standard_normal(n), 900, 1400) * (0.25 + 0.25 * np.sin(2 * np.pi * tt / L * 5)) ** 2
water = np.zeros(n)
for k in range(40):
    s = rng.uniform(0, L); d = rng.uniform(0.25, 0.9); i0 = int(s * SR); m = int(d * SR)
    env = np.sin(np.linspace(0, np.pi, m)) ** 2
    seg = bandpass(rng.standard_normal(m), 300, 2500) * env * rng.uniform(.3, 1)
    idx = (np.arange(m) + i0) % n
    water[idx] += seg
amb = wind * 1.0 + whistle * 0.6 + water * 0.55
amb = lowpass(amb, 0.35)
save('ambiente', amb * 0.6, '96k')

# 2) Detección: campanilla de hielo (cristal) con brillo
tt = t(2.6)
chime = np.zeros_like(tt)
for f, a, dec in [(1568, 1, 2.2), (2349, .7, 2.8), (3136, .55, 3.2), (4186, .35, 4), (5274, .25, 5), (6644, .18, 6)]:
    for j, delay in enumerate([0, .09, .18]):
        tau = np.clip(tt - delay, 0, None)
        chime += a * (0.8 ** j) * np.sin(2 * np.pi * f * (1 + 0.002 * j) * tau) * np.exp(-dec * tau) * (tt >= delay)
shimmer = bandpass(rng.standard_normal(len(tt)), 6000, 12000) * np.exp(-4 * tt) * 0.15
save('deteccion', reverb(chime + shimmer, 0.5))

# 3) Clic de botón: toque seco y limpio
tt = t(0.12)
click = np.sin(2 * np.pi * 1900 * tt) * np.exp(-55 * tt) + bandpass(rng.standard_normal(len(tt)), 2000, 7000) * np.exp(-120 * tt) * 0.6
save('clic', click)

# 4) Abrir diálogo: soplo de aire frío ascendente
tt = t(0.7); nn = len(tt)
env = np.sin(np.linspace(0, np.pi, nn)) ** 1.5
noise = rng.standard_normal(nn); swoosh = np.zeros(nn)
for c in range(6):
    sl = slice(c * nn // 6, (c + 1) * nn // 6)
    lo = 400 + 500 * c; swoosh[sl] = bandpass(noise, lo, lo * 2.2)[sl]
swoosh = lowpass(swoosh, 0.5) * env
tone = np.sin(2 * np.pi * (880 + 700 * tt) * tt) * env * 0.12
save('abrir', reverb(swoosh + tone, 0.3))

# 5) Cerrar diálogo: soplo descendente más corto
tt = t(0.45); nn = len(tt)
env = np.exp(-6 * tt) * (1 - np.exp(-60 * tt))
save('cerrar', reverb(bandpass(rng.standard_normal(nn), 300, 1800) * env, 0.25))

# 6) Bruma: atomizador de loción (frescura)
tt = t(0.9); nn = len(tt)
env = (1 - np.exp(-40 * tt)) * np.exp(-3.5 * tt)
save('bruma', reverb(bandpass(rng.standard_normal(nn), 3500, 11000) * env, 0.4))
print('ok', sorted(os.listdir(OUT)))
