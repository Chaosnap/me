import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLoaderBokeh } from './fx/bokeh.js';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import { chapters, TOTAL_PAGES } from './render.js';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// 揭幕动画结束后清掉 GSAP 写入的行内 transform，交还给 CSS（hover 效果才能生效）
const CLEAR = 'transform,translate,rotate,scale';
export const KANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export let lenis = null;
export const scrollState = { velocity: 0 };

/* ---------------- Smooth scroll ---------------- */
export function initScroll() {
  if (!reduceMotion) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
    lenis.on('scroll', (e) => {
      scrollState.velocity = e.velocity;
      ScrollTrigger.update();
    });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    if (import.meta.env.DEV) Object.assign(window, { __lenis: lenis, __gsap: gsap, __ST: ScrollTrigger });
  }
}

/* ---------------- Loader → 表紙 ---------------- */
export function playLoader(ready, onDone, setup) {
  const loader = $('#loader');
  const bokeh = initLoaderBokeh($('.ld-bokeh', loader), { still: reduceMotion });
  const text = $('.ld-text', loader);
  text.innerHTML = [...text.textContent].map((c) => `<span class="ch">${c}</span>`).join('');
  const num = $('.ld-num', loader);
  const counter = { v: 0 };
  let finished = false;

  const tl = gsap.timeline();
  tl.to($$('.ch', text), { opacity: 1, filter: 'blur(0px)', duration: 0.6, stagger: 0.08, ease: 'power2.out' }, 0.2)
    .to(counter, {
      v: 100,
      duration: 2.1,
      ease: 'power2.inOut',
      onUpdate: () => {
        num.textContent = String(Math.round(counter.v)).padStart(3, '0');
        $('.ld-bar i', loader).style.transform = `scaleX(${counter.v / 100})`;
      },
    }, 0)
    // loader 自己的动画放完、画面静止时再做一次性的重活（建 ScrollTrigger 等），避免卡顿
    .add(() =>
      ready.then(() => {
        prepare();
        requestAnimationFrame(finish);
      }),
    );
  let prepared = false;
  function prepare() {
    if (prepared) return;
    prepared = true;
    setup && setup();
  }

  function finish() {
    if (finished) return;
    finished = true;
    prepare();
    tl.kill();
    const out = gsap.timeline({
      onComplete: () => {
        loader.remove();
        document.body.classList.remove('is-loading');
      },
    });
    out.to($$('.ch', text), { opacity: 0, y: -12, filter: 'blur(8px)', stagger: 0.03, duration: 0.4, ease: 'power2.in' })
      .to('.ld-foot, .ld-skip', { opacity: 0, duration: 0.3 }, '<')
      .to('.ld-flash', { opacity: 1, duration: 0.35, ease: 'power2.in' }, '-=0.1')
      .add(() => {
        loader.style.background = 'transparent';
        bokeh.stop();
        $$('.ld-bokeh, .ld-text', loader).forEach((n) => n.remove());
        onDone && onDone();
      })
      .to('.ld-flash', { opacity: 0, duration: 1.1, ease: 'power2.out' });
  }
  $('.ld-skip', loader).addEventListener('click', finish);
  loader.addEventListener('click', finish);
  if (reduceMotion) finish();
}

