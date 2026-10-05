/* 背景音乐：浏览器不允许无交互自动播放，所以在第一次点击/按键时开始（淡入）。
 * 音频接到 AnalyserNode 上，低频能量用来驱动水母、光晕等的脉动。 */
import { audio } from './sound.js';

const KEY = 'yuki-bgm';

export function createBGM({ src, title, artist, volume = 0.6 }) {
  const el = new Audio();
  el.src = src;
  el.loop = true;
  el.preload = 'auto';
  let ctx, gain, analyser, data;
  let playing = false;
  const subs = new Set();
  const emit = () => subs.forEach((fn) => fn(playing));
  let wanted = true;
  let unavailable = false;
  const missing = new Set();
  el.addEventListener('error', () => {
    unavailable = true;
    missing.forEach((fn) => fn());
  });
  try {
    wanted = localStorage.getItem(KEY) !== 'off';
  } catch (e) {}

  function connect() {
    if (analyser) return;
    ctx = audio();
    const node = ctx.createMediaElementSource(el);
    gain = ctx.createGain();
    gain.gain.value = 0;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.82;
    data = new Uint8Array(analyser.frequencyBinCount);
    node.connect(gain).connect(analyser).connect(ctx.destination);
  }

  async function play() {
    if (unavailable) return false;
    connect();
    if (ctx.state === 'suspended') await ctx.resume();
    try {
      await el.play();
    } catch (e) {
      return false;
    }
    playing = true;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.9);
    save('on');
    emit();
    return true;
  }

  function pause() {
    if (!ctx) return;
    playing = false;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.18);
    setTimeout(() => !playing && el.pause(), 700);
    save('off');
    emit();
  }

  const save = (v) => {
    try {
      localStorage.setItem(KEY, v);
    } catch (e) {}
  };

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album: '週刊ユキ' });
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
  }

  return {
    get playing() {
      return playing;
    },
    get wanted() {
      return wanted;
    },
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    on: (fn) => subs.add(fn),
    /** 音乐文件不存在时（例如没有一起部署）回调 */
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
