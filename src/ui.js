import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters, workDetail, asset } from './render.js';
import { site } from './content.js';
import { speedLines } from './art.js';
import { sound, pageTurn, chime, blip } from './fx/sound.js';
import { lenis, reduceMotion, KANA } from './anim.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- 颗粒纹理 ---------- */
export function initGrain() {
  const c = document.createElement('canvas');
  c.width = c.height = 220;
  const x = c.getContext('2d');
  const img = x.createImageData(220, 220);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  $('.grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

/* ---------- 漫画格子：clip-path + 描边 ---------- */
export function initPanels() {
  $$('.panel[data-clip]').forEach((panel) => {
    const pts = panel.dataset.clip.split(',').map((p) => p.trim().split(/\s+/).map(Number));
    $('.panel-inner', panel).style.setProperty('--clip', `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(',')})`);
    panel.insertAdjacentHTML(
      'beforeend',
      `<svg class="panel-border" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="${pts.map((p) => p.join(',')).join(' ')}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/></svg>`,
    );
  });
}

/* ---------- 刊名自适应宽度 ---------- */
export function fitMasthead() {
  const mast = $('.masthead');
  const word = $('.mast-word');
  const weekly = $('.mast-weekly');
  const fit = () => {
    word.style.setProperty('--mast-size', '100px');
    word.style.transform = '';
    const avail = mast.clientWidth - weekly.offsetWidth - 20;
    const w = word.scrollWidth;
    const maxH = innerHeight * (innerWidth < 900 ? 0.2 : 0.3);
    const size = Math.min((100 * avail) / w, maxH / 0.8);
    word.style.setProperty('--mast-size', `${size}px`);
    const stretch = Math.min(1.5, avail / word.scrollWidth);
    if (stretch > 1.02) {
      word.style.transform = `scaleX(${stretch})`;
      word.style.transformOrigin = 'left top';
    }
  };
  fit();
  document.fonts.ready.then(fit);
  addEventListener('resize', fit);
  // 竖屏（手机 / 平板）：按屏幕比例算出取景窗口，让大电线杆停在右侧约 88% 处，
  // 不会像以前那样跑到正中间或最左边、挡住标题和目录
  const pole = $('.pole-scene');
  const ar = () => {
    if (!pole) return;
    const W = innerWidth,
      H = pole.clientHeight || innerHeight;
    if (W / H < 1) {
      const k = H / 1000; // 竖屏时按高度铺满
      const x0 = Math.round(1210 - (0.88 * W) / k);
      pole.setAttribute('viewBox', `${x0} 0 1600 1000`);
      pole.setAttribute('preserveAspectRatio', 'xMinYMax slice');
    } else {
      pole.setAttribute('viewBox', '0 0 1600 1000');
      pole.setAttribute('preserveAspectRatio', 'xMidYMax slice');
    }
  };
  ar();
  addEventListener('resize', ar);
  return fit;
}

/* ---------- 时钟 ---------- */
export function initClock() {
  const c = $('#clock');
  const d = $('#date');
  const W = '日月火水木金土';
  const tick = () => {
    const n = new Date();
    c.textContent = n.toTimeString().slice(0, 8);
    d.textContent = `${n.getFullYear()}.${String(n.getMonth() + 1).padStart(2, '0')}.${String(n.getDate()).padStart(2, '0')}（${W[n.getDay()]}）`;
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- 光标：肥皂泡（悬停时变成珍珠 + 外圈旋转文字） ---------- */
const CURSOR_EN = { 見る: 'VIEW', 読む: 'READ', 開く: 'OPEN', 次へ: 'NEXT', 前へ: 'PREV', 閉じる: 'CLOSE', 鳴らす: 'PLAY', 投函: 'POST', 戻る: 'BACK', 切替: 'DAY / NIGHT', '♪': 'MUSIC', GO: 'LINK', '✉': 'MAIL' };
export function initCursor({ jelly }) {
  if (!fine) return;
  document.documentElement.classList.add('has-cursor');
  const cur = $('#cursor');
  const ring = $('.c-ring', cur);
  const dot = $('.c-dot', cur);
  const orbit = $('.c-orbit', cur);
  const orbitText = $('textPath', orbit);

  let mx = -200,
    my = -200,
    x = mx,
    y = my,
    px = x,
    py = y,
    lastBubble = 0;
  addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
  });
  gsap.ticker.add((time) => {
    x += (mx - x) * 0.18;
    y += (my - y) * 0.18;
    const vx = x - px,
      vy = y - py;
    px = x;
    py = y;
    const sp = Math.hypot(vx, vy);
    const a = Math.atan2(vy, vx);
    // 轻微的果冻形变
    const s = Math.min(0.16, sp * 0.01);
    ring.style.transform = `translate3d(${x}px,${y}px,0) rotate(${a}rad) scale(${1 + s},${1 - s * 0.6}) rotate(${-a}rad)`;
    orbit.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (sp > 9 && time - lastBubble > 0.12) {
      jelly.bubble(x + rand(-5, 5), y + rand(6, 12), { r: rand(1.2, 2.4) });
      lastBubble = time;
    }
  });

  const sel = 'a, button, [data-cursor], input, textarea, label';
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest(sel);
    if (!t) return;
    if (t.matches('input, textarea')) {
      cur.style.opacity = '0.25';
      return;
    }
    const txt = t.dataset.cursor || '';
    cur.classList.add('is-hover');
    const en = CURSOR_EN[txt] || (txt ? txt.toUpperCase() : 'CLICK');
    orbitText.textContent = `${txt ? txt + ' ・ ' : ''}${en} ・ `.repeat(4).slice(0, 30);
  });
  document.addEventListener('pointerout', (e) => {
    const t = e.target.closest(sel);
    if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
    cur.classList.remove('is-hover');
    cur.style.opacity = '';
  });
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  document.addEventListener('mouseleave', () => (cur.style.opacity = '0'));
  document.addEventListener('mouseenter', () => (cur.style.opacity = ''));
}

