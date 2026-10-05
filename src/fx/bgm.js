/* 背景音乐：一进入页面就尝试播放（淡入）。
 * 浏览器若拦截无交互的有声自动播放，则在第一次点击 / 按键时开始。
 * 注意：自动播放阶段不接 Web Audio（AudioContext 在用户交互前是挂起的，接上去反而会没声音），
 * 等第一次交互时再接上 AnalyserNode，用低频能量驱动水母和胶卷光晕的脉动。 */
import { audio } from './sound.js';

export function createBGM({ src, title, artist, volume = 0.6 }) {
  const el = new Audio();
  el.src = src;
  el.loop = true;
  el.preload = 'auto';
  el.volume = 0;
  let ctx, gain, analyser, data;
  let playing = false;
  let target = volume;
  const subs = new Set();
  const emit = () => subs.forEach((fn) => fn(playing));
  let unavailable = false;
  const missing = new Set();
  el.addEventListener('error', () => {
    unavailable = true;
    missing.forEach((fn) => fn());
  });

  /* 音量渐变：接入 Web Audio 前用 el.volume，之后用 gain */
  let fadeRaf = 0;
  function fadeTo(v, ms, done) {
    cancelAnimationFrame(fadeRaf);
    if (gain) {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(v, ctx.currentTime, ms / 3000);
      if (done) setTimeout(done, ms);
      return;
    }
    const from = el.volume;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      el.volume = from + (v - from) * k;
      if (k < 1) fadeRaf = requestAnimationFrame(tick);
      else done && done();
    };
    fadeRaf = requestAnimationFrame(tick);
  }

  /** 在用户交互里调用：接上频谱分析 */
  function connect() {
    if (analyser || unavailable) return;
    try {
      ctx = audio();
      const node = ctx.createMediaElementSource(el);
      gain = ctx.createGain();
      gain.gain.value = el.volume;
      el.volume = 1;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;
      data = new Uint8Array(analyser.frequencyBinCount);
      node.connect(gain).connect(analyser).connect(ctx.destination);
      cancelAnimationFrame(fadeRaf);
      if (playing) fadeTo(target, 1200);
    } catch (e) {
      analyser = null;
    }
  }

  async function play() {
    if (unavailable) return false;
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {}
    }
    try {
      await el.play();
    } catch (e) {
      return false; // 被自动播放策略拦截
    }
    playing = true;
    fadeTo(target, 1800);
    emit();
    return true;
  }

  function pause() {
    playing = false;
    fadeTo(0, 600, () => !playing && el.pause());
    emit();
  }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album: '週刊ユキ' });
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
  }

  return {
    get playing() {
      return playing;
    },
    play,
    pause,
    connect,
    toggle: () => (playing ? pause() : play()),
    on: (fn) => subs.add(fn),
    /** 音乐文件不存在时回调 */
    onMissing: (fn) => (unavailable ? fn() : missing.add(fn)),
    /** 低频能量 0~1 */
    level() {
      if (!analyser || !playing) return 0;
      analyser.getByteFrequencyData(data);
      let s = 0;
      for (let i = 1; i < 10; i++) s += data[i];
      return Math.max(0, s / 9 / 255 - 0.35) / 0.65;
    },
    /** n 段频谱 0~1（给 HUD 的小 EQ 用） */
    bands(n = 5) {
      if (!analyser || !playing) return null;
      analyser.getByteFrequencyData(data);
      const out = [];
      const span = Math.floor(data.length * 0.6);
      for (let b = 0; b < n; b++) {
        const a = Math.floor(Math.pow(b / n, 1.7) * span) + 1;
        const z = Math.max(a + 1, Math.floor(Math.pow((b + 1) / n, 1.7) * span) + 1);
        let s = 0;
        for (let i = a; i < z; i++) s += data[i];
        out.push(s / (z - a) / 255);
      }
      return out;
    },
  };
}
