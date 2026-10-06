import './styles/base.css';
import './styles/sections.css';
import './styles/extras.css';
import './styles/v2.css';

import { site } from './content.js';
import { render, asset } from './render.js';
import { initSky } from './fx/sky.js';
import { createJellyLayer } from './fx/jelly.js';
import { createBGM } from './fx/bgm.js';
import { initFilmFx } from './fx/film.js';
import { sound, firework } from './fx/sound.js';
import { createFireworks } from './fx/fireworks.js';
import { initRailway } from './railway.js';
import { initScroll, playLoader, coverIntro, initAnimations, initScramble, reduceMotion } from './anim.js';
import {
  initGrain,
  initPanels,
  fitMasthead,
  initClock,
  initCursor,
  initClickJelly,
  initFilmNav,
  initNav,
  initTheme,
  initSoundUI,
  initModal,
  initPostcard,
  initNextJellies,
  initSwarm,
  initParallax,
} from './ui.js';

document.body.classList.add('is-loading');
history.scrollRestoration = 'manual';
scrollTo(0, 0);

render(document.getElementById('app'));
initGrain();
initPanels();
const refitMasthead = fitMasthead();
initClock();
initScroll();

const rand = (a, b) => a + Math.random() * (b - a);
const sky = initSky(document.querySelector('.sky'));
sky.hold(true); // loader 盖住时先暂停天空
const cover = document.getElementById('cover');

// 水母：全屏一层（点击 / 次号予告 / 效果音），封面天空一层
const jelly = createJellyLayer(document.getElementById('fx-canvas'), { fixed: true, max: 40 });
// 封面：简化版水母（30fps、1x 分辨率），揭幕后才开始
// 表紙 → 目次 的水母群：独立一层，简化画法、1x 分辨率
const swarm = createJellyLayer(document.getElementById('swarm-canvas'), { fixed: true, max: 140, lite: true, dpr: 1 });
if (import.meta.env.DEV) window.__swarm = swarm;
const coverJelly = createJellyLayer(cover.querySelector('.cover-jelly'), { fixed: false, max: 5, interactive: true, lite: true, fps: 30, dpr: 1 });
const startCoverJellies = () =>
  !reduceMotion &&
  coverJelly.ambient(true, {
    count: 4,
    prefill: true,
    make: { r: () => rand(26, 72), depth: () => rand(0.8, 1.1), speed: () => rand(0.1, 0.22), boost: () => rand(0.25, 0.5), alpha: () => rand(0.75, 0.95) },
  });
initFilmFx(cover);

const bgm = createBGM({ ...site.bgm, src: asset(site.bgm.src) });
bgm.play(); // 一进入就尝试播放；浏览器拦截的话，在第一次点击/按键时开始
const audioOn = () => bgm.playing || sound.enabled;
const spawnFromBottom = () => jelly.spawn(innerWidth * rand(0.1, 0.9), innerHeight + 40, { r: rand(18, 44), speed: rand(0.4, 0.7), life: rand(9, 12) });

initCursor({ jelly });
initClickJelly({ jelly, audioOn });
initSoundUI({ bgm, layers: [jelly, coverJelly, swarm], spawnFromBottom });
initTheme({ sky });
initFilmNav();
initNav({ audioOn });
initModal();
initPostcard(site.contact.email);
initParallax({ sky });
initScramble();

// 奥付：滑到底时放夏祭り花火（离开就不再发射，已经炸开的放完为止）
const colophon = document.getElementById('colophon');
if (!reduceMotion && colophon) {
  const $c = (sel) => document.querySelector(sel);
  const hanabi = createFireworks(colophon.querySelector('.hanabi'), {
    onBurst: (size, crackle) => audioOn() && firework(size, crackle),
    // 图案花火避开：奥付表格、胶卷（完全不压）；标题、页脚（尽量不压）
    avoid: { hard: () => [$c('.okuzuke'), $c('#filmnav'), $c('.fn-lens')], soft: () => [$c('.signoff'), $c('.colophon-foot')] },
  });
  if (import.meta.env.DEV) window.__hanabi = hanabi;
  new IntersectionObserver(([e]) => (e.isIntersecting ? hanabi.play() : hanabi.stop()), { threshold: 0.35 }).observe(colophon);
}

// 字体 + 着色器首帧都准备好再揭幕（最多等 4.5 秒）
const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
const fonts = import('./fonts.js').then(() => document.fonts.ready);
const ready = Promise.race([Promise.all([fonts, sky.ready]), timeout(4500)]);
const setup = () => {
  refitMasthead();
  initAnimations({ sky });
  // 这些 ScrollTrigger 在作品集的 pin 之后创建，位置才准确
  initRailway({ isSoundOn: audioOn });
  initNextJellies({ jelly });
  initSwarm({ swarm });
};
playLoader(
  ready,
  () => {
    sky.hold(false);
    startCoverJellies();
    coverIntro();
  },
  setup,
);
