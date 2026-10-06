/* 夏の音：全部用 Web Audio 实时合成（不使用任何录音文件）
 *  cicada  : 白天 = ミンミンゼミ / 夜晚 = ヒグラシ「カナカナ」
 *  furin   : 风铃（非谐波正弦叠加）
 *  waves   : 海浪（滤波噪声 + 缓慢起伏）
 *  jelly   : 水中气泡（ぷくぷく）+ 水母
 */

let ctx = null;
let master, bus, noiseBuf;
const active = new Map();

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    // 简单混响：反馈延迟
    const verb = ctx.createDelay(1);
    verb.delayTime.value = 0.13;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.25;
    const lp = ctx.createBiquadFilter();
    lp.frequency.value = 3200;
    bus = ctx.createGain();
    bus.connect(master);
    bus.connect(verb);
    verb.connect(lp).connect(fb).connect(verb);
    lp.connect(wet).connect(master);
    master.connect(comp).connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const noise = () => {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  return s;
};
const isNight = () => document.documentElement.dataset.theme === 'night';
const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- 蝉 ---------- */
function cicadaVoice(out, pan, night) {
  const src = noise();
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = night ? 18 : 7;
  bp.frequency.value = night ? rand(4600, 5200) : rand(3800, 4600);
  const tone = ctx.createOscillator();
  tone.type = night ? 'sine' : 'sawtooth';
  tone.frequency.value = bp.frequency.value * (night ? 1 : 0.5);
  const toneG = ctx.createGain();
  toneG.gain.value = night ? 0.5 : 0.05;
  const am = ctx.createGain();
  am.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = night ? 22 : rand(60, 90);
  const lfoG = ctx.createGain();
  lfoG.gain.value = 0.5;
  lfo.connect(lfoG).connect(am.gain);
  const env = ctx.createGain();
  env.gain.value = 0;
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  src.connect(bp).connect(am);
  tone.connect(toneG).connect(am);
  am.connect(env).connect(p).connect(out);
  src.start();
  tone.start();
  lfo.start();

  let stopped = false;
  let timer;
  const call = () => {
    if (stopped) return;
    const t = ctx.currentTime + 0.05;
    const g = env.gain;
    g.cancelScheduledValues(t);
    let dur;
    if (night) {
      // カナカナカナ…（逐渐变弱、变低）
      const reps = 14 + Math.floor(rand(0, 8));
      const f0 = bp.frequency.value;
      for (let i = 0; i < reps; i++) {
        const ti = t + i * 0.14;
        const amp = 0.7 * Math.pow(0.9, i);
        g.setValueAtTime(0, ti);
        g.linearRampToValueAtTime(amp, ti + 0.02);
        g.exponentialRampToValueAtTime(0.001, ti + 0.12);
        tone.frequency.setValueAtTime(f0 * (1 - i * 0.008), ti);
      }
      dur = reps * 0.14;
    } else {
      // ミーーン ミンミンミンミン ミー…
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(0.55, t + 0.5);
      g.linearRampToValueAtTime(0.2, t + 0.75);
      let ti = t + 0.8;
      const reps = 4 + Math.floor(rand(0, 4));
      for (let i = 0; i < reps; i++) {
        g.linearRampToValueAtTime(0.65, ti + 0.06);
        g.linearRampToValueAtTime(0.12, ti + 0.2);
        ti += 0.24;
      }
      g.linearRampToValueAtTime(0.5, ti + 0.1);
      g.linearRampToValueAtTime(0, ti + 1.1);
      dur = ti + 1.1 - t;
    }
    timer = setTimeout(call, (dur + rand(0.6, 2.6)) * 1000);
  };
  timer = setTimeout(call, rand(0, 1500));
  return () => {
    stopped = true;
    clearTimeout(timer);
    const t = ctx.currentTime;
    env.gain.cancelScheduledValues(t);
    env.gain.setTargetAtTime(0, t, 0.15);
    setTimeout(() => {
      src.stop();
      tone.stop();
      lfo.stop();
    }, 800);
  };
}

function cicadas() {
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(isNight() ? 0.09 : 0.06, ctx.currentTime, 0.6);
  out.connect(bus);
  const night = isNight();
  const stops = [-0.7, 0.1, 0.65].map((p) => cicadaVoice(out, p, night));
  // 背景的「シャワシャワ」底噪
  const bed = noise();
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = night ? 5200 : 6200;
  bp.Q.value = 1.5;
  const bg = ctx.createGain();
  bg.gain.value = night ? 0.02 : 0.05;
  bed.connect(bp).connect(bg).connect(out);
  bed.start();
  return () => {
    stops.forEach((s) => s());
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    setTimeout(() => bed.stop(), 1500);
  };
}

/* ---------- 风铃 ---------- */
export function chime(gain = 0.18) {
  if (!ctx) return;
  const f = [2093, 2349, 2637, 3136, 3520][Math.floor(Math.random() * 5)] * rand(0.98, 1.02);
  const t = ctx.currentTime + 0.01;
  const p = ctx.createStereoPanner();
  p.pan.value = rand(-0.5, 0.5);
  p.connect(bus);
  [
    [1, 1, 2.6],
    [2.32, 0.45, 1.6],
    [4.25, 0.25, 1.0],
    [6.63, 0.12, 0.6],
  ].forEach(([m, a, d]) => {
    const o = ctx.createOscillator();
    o.frequency.value = f * m;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain * a, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(p);
    o.start(t);
    o.stop(t + d + 0.1);
  });
}

