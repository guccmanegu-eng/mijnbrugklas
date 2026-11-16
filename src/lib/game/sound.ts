/* ========================================================================
 * Kleine geluidjes via WebAudio — geen bestanden nodig.
 * Geluid staat standaard aan en kan in de app uitgezet worden.
 * ===================================================================== */

const MUTE_KEY = "brugklas-geluid-uit";
let actx: AudioContext | null = null;
let gedempt: boolean | null = null;
const luisteraars = new Set<(uit: boolean) => void>();

export function isGedempt() {
  if (gedempt === null) {
    try {
      gedempt = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      gedempt = false;
    }
  }
  return gedempt;
}

export function zetGedempt(uit: boolean) {
  gedempt = uit;
  try {
    localStorage.setItem(MUTE_KEY, uit ? "1" : "0");
  } catch {
    /* noop */
  }
  luisteraars.forEach((l) => l(uit));
}

export function opGeluidWijziging(fn: (uit: boolean) => void) {
  luisteraars.add(fn);
  return () => {
    luisteraars.delete(fn);
  };
}

export function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.07,
  delay = 0,
  slideTo?: number,
) {
  if (isGedempt()) return;
  try {
    actx ??= new AudioContext();
    if (actx.state === "suspended") void actx.resume();
    const t0 = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur);
  } catch {
    /* geen geluid beschikbaar */
  }
}

export function ruis(dur: number, vol = 0.05, delay = 0) {
  if (isGedempt()) return;
  try {
    actx ??= new AudioContext();
    const t0 = actx.currentTime + delay;
    const len = Math.floor(actx.sampleRate * dur);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = actx.createBufferSource();
    const g = actx.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g).connect(actx.destination);
    src.start(t0);
  } catch {
    /* noop */
  }
}

export const snd = {
  klik: () => tone(660, 0.05, "square", 0.03),
  ster: () => {
    tone(880, 0.1);
    tone(1318, 0.12, "sine", 0.07, 0.08);
  },
  goed: () => {
    tone(523, 0.14);
    tone(659, 0.14, "sine", 0.07, 0.12);
    tone(784, 0.22, "sine", 0.08, 0.24);
  },
  fout: () => tone(170, 0.3, "sawtooth", 0.05),
  combo: (n: number) => tone(500 + Math.min(n, 12) * 70, 0.09, "triangle", 0.06),
  bots: () => tone(120, 0.12, "square", 0.04),
  pop: () => tone(300, 0.08, "sine", 0.08, 0, 900),
  sirene: () => {
    for (let i = 0; i < 4; i++) {
      tone(650, 0.35, "square", 0.035, i * 0.7, 950);
      tone(950, 0.35, "square", 0.035, i * 0.7 + 0.35, 650);
    }
  },
  bel: () => {
    for (let i = 0; i < 6; i++) tone(1200, 0.08, "square", 0.04, i * 0.1);
  },
  gong: () => {
    tone(523, 0.6, "sine", 0.08);
    tone(392, 0.8, "sine", 0.07, 0.45);
  },
  schop: () => {
    ruis(0.12, 0.08);
    tone(140, 0.12, "sine", 0.1, 0, 60);
  },
  juich: () => {
    ruis(0.9, 0.04);
    tone(784, 0.15, "triangle", 0.06, 0.1);
    tone(988, 0.15, "triangle", 0.06, 0.25);
    tone(1175, 0.3, "triangle", 0.06, 0.4);
  },
  zoem: () => tone(220, 0.15, "sawtooth", 0.02, 0, 260),
  level: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "triangle", 0.07, i * 0.1));
  },
};
