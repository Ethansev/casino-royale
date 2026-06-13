import { useUiStore } from "@/store/uiStore";

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function master(): number {
  const { muted, volume } = useUiStore.getState();
  return muted ? 0 : volume;
}

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

/** Short filtered-noise click — the building block for chips and dice. */
function click(
  freq: number,
  duration: number,
  gain: number,
  delay = 0,
  q = 8,
) {
  const c = ac();
  const level = master();
  if (!c || level === 0) return;
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq * (0.92 + Math.random() * 0.16);
  filter.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain * level, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + duration + 0.05);
}

function tone(
  freq: number,
  duration: number,
  gain: number,
  delay = 0,
  type: OscillatorType = "sine",
) {
  const c = ac();
  const level = master();
  if (!c || level === 0) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain * level, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const sounds = {
  chip() {
    click(2100, 0.06, 0.5);
    click(3300, 0.04, 0.25, 0.018);
  },
  chipCascade() {
    for (let i = 0; i < 6; i++) click(1900 + i * 180, 0.06, 0.35, i * 0.055);
  },
  diceRattle() {
    let t = 0;
    for (let i = 0; i < 9; i++) {
      t += 0.035 + Math.random() * 0.05;
      click(2600, 0.04, 0.3, t, 5);
    }
  },
  diceLand() {
    click(1400, 0.07, 0.55, 0, 4);
    click(900, 0.09, 0.45, 0.07, 4);
    tone(110, 0.12, 0.25, 0.07, "triangle");
  },
  win() {
    tone(880, 0.14, 0.22);
    tone(1318, 0.2, 0.22, 0.11);
  },
  bigWin() {
    const notes = [659, 880, 1047, 1318];
    notes.forEach((f, i) => tone(f, 0.16, 0.22, i * 0.09));
  },
  lose() {
    tone(220, 0.18, 0.12, 0, "sawtooth");
    tone(165, 0.25, 0.1, 0.12, "sawtooth");
  },
  sevenOut() {
    tone(440, 0.18, 0.18, 0, "triangle");
    tone(330, 0.18, 0.18, 0.15, "triangle");
    tone(220, 0.35, 0.18, 0.3, "triangle");
  },
  pointMade() {
    const notes = [523, 659, 784];
    notes.forEach((f, i) => tone(f, 0.18, 0.2, i * 0.1));
  },
};

let lastUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const { dealerVoice, muted } = useUiStore.getState();
  if (!dealerVoice || muted) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05;
  u.pitch = 0.9;
  lastUtterance = u; // keep a ref: some browsers GC mid-speech otherwise
  window.speechSynthesis.speak(u);
  void lastUtterance;
}
