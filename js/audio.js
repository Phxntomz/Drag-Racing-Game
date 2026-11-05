let ctx;
let muted = false;
let engine;
let engineGain;

function context() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(value) {
  muted = value;
  if (muted) stopEngine();
}

export function isMuted() {
  return muted;
}

export function beep(freq, duration, type = "square", gain = 0.04) {
  if (muted) return;
  const audio = context();
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start();
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.stop(audio.currentTime + duration + 0.02);
}

export function engineRpm(rpm, throttle) {
  if (muted) return;
  const audio = context();
  if (!engine) {
    engine = audio.createOscillator();
    engineGain = audio.createGain();
    engine.type = "sawtooth";
    engineGain.gain.value = 0.0001;
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    engine.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(audio.destination);
    engine.start();
  }
  engine.frequency.value = 48 + Math.max(0, rpm) * 0.028;
  const target = throttle ? 0.03 : 0.008;
  engineGain.gain.setTargetAtTime(target, audio.currentTime, 0.05);
}

export function breakSound(kind) {
  if (muted) return;
  const audio = context();
  stopEngine();
  const now = audio.currentTime;
  const snap = kind === "engine" ? 240 : 96;
  const hits = kind === "engine" ? [0, 0.08, 0.15] : [0, 0.04];
  for (const at of hits) {
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(snap, now + at);
    osc.frequency.exponentialRampToValueAtTime(34, now + at + 0.14);
    amp.gain.setValueAtTime(0.0001, now + at);
    amp.gain.exponentialRampToValueAtTime(0.2, now + at + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.16);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(now + at);
    osc.stop(now + at + 0.18);
  }
  const length = Math.floor(audio.sampleRate * (kind === "engine" ? 0.32 : 0.2));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    const env = (1 - i / length) ** (kind === "engine" ? 1.3 : 4);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = kind === "engine" ? 900 : 220;
  const noiseAmp = audio.createGain();
  noiseAmp.gain.value = kind === "engine" ? 0.16 : 0.32;
  noise.connect(filter);
  filter.connect(noiseAmp);
  noiseAmp.connect(audio.destination);
  noise.start();
}

export function stopEngine() {
  if (!engine || !ctx) return;
  const old = engine;
  const oldGain = engineGain;
  engine = null;
  engineGain = null;
  oldGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
  old.stop(ctx.currentTime + 0.12);
}