/* ---------------- 表紙 intro ---------------- */
export function coverIntro() {
  lenis && lenis.start();
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.from('.mast-word .mch', { yPercent: -130, rotate: () => gsap.utils.random(-25, 25), opacity: 0, duration: 1.1, stagger: 0.07, ease: 'back.out(1.8)' }, 0.05)
    .from('.mast-weekly', { scaleY: 0, transformOrigin: 'top', duration: 0.6 }, 0.1)
    .from('.mast-ja', { scale: 0, rotate: -40, duration: 0.8, ease: 'back.out(2.5)' }, 0.6)
    .from('.cover-art .near', { y: 260, duration: 1.6, ease: 'expo.out' }, 0.1)
    .from('.cover-art .far, .cover-art .wires', { opacity: 0, duration: 1.4 }, 0.4)
    .from('.cover-fence', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out' }, 0.2)
    .from('.cover-count', { x: -40, opacity: 0, duration: 1, ease: 'expo.out' }, 0.5)
    .from('.cc-slash', { scaleY: 0, duration: 0.8, ease: 'expo.inOut' }, 0.9)
    .from('.cover-flare', { opacity: 0, duration: 2, ease: 'power2.out' }, 0.2)
    .from('.cover-film', { yPercent: 100, duration: 0.9, ease: 'expo.out' }, 0.6)
    .to('.tag-slash line', { strokeDashoffset: 0, duration: 0.7, ease: 'power3.inOut' }, 2.1)
    .from('.cover-bubble', { scale: 0, rotate: -20, transformOrigin: '20% 90%', duration: 0.9, ease: 'elastic.out(1, 0.5)' }, 0.9)
    .from('.cover-tagline .tch', { y: 40, opacity: 0, filter: 'blur(6px)', rotate: () => gsap.utils.random(-15, 15), duration: 0.9, stagger: 0.06 }, 0.8)
    .to('.cover-tagline .hand-underline path', { strokeDashoffset: 0, duration: 1.1, stagger: 0.25, ease: 'power2.inOut' }, 1.5)
    .from('.cover-lines li', { x: 80, opacity: 0, duration: 0.8, stagger: 0.07 }, 0.7)
    .from('.cover-burst', { scale: 0, rotate: 180, duration: 0.9, ease: 'back.out(2)' }, 1.2)
    .from('.cover-barcode, .cover-top, .scroll-hint', { opacity: 0, y: 10, duration: 0.8, stagger: 0.1 }, 1.0)
    .from('.filmnav', { xPercent: 140, duration: 1.1, ease: 'expo.out' }, 0.9)
    .from('.fn-lens', { opacity: 0, duration: 0.8 }, 1.4);
  // 天数从 0 数上来
  const num = $('.cc-num b');
  if (num) {
    const o = { v: 0 };
    tl.to(o, { v: Number(num.dataset.count), duration: 1.6, ease: 'power3.out', onUpdate: () => (num.textContent = String(Math.round(o.v)).padStart(2, '0')) }, 0.6);
  }
  $$('.cover-lines .cl-en').forEach((el, i) =>
    tl.to(el, { duration: 1, scrambleText: { text: el.textContent, chars: KANA, speed: 0.6 } }, 0.9 + i * 0.07),
  );
  return tl;
}

/* ---------------- 懒加载图片：加载完再淡入，不会「啪」地一下冒出来 ---------------- */
const loaded = (img) => img.complete && img.naturalWidth > 0;
export function fadeOnLoad(img) {
  if (!img || loaded(img)) return;
  img.classList.add('img-wait');
  img.addEventListener(
    'load',
    () => {
      img.classList.remove('img-wait');
      img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease-out' });
    },
    { once: true },
  );
  img.addEventListener('error', () => img.classList.remove('img-wait'), { once: true });
}
// 等图片下载并解码（最多 ms 毫秒）
const imagesReady = (imgs, ms = 2500) =>
  Promise.race([Promise.all(imgs.map((i) => (loaded(i) && i.decode ? i.decode().catch(() => {}) : new Promise((r) => (i.addEventListener('load', r, { once: true }), i.addEventListener('error', r, { once: true })))))), new Promise((r) => setTimeout(r, ms))]);

/* ---------------- Section animations ---------------- */
export function initAnimations({ sky }) {
  const mm = gsap.matchMedia();

  // 自我介绍的图（立绘、头像）马上开始下载：滑到那里时已经准备好，能跟着格子一起渐入
  $$('.about-page img').forEach((img) => (img.loading = 'eager'));
  // 其他懒加载的图：加载完淡入
  $$('.work-img, .pad-cover img, .ac-icon').forEach(fadeOnLoad);

  // ---- 表紙 scroll
  ScrollTrigger.create({
    trigger: '#cover',
    start: 'top top',
    end: 'bottom top',
    onUpdate: (s) => sky && sky.setScroll(s.progress),
  });
  gsap.to('.masthead', { yPercent: -35, ease: 'none', scrollTrigger: { trigger: '#cover', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.cover-art', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '#cover', start: 'top top', end: 'bottom top', scrub: true } });
  // 只动子元素：.cover-tagline 自身的 transform 负责居中/倾斜，交给 CSS
  gsap.to('.cover-tagline .hand:not(.tag-ghost), .cover-tagline .hand-underline, .tag-slash', { y: -120, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#cover', start: '10% top', end: '70% top', scrub: true } });
  gsap.to('.cover-lines', { x: 120, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#cover', start: '5% top', end: '60% top', scrub: true } });
  gsap.to('.cover-count', { x: -80, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#cover', start: '5% top', end: '60% top', scrub: true } });

  // ---- 目次
  gsap.from('.contents-title', { yPercent: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.contents', start: 'top 75%' } });
  gsap.from('.toc-row', { x: -60, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '.toc', start: 'top 80%' } });
  gsap.from('.author-comment', { y: 40, opacity: 0, rotate: 3, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.author-comment', start: 'top 90%' } });

  // ---- 扉ページ
  $$('[data-door]').forEach((door) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: door, start: 'top 62%' } });
    tl.from($('.speedlines', door), { scale: 1.8, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0)
      .from($('.door-no', door), { scale: 3, opacity: 0, rotate: -25, duration: 0.7, ease: 'back.out(2.2)' }, 0.1)
      .from($$('.door-title .ch', door), { yPercent: -80, opacity: 0, scale: 1.4, duration: 0.8, stagger: 0.09, ease: 'power4.out' }, 0.25)
      .fromTo($('.door-title', door), { '--hit': '18px' }, { '--hit': '0px', duration: 1, ease: 'power3.out' }, 0.3)
      .from($('.door-meta', door), { x: -30, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.7)
      .from($('.marquee', door), { xPercent: 100, duration: 1, ease: 'expo.out' }, 0.2)
      .add(() => door.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,4px)' }, { transform: 'translate(5px,-3px)' }, { transform: 'translate(-2px,2px)' }, { transform: 'translate(0,0)' }], { duration: 260 }), 0.45);
    gsap.fromTo($('.door-bgword span', door), { xPercent: 10 }, { xPercent: -45, ease: 'none', scrollTrigger: { trigger: door, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to($('.speedlines', door), { rotate: 8, ease: 'none', scrollTrigger: { trigger: door, start: 'top bottom', end: 'bottom top', scrub: true } });
    const track = $('.marquee-track', door);
    const loop = gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1, paused: true });
    ScrollTrigger.create({
      trigger: door,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (s) => (s.isActive ? loop.play() : loop.pause()),
      onUpdate: (s) => {
        const v = Math.min(6, Math.abs(scrollState.velocity) * 0.25);
        gsap.to(loop, { timeScale: (s.direction || 1) * (1 + v), duration: 0.3, overwrite: true });
      },
    });
  });

  // ---- コマ
  $$('.panel').forEach((panel, i) => {
    // 格子里有图的话，等图下载解码好再播（手机网速慢时，图不会在渐入结束后才突然冒出来）
    const tl = gsap.timeline({ paused: true });
    const imgs = $$('img', panel);
    ScrollTrigger.create({
      trigger: panel,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        imagesReady(imgs).then(() => {
          imgs.forEach(fadeOnLoad); // 超时还没好的，之后自己淡入
          tl.play();
        }),
    });
    tl.fromTo($('.panel-border polygon', panel), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0)
      .from($('.panel-inner', panel), { opacity: 0, scale: 1.08, duration: 0.9, ease: 'power3.out' }, 0.15);
    // 立绘：从左边滑进来，单独渐入
    const chara = $('.scene-chara', panel);
    if (chara) tl.from(chara, { xPercent: -14, opacity: 0, duration: 1.1, ease: 'power3.out', clearProps: CLEAR }, 0.3);
    const bubble = $('.speech', panel);
    if (bubble) tl.from(bubble, { scale: 0, transformOrigin: '80% 90%', duration: 0.8, ease: 'elastic.out(1, 0.55)' }, 0.6);
    const narr = $('.narration', panel);
    if (narr) tl.fromTo(narr, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' }, 0.5);
    const sfx = $$('.sfx-a, .sfx-big, .ng-stamp, .note', panel);
    if (sfx.length) tl.from(sfx, { scale: 2.4, opacity: 0, duration: 0.5, ease: 'back.out(3)', stagger: 0.15 }, 0.7);
    const ps = $$('.bio p, .profile-list > div', panel);
    if (ps.length) tl.from(ps, { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 0.4);
  });

  // ---- 作品集 (横スクロール)
  mm.add('(min-width: 901px)', () => {
    const pin = $('.works-pin');
    const track = $('.works-track');
    const cards = $$('.work', track);
    const dist = () => track.scrollWidth - innerWidth;
    const idx = $('#works-idx');
    const skew = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power3' });
    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (s) => {
          const n = Math.min(cards.length, Math.floor(s.progress * cards.length) + 1);
          const t = String(n).padStart(2, '0');
          if (idx.textContent !== t) {
            idx.textContent = t;
            gsap.fromTo(idx, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4 });
          }
          skew(gsap.utils.clamp(-6, 6, -scrollState.velocity * 0.3));
          // 靠近画面中心的那张恢复彩色
          const mid = innerWidth * 0.56;
          cards.forEach((c) => {
            const r = c.getBoundingClientRect();
            const d = Math.abs(r.left + r.width / 2 - mid) / (innerWidth * 0.42);
            c.style.setProperty('--focus', Math.max(0, 1 - d).toFixed(3));
          });
        },
        onLeave: () => skew(0),
        onLeaveBack: () => skew(0),
      },
    });
    cards.forEach((card) => {
      gsap.from($('.work-card', card), {
        yPercent: 18,
        rotate: 8,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        clearProps: `${CLEAR},opacity`,
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 95%' },
      });
      // 视差用 CSS 变量驱动，避免和 hover 的 scale/rotate 抢同一个属性
      gsap.fromTo(card, { '--px': 12 }, { '--px': -12, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    return () => {
      gsap.set(track, { clearProps: 'all' });
      cards.forEach((c) => c.style.removeProperty('--focus'));
    };
  });
  mm.add('(max-width: 900px)', () => {
    gsap.from('.work-card', { y: 40, opacity: 0, stagger: 0.08, duration: 0.7, clearProps: `${CLEAR},opacity`, scrollTrigger: { trigger: '.works-track', start: 'top 85%' } });
  });

  // ---- 能力値
  const shape = $('.radar-shape');
  if (shape) {
    gsap.from(shape, { scale: 0, rotate: -60, duration: 1.6, ease: 'elastic.out(1, 0.45)', scrollTrigger: { trigger: '.radar', start: 'top 75%' } });
    gsap.from('.radar-label', { opacity: 0, scale: 0.4, duration: 0.5, stagger: 0.06, ease: 'back.out(2)', scrollTrigger: { trigger: '.radar', start: 'top 75%' } });
    const tot = $('.stat-total b');
    const o = { v: 0 };
    gsap.to(o, {
      v: Number(tot.dataset.count),
      duration: 1.6,
      ease: 'power3.out',
      onUpdate: () => (tot.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: '.stat-total', start: 'top 90%' },
    });
  }
  $$('.move').forEach((m) => {
    gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 88%' } })
      .from(m, { x: 80, opacity: 0, duration: 0.7, ease: 'power3.out', clearProps: `${CLEAR},opacity` })
      .from($$('.move-power i', m), { scaleX: 0, transformOrigin: 'left', duration: 0.25, stagger: 0.07 }, 0.3);
  });

  // ---- あらすじ
  const railway = $('.railway');
  if (railway) {
    // 黄昏后车头灯亮起：变量只写在电车层上，且只在变化时写
    const trainLayer = $('.train-layer', railway);
    let dusk = '';
    ScrollTrigger.create({
      trigger: railway,
      start: 'top 40%',
      end: 'bottom 40%',
      onUpdate: (s) => {
        const v = gsap.utils.clamp(0, 1, (s.progress - 0.62) / 0.3).toFixed(2);
        if (v !== dusk && trainLayer) trainLayer.style.setProperty('--dusk', (dusk = v));
      },
    });
    $$('.station').forEach((st) => {
      // 站牌绕上沿从里往外翻下来：跟着滚动连续推进（scrub 带阻尼），不是触发后一口气播完。
      // 只改 .station 上的 --flip，旋转写在 CSS 里 → 不碰站牌自己的 transform，到站时的上浮也不会被覆盖
      gsap.fromTo(st, { '--flip': 1 }, { '--flip': 0, ease: 'power1.out', scrollTrigger: { trigger: st, start: 'top 98%', end: 'top 56%', scrub: 0.7 } });
      gsap.from($('.station-text', st), { y: 20, opacity: 0, duration: 0.6, scrollTrigger: { trigger: st, start: 'top 72%' } });
    });
  }

  // ---- 好きなもの
  $$('.fav-col').forEach((col) => {
    const items = $$('li', col);
    gsap.timeline({ scrollTrigger: { trigger: col, start: 'top 80%' } })
      .from($('h3', col), { y: 30, opacity: 0, duration: 0.6 })
      .fromTo(items, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, stagger: 0.12, ease: 'expo.inOut' }, 0.2)
      .fromTo(items, { '--s': 0 }, { '--s': 1, duration: 0.9, stagger: 0.12, ease: 'expo.out' }, 0.5);
  });
  gsap.from('.pad', { y: 60, opacity: 0, rotate: () => gsap.utils.random(-10, 10), duration: 0.7, stagger: 0.08, ease: 'back.out(1.6)', clearProps: `${CLEAR},opacity`, scrollTrigger: { trigger: '.pads', start: 'top 85%' } });

  // ---- 次号予告
  gsap.timeline({ scrollTrigger: { trigger: '.next', start: 'top 60%' } })
    .from('.next-lines .speedlines', { scale: 2, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0)
    .from('.next-label', { y: 20, opacity: 0, duration: 0.5 }, 0.1)
    .from('.next-title .ch, .next-title .bang', { yPercent: 120, scale: 1.6, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(2)' }, 0.2)
    .from('.next-list li', { x: -30, opacity: 0, duration: 0.5, stagger: 0.1 }, 0.8)
    .from('.tsuzuku', { scale: 0, rotate: -40, duration: 0.8, ease: 'elastic.out(1, 0.5)' }, 1.1);
  gsap.to('.next-lines .speedlines', { rotate: 360, duration: 240, ease: 'none', repeat: -1 });

  // ---- 読者はがき
  gsap.from('.contact-head > *', { y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.contact-head', start: 'top 80%' } });
  gsap.from('.postcard', { y: 120, rotate: 7, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.postcard', start: 'top 85%' } });
  gsap.from('.sticker', { scale: 0, rotate: () => gsap.utils.random(-60, 60), duration: 0.7, stagger: 0.08, ease: 'back.out(2.4)', clearProps: CLEAR, scrollTrigger: { trigger: '.sticker-sheet', start: 'top 85%' } });

  // ---- 奥付
  gsap.timeline({ scrollTrigger: { trigger: '.colophon', start: 'top 70%' } })
    .from('.signoff .tch', { y: 50, opacity: 0, rotate: () => gsap.utils.random(-20, 20), duration: 0.8, stagger: 0.1, ease: 'power3.out' })
    .to('.signoff .hand-underline path', { strokeDashoffset: 0, duration: 1.2, stagger: 0.25, ease: 'power2.inOut' }, 0.6)
    .from('.okuzuke', { y: 40, opacity: 0, duration: 0.8 }, 0.4);

  // ---- 章节追踪：付箋 / HUD / ノンブル
  // （胶卷导航的「曝光帧」和说明文字由 initFilmNav 按片门位置自己决定）
  const hudCh = $('#hud-chapter');
  let current = '';
  const setChapter = (id) => {
    if (id === current) return;
    current = id;
    const c = chapters.find((x) => x.id === id);
    const label = c.no ? `第${c.no}話 ${c.ja}` : c.ja;
    gsap.to(hudCh, { duration: 0.6, scrambleText: { text: label, chars: KANA, speed: 0.8 } });
  };
  $$('[data-chapter]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (s) => s.isActive && setChapter(sec.dataset.chapter),
    });
  });
  setChapter('cover');
  const pageNo = $('#page-no');
  const prog = $('#progress');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (s) => {
      pageNo.textContent = String(Math.max(1, Math.round(1 + s.progress * (TOTAL_PAGES - 1)))).padStart(3, '0');
      prog.style.transform = `scaleX(${s.progress})`;
    },
  });

  // ---- 速度驱动的「套色偏移」
  // 只写到用到 --mx 的几个元素上，并且只在数值变化时写：
  // 写在 :root 上会让整页每帧重新计算样式、重绘巨大的刊名阴影
  const misEls = $$('.masthead, .cover-count, .door-title, .next-title');
  let mx = 2,
    shown = '';
  gsap.ticker.add(() => {
    const target = 2 + Math.min(14, Math.abs(scrollState.velocity) * 0.6);
    mx += (target - mx) * 0.15;
    const v = `${(Math.round(mx * 4) / 4).toFixed(2)}px`;
    if (v === shown) return;
    shown = v;
    misEls.forEach((el) => el.style.setProperty('--mx', v));
  });
  const mast = $('.masthead');
  // 偶尔的 glitch
  const glitch = () => {
    const letters = $$('.mast-word .mch');
    if (letters.length && ScrollTrigger.isInViewport($('#cover'))) {
      gsap.timeline()
        .to(letters, { x: () => gsap.utils.random(-14, 14), skewX: () => gsap.utils.random(-20, 20), duration: 0.06, stagger: 0.02 })
        .to(letters, { x: 0, skewX: 0, duration: 0.12 });
      gsap.fromTo(mast, { '--my': '4px' }, { '--my': '0px', duration: 0.25 });
    }
    setTimeout(glitch, gsap.utils.random(2500, 6000));
  };
  if (!reduceMotion) setTimeout(glitch, 3500);

  // 字体与图片加载完后刷新
  addEventListener('load', () => ScrollTrigger.refresh());
}

/* ---------------- scramble on hover ---------------- */
export function initScramble() {
  $$('[data-scramble]').forEach((el) => {
    const text = el.textContent;
    const host = el.closest('a, button') || el;
    host.addEventListener('mouseenter', () => gsap.to(el, { duration: 0.6, scrambleText: { text, chars: KANA, speed: 0.9 }, overwrite: true }));
  });
}
