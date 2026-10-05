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
import { sound } from './fx/sound.js';
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
const cover = document.getElementById('cover');

// 水母：全屏一层（点击 / 次号予告 / 效果音），封面天空一层
const jelly = createJellyLayer(document.getElementById('fx-canvas'), { fixed: true, max: 40 });
const coverJelly = createJellyLayer(cover.querySelector('.cover-jelly'), { fixed: false, max: 8, interactive: true });
if (!reduceMotion)
  coverJelly.ambient(true, {
    count: 7,
    prefill: true,
    make: { r: () => rand(22, 78), depth: () => rand(0.7, 1.1), speed: () => rand(0.1, 0.24), boost: () => rand(0.25, 0.5), alpha: () => rand(0.7, 0.95) },
  });
initFilmFx(cover);

const bgm = createBGM({ ...site.bgm, src: asset(site.bgm.src) });
const audioOn = () => bgm.playing || sound.enabled;
const spawnFromBottom = () => jelly.spawn(innerWidth * rand(0.1, 0.9), innerHeight + 40, { r: rand(18, 44), speed: rand(0.4, 0.7), life: rand(9, 12) });

initCursor({ jelly });
initClickJelly({ jelly, audioOn });
initSoundUI({ bgm, layers: [jelly, coverJelly], spawnFromBottom });
initTheme({ sky });
initFilmNav();
initNav({ audioOn });
initModal();
initPostcard(site.contact.email);
initParallax({ sky });
initScramble();

// 字体 + 着色器首帧都准备好再揭幕（最多等 4.5 秒）
const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
const fonts = import('./fonts.js').then(() => document.fonts.ready);
const ready = Promise.race([Promise.all([fonts, sky.ready]), timeout(4500)]).then(() => {
  refitMasthead();
  initAnimations({ sky });
  // 这些 ScrollTrigger 在作品集的 pin 之后创建，位置才准确
  initRailway({ isSoundOn: audioOn });
  initNextJellies({ jelly });
});
playLoader(ready, () => coverIntro());
