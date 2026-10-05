/* 第4話：铁轨时间线
 * 弯曲的轨道 + 跟着滚动行驶的三节电车 + 电线杆 + 道口闪灯 + 到站翻牌 + 车内 LED「次は」 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from './content.js';
import { chime } from './fx/sound.js';
import { scrollState } from './anim.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const CAR_GAP = 74;

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
  const paths = $$('.tp', svg);
  const trail = $('.trail', svg);
  const ref = $('.ballast', svg); // 几何计算用不带 pathLength 的那条
  const cars = [0, 1, 2].map((k) => $(`.car.c${k}`, svg));
  const sparks = $$('.sparks circle', svg);
  const polesG = $('.poles', svg);
  const crossG = $('.crossings', svg);
  const stations = $$('.station', rw);
  const led = $('.led-text', rw);
  const ledClock = $('.led-clock', rw);
  const story = site.story;

  let L = 1;
  let stationS = [];
  let crossings = [];
  let progress = 0;
  let arrived = new Set();
  let nextIdx = -1;

  function build() {
    const W = rw.clientWidth;
    const H = rw.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
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

    // 每个站在路径上的位置
    stationS = ys.map((y) => {
      let lo = 0,
        hi = L;
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (ref.getPointAtLength(mid).y < y) lo = mid;
        else hi = mid;
      }
      return lo;
    });

    // 电线杆（沿轨道两侧）+ 架线
    polesG.innerHTML = '';
    for (let s = 120, k = 0; s < L - 40; s += mobile ? 200 : 240, k++) {
      const p = ref.getPointAtLength(s);
      const q = ref.getPointAtLength(Math.min(L, s + 1));
      const a = Math.atan2(q.y - p.y, q.x - p.x);
      const side = k % 2 ? 1 : -1;
      const off = 34;
      const x = p.x + Math.cos(a + Math.PI / 2) * off * side;
      const y = p.y + Math.sin(a + Math.PI / 2) * off * side;
      const deg = (a * 180) / Math.PI;
      polesG.insertAdjacentHTML(
        'beforeend',
        `<g class="pole" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})">
          <ellipse class="pole-shadow" cx="14" cy="9" rx="16" ry="4"/>
          <rect class="pole-arm" x="-2" y="${side > 0 ? -38 : 2}" width="4" height="36"/>
          <circle class="pole-top" r="5.5"/>
        </g>`,
      );
    }
    const wire = [];
    for (let s = 0; s <= L; s += 40) {
      const p = ref.getPointAtLength(s);
      wire.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    polesG.insertAdjacentHTML('afterbegin', `<polyline class="overhead" points="${wire.join(' ')}"/>`);

    // 道口（每站一个，放在站牌的反方向）
    crossG.innerHTML = '';
    crossings = stationS.map((s, i) => {
      const p = ref.getPointAtLength(s);
      const q = ref.getPointAtLength(Math.min(L, s + 1));
      const a = Math.atan2(q.y - p.y, q.x - p.x);
      const side = stations[i].classList.contains('left') ? 1 : -1;
      const off = mobile ? 0 : 58;
      const x = p.x + Math.cos(a - Math.PI / 2) * off * side * -1;
      const y = p.y + Math.sin(a - Math.PI / 2) * off * side * -1;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'crossing');
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      g.innerHTML = `
        <circle class="lamp-glow a" cx="-9" cy="0" r="16" fill="url(#lampGlow)"/>
        <circle class="lamp-glow b" cx="9" cy="0" r="16" fill="url(#lampGlow)"/>
        <g class="xbuck"><rect x="-14" y="-2.5" width="28" height="5" transform="rotate(35)"/><rect x="-14" y="-2.5" width="28" height="5" transform="rotate(-35)"/></g>
        <circle class="lamp a" cx="-9" cy="0" r="4"/><circle class="lamp b" cx="9" cy="0" r="4"/>`;
      if (!mobile) crossG.appendChild(g);
      return g;
    });
    update(progress, true);
  }

  function place(car, s) {
    if (s < 0) {
      car.style.opacity = '0';
      return null;
    }
    const p = ref.getPointAtLength(s);
    // 在终点附近改用后方的点算朝向，避免零长度向量
    const a = ref.getPointAtLength(Math.max(0, Math.min(s, L - 2)));
    const b = ref.getPointAtLength(Math.min(L, Math.max(s, 0) + 2) > L - 0.01 ? L : s + 2);
    const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI - 90;
    car.style.opacity = '1';
    car.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${deg.toFixed(1)})`);
    return p;
  }

  function flip(el) {
    const flaps = $$('.flap', el);
    flaps.forEach((f, i) => {
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

  function setLed(i) {
    if (i === nextIdx) return;
    nextIdx = i;
    const st = story[i];
    const last = story[story.length - 1];
    led.textContent =
      i < 0
        ? `終点 ${last.station}（${last.romaji}）です。ご乗車ありがとうございました。　　`
        : `${st.station}　${st.romaji}　${st.year}　──　${st.text}　　`;
    led.parentElement.parentElement.classList.toggle('is-end', i < 0);
    $('.led-head', rw).textContent = i < 0 ? '終点' : i === 0 && progress < 0.01 ? 'まもなく' : '次は';
    led.style.animation = 'none';
    void led.offsetWidth;
    led.style.animation = '';
  }

  function update(p, silent = false) {
    progress = p;
    const s = p * L;
    trail.style.strokeDashoffset = String(1 - p);
    const heads = cars.map((c, k) => place(c, s - k * CAR_GAP));
    // 速度：电火花 + 风线
    const v = Math.min(1, Math.abs(scrollState.velocity) / 30);
    rw.style.setProperty('--speed', v.toFixed(3));
    if (heads[0] && v > 0.25) {
      sparks.forEach((c) => {
        c.setAttribute('cx', (Math.random() * 16 - 8).toFixed(1));
        c.setAttribute('cy', (Math.random() * 10 + 8).toFixed(1));
        c.style.opacity = Math.random() < v ? '1' : '0';
      });
    } else sparks.forEach((c) => (c.style.opacity = '0'));

    // 到站
    stationS.forEach((ss, i) => {
      const on = s >= ss - 4;
      const was = arrived.has(i);
      stations[i].classList.toggle('is-arrived', on);
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
      if (crossings[i]) crossings[i].classList.toggle('is-ringing', Math.abs(s - ss) < 220);
    });
    const ni = stationS.findIndex((ss) => ss > s + 4);
    setLed(ni);
  }

  ScrollTrigger.create({
    trigger: rw,
    start: 'top 55%',
    end: 'bottom 75%',
    onUpdate: (self) => update(self.progress),
    onRefresh: () => build(),
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
