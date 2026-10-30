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

export function stopEngine() {
  if (!engine || !ctx) return;
  const old = engine;
  const oldGain = engineGain;
  engine = null;
  engineGain = null;
  oldGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
  old.stop(ctx.currentTime + 0.12);
}