/* ---------- 点击：游出水母 ---------- */
export function initClickJelly({ jelly, audioOn }) {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.modal, .mobile-toc, #loader')) return;
    if (e.target.closest('a, button, input, textarea, label, select, .postcard')) {
      jelly.ripple(e.clientX, e.clientY);
      return;
    }
    jelly.burst(e.clientX, e.clientY);
    if (audioOn()) for (let i = 0; i < 3; i++) setTimeout(() => blip(0.07), i * rand(60, 140));
  });
}

/* ---------- 右侧胶卷：随滚动前进 ---------- */
export function initFilmNav() {
  const nav = $('#filmnav');
  const reel = $('.fn-reel', nav);
  const frames = $$('.fn-frame:not(.fn-leader)', reel);
  const lens = $('.fn-lens');
  const lensFrame = $('.fl-frame', lens);
  const imgs = $$('.fl-img', lens);
  const lensNo = $('.fl-no', lens);
  const caption = document.createElement('div');
  caption.className = 'fn-caption';
  caption.setAttribute('aria-hidden', 'true');
  document.body.appendChild(caption);
  // 说明文字：滚动时出现，页面静止 2 秒后淡出（鼠标停在胶卷上时一直显示）
  gsap.set(caption, { opacity: 0, x: 10 });
  let shown = false;
  let hideTimer = 0;
  let hovering = false;
  const showCaption = () => {
    if (innerWidth <= 900) return;
    clearTimeout(hideTimer);
    if (!shown) {
      shown = true;
      gsap.to(caption, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
    }
    hideTimer = setTimeout(hideCaption, 2000);
  };
  const hideCaption = () => {
    if (hovering) return;
    shown = false;
    gsap.to(caption, { opacity: 0, x: 10, duration: 0.8, ease: 'power2.inOut', overwrite: 'auto' });
  };
  addEventListener('scroll', showCaption, { passive: true });
  nav.addEventListener('pointerenter', () => ((hovering = true), showCaption()));
  nav.addEventListener('pointerleave', () => ((hovering = false), showCaption()));
  const secs = chapters.map((c) => document.getElementById(c.id));
  let tops = [];
  const measure = () => (tops = secs.map((s) => s.getBoundingClientRect().top + scrollY));
  measure();
  ScrollTrigger.addEventListener('refresh', measure);

  // 片门里换片：两层图交叉淡入，标题用乱码滚动
  let exposed = -1;
  let front = 0;
  const expose = (i) => {
    if (i === exposed) return;
    exposed = i;
    frames.forEach((f, k) => f.classList.toggle('is-active', k === i));
    const c = chapters[i];
    const img = $('.fn-img', frames[i]).style.backgroundImage;
    front = 1 - front;
    imgs[front].style.backgroundImage = img;
    imgs[front].classList.add('is-on');
    imgs[1 - front].classList.remove('is-on');
    lensNo.textContent = $('.fn-no', frames[i]).textContent;
    const label = c.no ? `第${c.no}話 ${c.ja}` : c.ja;
    gsap.to(caption, { duration: 0.6, scrambleText: { text: label, chars: KANA, speed: 0.8 } });
  };

  // 间歇送片：一节里大部分时间这一帧停在片门正中，快到下一节时才快速拉到下一帧
  const smooth = (u) => u * u * (3 - 2 * u);
  const pull = (f) => {
    const k = Math.round(f);
    const u = Math.min(1, Math.max(0, (f - k) / 0.3 + 0.5));
    return k - 0.5 + smooth(u);
  };

  let y = null;
  let lastEx = -1;
  gsap.ticker.add(() => {
    if (!frames.length || innerWidth <= 900) return;
    const anchor = scrollY + innerHeight * 0.45;
    let i = 0;
    while (i < tops.length - 1 && anchor >= tops[i + 1]) i++;
    const next = tops[i + 1] ?? document.documentElement.scrollHeight;
    const f = i + Math.min(1, Math.max(0, (anchor - tops[i]) / Math.max(1, next - tops[i])));
    const pitch = frames[0].offsetHeight;
    const target = innerHeight / 2 - (frames[0].offsetTop + pull(f) * pitch);
    const ny = y === null ? target : y + (target - y) * 0.14; // 第一帧直接就位
    if (Math.abs(ny - y) < 0.05) return;
    y = ny;
    reel.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;

    // 片门压着哪一帧，就曝光哪一帧；送片途中（帧没对正）快门半闭，片门变暗
    const pos = (innerHeight / 2 - y - frames[0].offsetTop) / pitch;
    const idx = Math.min(frames.length - 1, Math.max(0, Math.floor(pos)));
    expose(idx);
    const off = Math.min(1, Math.abs(pos - idx - 0.5) * 2); // 0 = 正中，1 = 帧边
    const ex = Math.round((1 - off * off) * 50) / 50;
    if (ex !== lastEx) {
      lastEx = ex;
      lensFrame.style.opacity = (0.18 + 0.82 * ex).toFixed(2);
      lensFrame.style.transform = `translate(-50%,-50%) scale(${(0.86 + 0.14 * ex).toFixed(3)})`;
    }
  });
  return { caption };
}

/* ---------- 翻页过场 + 导航 ---------- */
export function initNav({ audioOn }) {
  const turn = document.createElement('div');
  turn.className = 'page-turn';
  turn.setAttribute('aria-hidden', 'true');
  turn.innerHTML = `<div class="pt-sheet">${speedLines({ seed: 99, count: 160, inner: 0.55 })}<div class="pt-label"><span class="pt-no"></span><b class="pt-title" lang="ja"></b><span class="pt-en"></span></div></div><div class="pt-shadow"></div>`;
  document.body.appendChild(turn);
  let busy = false;

  // 翻页时一串透明泡泡浮上来（只动 transform / opacity，交给合成层）
  const bubbles = document.createElement('div');
  bubbles.className = 'pt-bubbles';
  bubbles.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bubbles);
  const bubbleUp = () => {
    const W = innerWidth,
      H = innerHeight;
    const n = W < 700 ? 34 : W < 1200 ? 64 : 84;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      const r = Math.random();
      const size = r < 0.12 ? rand(44, 84) : r < 0.4 ? rand(22, 44) : rand(6, 22);
      const big = size > 40;
      el.className = 'ptb';
      el.style.setProperty('--s', `${size.toFixed(0)}px`);
      el.style.setProperty('--hue', `${rand(0, 360).toFixed(0)}deg`);
      bubbles.appendChild(el);
      const dur = rand(1.1, 2.3) * (big ? 1.2 : 1);
      const x0 = W * rand(0.02, 0.98);
      gsap.set(el, { x: x0, y: H + size, scale: rand(0.5, 0.8), opacity: 0 });
      gsap
        .timeline({ delay: rand(0, 0.9), onComplete: () => el.remove() })
        .to(el, { opacity: rand(0.75, 1), duration: 0.25 }, 0)
        .to(el, { y: -size * 2 - H * rand(0, 0.15), duration: dur, ease: 'power1.in' }, 0)
        .to(el, { x: x0 + rand(-70, 70), duration: dur, ease: 'sine.inOut' }, 0)
        .to(el, { scale: 1, duration: dur * 0.6, ease: 'sine.out' }, 0)
        .to(el, { opacity: 0, duration: 0.35 }, dur - 0.35);
    }
  };

  const go = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    closeToc();
    const c = chapters.find((x) => x.id === id);
    if (reduceMotion || !lenis) {
      target.scrollIntoView();
      return;
    }
    if (busy) return;
    busy = true;
    if (audioOn()) pageTurn();
    bubbleUp();
    $('.pt-no', turn).textContent = `P.${String(c.page).padStart(3, '0')}`;
    $('.pt-title', turn).textContent = c.no ? `第${c.no}話 ${c.ja}` : c.ja;
    $('.pt-en', turn).textContent = c.en;
    const tl = gsap.timeline({ onComplete: () => (busy = false) });
    tl.set(turn, { display: 'block' })
      .fromTo('.pt-sheet', { clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)' }, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, -20% 100%)', duration: 0.55, ease: 'power3.in' })
      // 卷页阴影：贴着纸张斜边扫过去，盖满后立刻消失（不会在定格时留在右侧）
      .fromTo(
        '.pt-shadow',
        { x: innerWidth * 0.74, skewX: (Math.atan((0.2 * innerWidth) / innerHeight) * 180) / Math.PI, opacity: 1 },
        { x: -innerWidth * 0.26, duration: 0.55, ease: 'power3.in' },
        0,
      )
      .set('.pt-shadow', { opacity: 0 })
      .from('.pt-label > *', { y: 30, opacity: 0, stagger: 0.06, duration: 0.4, ease: 'back.out(2)' }, 0.35)
      .add(() => {
        lenis.scrollTo(target, { immediate: true, force: true });
        ScrollTrigger.update();
      })
      .to('.pt-sheet', { clipPath: 'polygon(0% 0%, 0% 0%, -20% 100%, -20% 100%)', duration: 0.6, ease: 'power3.inOut' }, '+=0.35')
      .set(turn, { display: 'none' });
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goto]');
    if (!a) return;
    e.preventDefault();
    go(a.dataset.goto);
  });

  // 移动端目录
  const toc = $('#mobile-toc');
  const btn = $('#menu-btn');
  function closeToc() {
    toc.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '目次';
    lenis && lenis.start();
  }
  btn.addEventListener('click', () => {
    const open = toc.hidden;
    toc.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '閉じる' : '目次';
    if (open) {
      lenis && lenis.stop();
      gsap.from('#mobile-toc a', { x: -30, opacity: 0, stagger: 0.04, duration: 0.4 });
    } else lenis && lenis.start();
  });
}