function furin() {
  let stopped = false;
  let timer;
  const gust = () => {
    if (stopped) return;
    const n = 1 + Math.floor(rand(0, 3));
    for (let i = 0; i < n; i++) setTimeout(() => !stopped && chime(0.16), i * rand(120, 380));
    timer = setTimeout(gust, rand(1400, 4200));
  };
  gust();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

/* ---------- 海浪 ---------- */
function waves() {
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(0.5, ctx.currentTime, 1);
  out.connect(bus);
  const layers = [0, 4.1].map((offset, i) => {
    const src = noise();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.value = 0;
    const pan = ctx.createStereoPanner();
    pan.pan.value = i ? 0.45 : -0.45;
    src.connect(lp).connect(g).connect(pan).connect(out);
    src.start();
    let stopped = false;
    let timer;
    const swell = () => {
      if (stopped) return;
      const t = ctx.currentTime;
      const len = rand(5.5, 8.5);
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(rand(0.25, 0.4), t + len * 0.45);
      g.gain.linearRampToValueAtTime(0.03, t + len);
      lp.frequency.cancelScheduledValues(t);
      lp.frequency.setValueAtTime(400, t);
      lp.frequency.linearRampToValueAtTime(rand(1400, 2200), t + len * 0.45);
      lp.frequency.linearRampToValueAtTime(350, t + len);
      timer = setTimeout(swell, len * 1000);
    };
    timer = setTimeout(swell, offset * 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
      setTimeout(() => src.stop(), 1500);
    };
  });
  return () => {
    layers.forEach((s) => s());
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  };
}

/* ---------- 水中气泡 ---------- */
export function blip(gain = 0.12) {
  if (!ctx) return;
  const t = ctx.currentTime + 0.005;
  const f0 = rand(380, 950);
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * rand(1.8, 2.6), t + rand(0.05, 0.12));
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  const p = ctx.createStereoPanner();
  p.pan.value = rand(-0.6, 0.6);
  o.connect(g).connect(p).connect(bus);
  o.start(t);
  o.stop(t + 0.2);
}

function underwater(hooks) {
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(0.35, ctx.currentTime, 0.8);
  out.connect(bus);
  const src = noise();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 320;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 120;
  lfo.connect(lfoG).connect(lp.frequency);
  src.connect(lp).connect(out);
  src.start();
  lfo.start();
  let stopped = false;
  let timer;
  const tick = () => {
    if (stopped) return;
    const n = 1 + Math.floor(rand(0, 4));
    for (let i = 0; i < n; i++) setTimeout(() => !stopped && blip(rand(0.05, 0.12)), i * rand(40, 140));
    if (Math.random() < 0.45 && hooks.launch) hooks.launch();
    timer = setTimeout(tick, rand(500, 1500));
  };
  tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    setTimeout(() => {
      src.stop();
      lfo.stop();
    }, 1500);
  };
}

/* ---------- 翻页声 ---------- */
export function pageTurn() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = noise();
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(1800, t);
  bp.frequency.linearRampToValueAtTime(4200, t + 0.25);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.14, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  src.connect(bp).connect(g).connect(bus);
  src.start(t);
  src.stop(t + 0.4);
}

/* ---------- 花火：远处的「ドーン」+ 噼啪声（光先到，声音晚一点） ---------- */
let lastBoom = 0;
export function firework(size = 1, crackle = false) {
  if (!ctx) return;
  const now = ctx.currentTime;
  if (now - lastBoom < 0.14) return; // 连发时别糊成一片
  lastBoom = now;
  const t = now + rand(0.12, 0.35);
  const v = Math.min(1.3, size);
  const src = noise();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(700, t);
  lp.frequency.exponentialRampToValueAtTime(55, t + 1);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.2 * v, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  src.connect(lp).connect(g).connect(bus);
  src.start(t);
  src.stop(t + 1.5);
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(95, t);
  o.frequency.exponentialRampToValueAtTime(36, t + 0.55);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.22 * v, t + 0.015);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
  o.connect(og).connect(bus);
  o.start(t);
  o.stop(t + 0.8);
  if (!crackle) return;
  for (let i = 0; i < 16; i++) {
    const ct = t + rand(0.7, 1.7);
    const c = noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = rand(2500, 6000);
    bp.Q.value = 1.2;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.0001, ct);
    cg.gain.exponentialRampToValueAtTime(rand(0.03, 0.07), ct + 0.003);
    cg.gain.exponentialRampToValueAtTime(0.0001, ct + 0.04);
    c.connect(bp).connect(cg).connect(bus);
    c.start(ct, rand(0, 1.5));
    c.stop(ct + 0.05);
  }
}

/* ---------- 公共接口 ---------- */
const makers = { cicada: cicadas, furin, waves, jelly: underwater };
let enabled = false;

/** 共享的 AudioContext（背景音乐也挂在这里做频谱分析） */
export function audio() {
  return ensure();
}

export const sound = {
  get enabled() {
    return enabled;
  },
  enable() {
    ensure();
    enabled = true;
    master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.1);
  },
  disable() {
    enabled = false;
    [...active.keys()].forEach((k) => this.stop(k));
    if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  },
  isOn(name) {
    return active.has(name);
  },
  start(name, hooks = {}) {
    this.enable();
    if (active.has(name)) return;
    active.set(name, makers[name](hooks));
  },
  stop(name) {
    const s = active.get(name);
    if (s) s();
    active.delete(name);
  },
  restart(name) {
    if (!active.has(name)) return;
    this.stop(name);
    this.start(name);
  },
};
