/* 第4話：铁轨时间线
 * 弯曲的轨道 + 跟着滚动行驶的三节电车 + 电线杆 + 道口闪灯 + 到站翻牌 + 车内 LED「次は」
 *
 * 性能要点：静态的轨道 / 电线杆画在一张大 SVG 里（只画一次）；
 * 会动的东西（电车、道口、红色轨迹）各自单独一层，只改 transform / 裁剪高度，交给 GPU 合成，
 * 不会每帧重绘那张大 SVG。路径上的点预先采样成查找表，滚动时不再调用 getPointAtLength。 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from './content.js';
import { chime } from './fx/sound.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const CAR_GAP = 74;
const STEP = 3; // 查找表的采样间隔（px）

/* Catmull-Rom → 三次贝塞尔 */
function smoothPath(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function initRailway({ isSoundOn }) {
  const rw = $('.railway');
  if (!rw) return;
  const svg = $('.track', rw);
  const trailSvg = $('.track-trail', rw);
  const trailClip = $('.trail-clip', rw);
  const paths = $$('.tp', rw);
  const ref = $('.ballast', svg);
  const trainLayer = $('.train-layer', rw);
  const cars = [0, 1, 2].map((k) => $(`.car-el.c${k}`, rw));
  const sparks = $$('.sparks circle', rw);
  const polesG = $('.poles', svg);
  const xings = $('.xings', rw);
  const stations = $$('.station', rw);
  const led = $('.led-text', rw);
  const ledHead = $('.led-head', rw);
  const ledClock = $('.led-clock', rw);
  const story = site.story;

  let L = 1;
  let LUT = new Float32Array(4);
  let N = 2;
  let stationS = [];
  let crossings = [];
  let arrived = new Set();
  let nextIdx = -2;
  let target = 0;
  let cur = 0;
  let built = false;

  const at = (s) => {
    s = Math.max(0, Math.min(L, s));
    const f = s / STEP;
    const i = Math.min(N - 1, Math.floor(f));
    const j = Math.min(N - 1, i + 1);
    const t = f - i;
    return [LUT[2 * i] + (LUT[2 * j] - LUT[2 * i]) * t, LUT[2 * i + 1] + (LUT[2 * j + 1] - LUT[2 * i + 1]) * t];
  };
  const angleAt = (s) => {
    const a = at(Math.max(0, s - 4));
    const b = at(Math.min(L, s + 4));
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  };

  function build() {
    const W = rw.clientWidth;
    const H = rw.clientHeight;
    [svg, trailSvg].forEach((el) => {
      el.setAttribute('viewBox', `0 0 ${W} ${H}`);
      el.setAttribute('width', W);
      el.setAttribute('height', H);
    });
    const mobile = W < 760;
    const cx = mobile ? 40 : W / 2;
    const amp = mobile ? 0 : Math.min(80, W * 0.07);
    const top = rw.getBoundingClientRect().top;
    const pts = [[cx, 0]];
    const ys = [];
    stations.forEach((st, i) => {
      const sign = $('.station-sign', st).getBoundingClientRect();
      const y = sign.top - top + sign.height * 0.45;
      ys.push(y);
      const side = st.classList.contains('left') ? 1 : -1;
      const prevY = i ? ys[i - 1] : 0;
      if (!mobile && i > 0) pts.push([cx - side * amp * 0.9, (prevY + y) / 2]);
      pts.push([cx + side * amp * 0.25, y]);
    });
    pts.push([cx, H]);
    const d = smoothPath(pts);
    paths.forEach((p) => p.setAttribute('d', d));
    L = ref.getTotalLength();

    // 预采样查找表
    N = Math.ceil(L / STEP) + 1;
    LUT = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const p = ref.getPointAtLength(Math.min(L, i * STEP));
      LUT[2 * i] = p.x;
      LUT[2 * i + 1] = p.y;
    }

    // 每个站在路径上的位置
    stationS = ys.map((y) => {
      let i = 0;
      while (i < N - 1 && LUT[2 * i + 1] < y) i++;
      return i * STEP;
    });

    // 电线杆（静态，画进大 SVG）+ 架线
    let html = '';
    for (let s = 120, k = 0; s < L - 40; s += mobile ? 200 : 240, k++) {
      const [px, py] = at(s);
      const a = angleAt(s);
      const side = k % 2 ? 1 : -1;
      const x = px + Math.cos(a + Math.PI / 2) * 34 * side;
      const y = py + Math.sin(a + Math.PI / 2) * 34 * side;
      html += `<g class="pole" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((a * 180) / Math.PI).toFixed(1)})">
          <ellipse class="pole-shadow" cx="14" cy="9" rx="16" ry="4"/>
          <rect class="pole-arm" x="-2" y="${side > 0 ? -38 : 2}" width="4" height="36"/>
          <circle class="pole-top" r="5.5"/>
        </g>`;
    }
    const wire = [];
    for (let s = 0; s <= L; s += 40) {
      const [px, py] = at(s);
      wire.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    polesG.innerHTML = `<polyline class="overhead" points="${wire.join(' ')}"/>${html}`;

    // 道口：每个是独立的小元素，闪灯只重绘这一小块
    xings.innerHTML = '';
    crossings = mobile
      ? []
      : stationS.map((s, i) => {
          const [px, py] = at(s);
          const a = angleAt(s);
          const side = stations[i].classList.contains('left') ? 1 : -1;
          const el = document.createElement('div');
          el.className = 'xing crossing';
          el.style.transform = `translate(${(px - Math.cos(a - Math.PI / 2) * 58 * side).toFixed(1)}px, ${(py - Math.sin(a - Math.PI / 2) * 58 * side).toFixed(1)}px)`;
          el.innerHTML = `<svg viewBox="-24 -18 48 36" width="48" height="36">
            <circle class="lamp-glow a" cx="-9" cy="0" r="16" fill="url(#lampGlow)"/>
            <circle class="lamp-glow b" cx="9" cy="0" r="16" fill="url(#lampGlow)"/>
            <g class="xbuck"><rect x="-14" y="-2.5" width="28" height="5" transform="rotate(35)"/><rect x="-14" y="-2.5" width="28" height="5" transform="rotate(-35)"/></g>
            <circle class="lamp a" cx="-9" cy="0" r="4"/><circle class="lamp b" cx="9" cy="0" r="4"/></svg>`;
          xings.appendChild(el);
          return el;
        });
    built = true;
    update(cur, true, 0);
  }

  function place(car, s) {
    if (s < 0) {
      car.style.opacity = '0';
      return null;
    }
    const [x, y] = at(s);
    const deg = (angleAt(s) * 180) / Math.PI - 90;
    car.style.opacity = '1';
    car.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${deg.toFixed(2)}deg)`;
    return [x, y];
  }

  function flip(el) {
    $$('.flap', el).forEach((f, i) => {
      const final = f.dataset.d;
      let n = 6 + i * 3;
      const tick = () => {
        f.classList.remove('is-flip');
        void f.offsetWidth;
        f.classList.add('is-flip');
        f.textContent = n > 0 ? Math.floor(Math.random() * 10) : final;
        if (n-- > 0) setTimeout(tick, 55);
      };
      tick();
    });
  }

  function setLed(i, p) {
    if (i === nextIdx) return;
    nextIdx = i;
    const st = story[i];
    const last = story[story.length - 1];
    led.textContent =
      i < 0
        ? `終点 ${last.station}（${last.romaji}）です。ご乗車ありがとうございました。　　`
        : `${st.station}　${st.romaji}　${st.year}　──　${st.text}　　`;
    led.parentElement.parentElement.classList.toggle('is-end', i < 0);
    ledHead.textContent = i < 0 ? '終点' : i === 0 && p < 0.01 ? 'まもなく' : '次は';
    led.style.animation = 'none';
    void led.offsetWidth;
    led.style.animation = '';
  }

  let lastSpeed = -1;
  function update(p, silent = false, speed = 0) {
    if (!built) return;
    const s = p * L;
    const heads = cars.map((c, k) => place(c, s - k * CAR_GAP));
    // 红色轨迹：用裁剪高度揭开（纯合成，不重绘路径）
    trailClip.style.height = `${heads[0] ? heads[0][1].toFixed(0) : 0}px`;
    // 速度：电火花 + 风线（变量只写在电车层上）
    const v = Math.round(Math.min(1, speed) * 20) / 20;
    if (v !== lastSpeed) {
      trainLayer.style.setProperty('--speed', v);
      lastSpeed = v;
    }
    if (heads[0] && v > 0.25) {
      sparks.forEach((c) => {
        c.setAttribute('cx', (Math.random() * 16 - 8).toFixed(1));
        c.setAttribute('cy', (Math.random() * 10 + 8).toFixed(1));
        c.style.opacity = Math.random() < v ? '1' : '0';
      });
    } else if (lastSpeed > 0 || silent) sparks.forEach((c) => (c.style.opacity = '0'));

    // 到站
    stationS.forEach((ss, i) => {
      const on = s >= ss - 4;
      const was = arrived.has(i);
      if (on !== was) stations[i].classList.toggle('is-arrived', on);
      if (on && !was) {
        arrived.add(i);
        if (!silent) {
          flip(stations[i]);
          if (isSoundOn()) {
            chime(0.12);
            setTimeout(() => chime(0.1), 180);
          }
        }
      } else if (!on && was) arrived.delete(i);
      const ring = Math.abs(s - ss) < 220;
      const x = crossings[i];
      if (x && x.classList.contains('is-ringing') !== ring) x.classList.toggle('is-ringing', ring);
    });
    setLed(
      stationS.findIndex((ss) => ss > s + 4),
      p,
    );
  }

  ScrollTrigger.create({
    trigger: rw,
    start: 'top 55%',
    end: 'bottom 75%',
    onUpdate: (self) => (target = self.progress),
    onRefresh: (self) => {
      target = self.progress;
      build();
    },
  });
  // 电车跟着滚动“追”过去：带一点惯性，滚轮一格一格时也平滑
  gsap.ticker.add(() => {
    const d = target - cur;
    if (Math.abs(d) < 0.00002) return;
    cur += d * 0.16;
    update(cur, false, (Math.abs(d * 0.16) * L) / 10);
  });
  new ResizeObserver(() => build()).observe(rw);
  document.fonts.ready.then(build);

  // LED 右侧的时刻
  const clock = () => {
    const d = new Date();
    ledClock.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  clock();
  setInterval(clock, 15000);
}