/* ---------- 昼 / 夜 ---------- */
export function initTheme({ sky }) {
  const btn = $('#theme-toggle');
  const meta = document.querySelector('meta[name="theme-color"]');
  const apply = (night) => {
    document.documentElement.dataset.theme = night ? 'night' : 'day';
    meta.setAttribute('content', night ? '#0f1822' : '#f3f1ee');
    sky && sky.setNight(night);
    try {
      localStorage.setItem('yuki-theme', night ? 'night' : 'day');
    } catch (e) {}
    if (sound.isOn('cicada')) sound.restart('cicada');
  };
  sky && sky.setNight(document.documentElement.dataset.theme === 'night');
  btn.addEventListener('click', () => {
    const night = document.documentElement.dataset.theme !== 'night';
    if (!document.startViewTransition || reduceMotion) return apply(night);
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2,
      y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => apply(night));
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 900, easing: 'cubic-bezier(.7,0,.25,1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
  });
}

/* ---------- 背景音乐 + 效果音 ---------- */
export function initSoundUI({ bgm, layers, spawnFromBottom }) {
  const btn = $('#bgm-toggle');
  const state = $('.bgm-state', btn);
  const eqs = $$('.bgm-eq i', btn);
  const pads = $$('.pad');
  const sync = (p) => {
    btn.setAttribute('aria-pressed', String(p));
    state.textContent = p ? 'PLAYING' : 'PAUSED';
  };
  bgm.on(sync);
  bgm.onMissing(() => {
    btn.hidden = true;
    document.querySelectorAll('.ok-bgm').forEach((el) => el.remove());
  });
  btn.addEventListener('click', () => bgm.toggle());

  // 第一次交互：接上频谱分析；如果自动播放被浏览器拦截了，就在这里开始播放
  const evs = ['pointerdown', 'keydown', 'touchend'];
  const cleanup = () => evs.forEach((ev) => removeEventListener(ev, unlock, true));
  async function unlock(e) {
    bgm.connect();
    if (e.target.closest && e.target.closest('#bgm-toggle')) return cleanup();
    if (bgm.playing || (await bgm.play())) cleanup();
  }
  evs.forEach((ev) => addEventListener(ev, unlock, true));

  // HUD 的 EQ + --beat（只写到胶卷取景框上，不写 :root）
  let beat = 0;
  const gate = $('.fn-lens');
  gsap.ticker.add(() => {
    if (!bgm.playing && beat < 0.001) return;
    const b = bgm.bands(5);
    eqs.forEach((el, i) => el.style.setProperty('--h', b ? b[i].toFixed(2) : '0'));
    beat += (bgm.level() - beat) * 0.3;
    if (gate) gate.style.setProperty('--beat', beat.toFixed(2));
    layers.forEach((l) => l.setBeat(beat));
  });

  const syncPads = () => pads.forEach((p) => p.setAttribute('aria-pressed', String(sound.isOn(p.dataset.sound))));
  pads.forEach((p) =>
    p.addEventListener('click', () => {
      const n = p.dataset.sound;
      if (sound.isOn(n)) sound.stop(n);
      else {
        sound.start(n, { launch: spawnFromBottom });
        if (n === 'furin') chime(0.22);
      }
      syncPads();
    }),
  );
}

/* ---------- 作品详情（票根）：「前」往右下、「次」往左下沿弧线转走 ---------- */
export function initModal() {
  const modal = $('#modal');
  const sheet = $('.modal-sheet', modal);
  const n = site.works.length;
  let last = null;
  let idx = 0;
  let busy = false;
  const PIVOT = '50% 280%'; // 支点在票根下方很远处 → 旋转时走一段弧线

  const fill = (i) => {
    idx = (i + n) % n;
    sheet.innerHTML = workDetail(idx);
  };
  // 预载 + 预解码大图：切换时新图已经解码好，不会在动画中途卡一下（手机上尤其明显）
  const decoded = new Map();
  const preload = (i) => {
    const k = (i + n) % n;
    const src = site.works[k]?.image;
    if (!src) return Promise.resolve();
    if (!decoded.has(k)) {
      const im = new Image();
      im.decoding = 'async';
      im.src = asset(src);
      decoded.set(k, (im.decode ? im.decode() : new Promise((r) => (im.onload = im.onerror = r))).catch(() => {}));
    }
    return decoded.get(k);
  };
  const ready = (i) => Promise.race([preload(i), new Promise((r) => setTimeout(r, 450))]);
  const neighbours = () => (preload(idx + 1), preload(idx - 1));
  const narrow = () => innerWidth <= 900;
  const intro = (delay = 0.12) =>
    gsap.from($$('.md-body > *', sheet), { x: 24, opacity: 0, stagger: 0.05, duration: 0.5, delay, ease: 'power3.out', clearProps: 'transform,translate,rotate,scale,opacity' });

  let opening = false;
  const open = (i) => {
    if (opening || !modal.hidden) return;
    opening = true;
    last = document.activeElement;
    lenis && lenis.stop();
    ready(i).then(() => {
      opening = false;
      modal.hidden = false;
      fill(i);
      intro();
      gsap.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.4 });
      gsap.fromTo(sheet, { y: 80, rotate: 3, opacity: 0, scale: 0.95, transformOrigin: '50% 50%' }, { y: 0, rotate: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out', onComplete: neighbours });
      $('.modal-close', sheet).focus({ preventScroll: true });
    });
  };

  /** dir = -1：前一张（当前票根往右下转走）；dir = 1：后一张（往左下转走） */
  const swap = (dir) => {
    if (busy || modal.hidden) return;
    busy = true;
    const target = idx + dir;
    const pre = ready(target); // 退场的同时就开始解码下一张
    // 手机上票根很高，支点又远：16° 会一下子甩出屏幕，看起来像跳帧 → 小一点的角度、近一点的支点
    const pivot = narrow() ? '50% 190%' : PIVOT;
    const out = (narrow() ? -9 : -16) * dir; // 「前」往右下转走（新的一张从左下转进来）；「次」往左下
    gsap.to(sheet, {
      rotate: out,
      y: 30,
      opacity: 0,
      duration: 0.42,
      ease: 'power2.in',
      transformOrigin: pivot,
      onComplete: () =>
        pre.then(() => {
          fill(target);
          gsap
            .timeline({ onComplete: () => ((busy = false), neighbours()) })
            .fromTo(sheet, { rotate: -out, y: 30, opacity: 0, transformOrigin: pivot }, { rotate: 0, y: 0, opacity: 1, duration: 0.75, ease: 'back.out(1.25)' })
            .add(() => intro(0), 0.2);
        }),
    });
  };

  const close = () => {
    gsap.to(sheet, { y: 60, opacity: 0, rotate: -3, duration: 0.35, ease: 'power3.in', transformOrigin: '50% 50%' });
    gsap.to('.modal-backdrop', {
      opacity: 0,
      duration: 0.35,
      onComplete: () => {
        modal.hidden = true;
        lenis && lenis.start();
        last && last.focus();
      },
    });
  };
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-work]');
    if (card) open(Number(card.dataset.work));
    const step = e.target.closest('[data-work-step]');
    if (step) swap(Number(step.dataset.workStep));
    if (e.target.closest('[data-close]')) close();
  });
  addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') swap(1);
    if (e.key === 'ArrowLeft') swap(-1);
  });
  // 手机上左右滑动切换
  let sx = null;
  sheet.addEventListener('pointerdown', (e) => (sx = e.clientX));
  sheet.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 60) swap(dx < 0 ? 1 : -1);
  });
}

/* ---------- 读者明信片 ---------- */
export function initPostcard(email) {
  const form = $('#postcard');
  const done = $('.pc-done', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const msg = (fd.get('msg') || '').toString().trim();
    if (!name || !msg) {
      done.textContent = '※ お名前とメッセージを書いてね（名字和留言是必填的）';
      gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    const body = `${msg}\n\n— ${name}${fd.get('email') ? ` <${fd.get('email')}>` : ''}\n（今号のお気に入り：${fd.get('fav')}）`;
    form.classList.remove('is-sent');
    void form.offsetWidth;
    form.classList.add('is-sent');
    done.textContent = '投函しました！メールアプリが開きます ✉';
    setTimeout(() => {
      location.href = `mailto:${email}?subject=${encodeURIComponent(`【読者はがき】${name} より`)}&body=${encodeURIComponent(body)}`;
    }, 650);
  });
}

/* ---------- 次号予告：漂浮的水母 ---------- */
export function initNextJellies({ jelly }) {
  const sec = $('#next');
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 70%',
    end: 'bottom 30%',
    onToggle: (s) => {
      if (reduceMotion) return;
      jelly.ambient(s.isActive, {
        count: 8,
        area: () => {
          const r = sec.getBoundingClientRect();
          return { x: 0, y: Math.max(0, r.top), w: innerWidth, h: Math.min(innerHeight, r.bottom) - Math.max(0, r.top) };
        },
        make: { glow: true, r: () => rand(16, 46), speed: () => rand(0.25, 0.5), life: () => rand(9, 13) },
      });
    },
  });
}

/* ---------- 封面视差 ---------- */
export function initParallax({ sky }) {
  if (!fine) return;
  const cover = $('#cover');
  const items = $$('[data-parallax]').map((el) => ({ el, d: Number(el.dataset.parallax), x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3' }) }));
  const v = { fx: 0, fy: 0 };
  const fx = gsap.quickTo(v, 'fx', { duration: 1.2, ease: 'power3', onUpdate: () => cover.style.setProperty('--fx', v.fx.toFixed(3)) });
  const fy = gsap.quickTo(v, 'fy', { duration: 1.2, ease: 'power3', onUpdate: () => cover.style.setProperty('--fy', v.fy.toFixed(3)) });
  addEventListener('pointermove', (e) => {
    const nx = (e.clientX / innerWidth) * 2 - 1;
    const ny = (e.clientY / innerHeight) * 2 - 1;
    items.forEach((it) => {
      it.x(-nx * 12 * it.d);
      it.y(-ny * 8 * it.d);
    });
    fx(nx);
    fy(-ny);
    sky && sky.setMouse(nx, -ny);
  });
}

/* ---------- 表紙 → 目次：水母群（boids）从底部两侧浮上来 ----------
 * 「倒梯形两条斜边」只是两群的大方向：每只的出生位置、时间、大小、速度、初始朝向都随机，
 * 之后由 boids（分离 / 对齐 / 聚合）+ 各自的随机游走决定轨迹，所以每次都不一样。
 * 数量按屏幕定上限，生成时实时看帧耗时：设备吃不消就不再加。 */
export function initSwarm({ swarm }) {
  if (reduceMotion) return;
  let lastAt = -1e9;
  const rise = () => {
    const now = performance.now();
    if (now - lastAt < 5000) return;
    lastAt = now;
    const W = innerWidth,
      H = innerHeight;
    const tilt = Math.atan((0.27 * W) / H);
    const per = W < 700 ? 18 : W < 1200 ? 34 : 44;
    const busy = () => {
      const p = swarm.perf();
      return p.running && (p.cost > 6 || p.gap > 28);
    };
    [-1, 1].forEach((side, g) => {
      for (let i = 0; i < per; i++) {
        // 三层景深：近（大、快、清楚）/ 中 / 远（小、慢、淡、触手少）
        const k = Math.random();
        const layer = k < 0.25 ? 0 : k < 0.65 ? 1 : 2;
        const a = side * tilt + rand(-0.22, 0.22); // 群体大方向上随机偏一点
        const v = [rand(1.9, 2.9), rand(1.4, 2.1), rand(0.9, 1.4)][layer];
        const o = {
          ang: a + rand(-0.4, 0.4),
          r: [rand(26, 46), rand(16, 26), rand(8, 15)][layer],
          depth: [rand(0.95, 1.1), rand(0.84, 0.94), rand(0.7, 0.8)][layer],
          alpha: [rand(0.85, 1), rand(0.6, 0.8), rand(0.35, 0.55)][layer],
          tents: layer === 2 ? Math.round(rand(6, 8)) : undefined,
          life: rand(7, 10),
          boid: { g, dx: Math.sin(a), dy: -Math.cos(a), min: v * 0.55, max: v * 1.15 },
        };
        const x = W * (0.5 + side * rand(0.04, 0.42));
        const y = H + rand(20, 420);
        setTimeout(() => !busy() && swarm.spawn(x, y, o), rand(0, 2600));
      }
    });
    // 中间一串小气泡
    for (let i = 0; i < 40; i++) setTimeout(() => swarm.bubble(W * rand(0.38, 0.62), H + rand(0, 40), { r: rand(1.5, 5) }), rand(0, 2400));
  };
  ScrollTrigger.create({
    trigger: '#contents',
    start: 'top 92%',
    onEnter: rise,
  });
  if (import.meta.env.DEV) window.__rise = () => ((lastAt = -1e9), rise());
  return { rise };
}
