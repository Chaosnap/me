/* 夏祭り花火（奥付页）
 * 割物：菊（拖尾 + 变色 + 芯）/ 牡丹（点状、末尾闪烁）/ 冠菊（金银长垂柳 + 落下的闪粉）
 *       千輪（一发炸开后四处开小花）/ 輪（倾斜的立体圆环）/ 錦（金色、末尾噼啪爆闪）
 * 隔一阵来一轮スターマイン（连发）。
 *
 * 画法：所有火星按「颜色 × 透明度档位 × 粗细」分桶，每桶一条路径一次描边 → 几千颗也只要几百次 stroke。
 * 夜间用叠加发光（lighter），白天在纸上用饱和的「油墨色」正常叠放。 */

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

const NAMES = ['red', 'pink', 'orange', 'gold', 'yellow', 'green', 'cyan', 'blue', 'violet', 'silver', 'white'];
const C = Object.fromEntries(NAMES.map((n, i) => [n, i]));
const RGB = {
  night: {
    red: [255, 78, 96],
    pink: [255, 128, 200],
    orange: [255, 152, 60],
    gold: [255, 204, 106],
    yellow: [255, 240, 150],
    green: [110, 238, 150],
    cyan: [110, 220, 255],
    blue: [120, 146, 255],
    violet: [198, 128, 255],
    silver: [232, 242, 255],
    white: [255, 252, 240],
  },
  // 白天印在纸上：更深更饱和，没有「白」
  day: {
    red: [222, 40, 70],
    pink: [228, 70, 150],
    orange: [238, 120, 28],
    gold: [208, 146, 20],
    yellow: [222, 176, 16],
    green: [28, 160, 92],
    cyan: [20, 146, 210],
    blue: [54, 82, 218],
    violet: [142, 64, 220],
    silver: [100, 118, 150],
    white: [236, 150, 40],
  },
};
// 配色：主色 / 变色后 / 芯
const SCHEMES = [
  ['red', 'gold', 'cyan'],
  ['pink', 'violet', 'gold'],
  ['cyan', 'blue', 'pink'],
  ['gold', 'red', 'green'],
  ['green', 'cyan', 'pink'],
  ['violet', 'pink', 'silver'],
  ['orange', 'red', 'cyan'],
  ['silver', 'cyan', 'red'],
  ['blue', 'violet', 'gold'],
  ['pink', 'silver', 'green'],
  ['yellow', 'orange', 'blue'],
];

/* ---------- 型物（图案花火）：单位坐标里的折线，y 向下；每条带一个颜色角色 0/1/2 ---------- */
const arc = (cx, cy, rx, ry, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const SHAPES = {
  // 水母：伞 + 波浪伞缘 + 内部生殖腺 + 几条飘动的触手
  jelly: () => [
    [0, arc(0, -0.08, 0.78, 0.66, Math.PI, Math.PI * 2, 28)],
    [0, Array.from({ length: 17 }, (_, i) => [-0.78 + (1.56 * i) / 16, -0.08 + Math.abs(Math.sin(i * 1.6)) * 0.07])],
    [2, arc(-0.2, -0.36, 0.13, 0.11, 0, Math.PI * 2, 10)],
    [2, arc(0.2, -0.36, 0.13, 0.11, 0, Math.PI * 2, 10)],
    ...[-0.52, -0.2, 0.14, 0.46].map((x0, k) => [1, Array.from({ length: 14 }, (_, i) => [x0 + Math.sin(i * 0.7 + k * 1.3) * 0.09, -0.04 + i * 0.075])]),
  ],
  heart: () => [[0, Array.from({ length: 49 }, (_, i) => {
    const t = (i / 48) * Math.PI * 2;
    return [(16 * Math.sin(t) ** 3) / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.1];
  })]],
  star: () => [[0, Array.from({ length: 11 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 0.42 : 1;
    return [Math.cos(a) * r, Math.sin(a) * r];
  })], [2, arc(0, 0, 0.16, 0.16, 0, Math.PI * 2, 8)]],
  // ニコちゃん
  smile: () => [
    [0, arc(0, 0, 1, 1, 0, Math.PI * 2, 40)],
    [1, arc(-0.36, -0.28, 0.08, 0.16, 0, Math.PI * 2, 8)],
    [1, arc(0.36, -0.28, 0.08, 0.16, 0, Math.PI * 2, 8)],
    [2, arc(0, 0.02, 0.58, 0.52, Math.PI * 0.18, Math.PI * 0.82, 16)],
  ],
  // 金魚：身体 + 大尾巴 + 眼睛
  kingyo: () => [
    [0, arc(-0.2, 0, 0.58, 0.4, Math.PI * 0.2, Math.PI * 1.8, 30)],
    [1, [[0.3, -0.18], [0.62, -0.62], [1, -0.5], [0.8, -0.12], [0.72, 0], [0.8, 0.12], [1, 0.5], [0.62, 0.62], [0.3, 0.18]]],
    [2, arc(-0.5, -0.1, 0.06, 0.06, 0, Math.PI * 2, 6)],
    [1, [[-0.1, 0.36], [0.05, 0.62], [0.2, 0.34]]],
  ],
  // 猫
  neko: () => [
    [0, arc(0, 0.08, 0.86, 0.74, -Math.PI * 0.28, Math.PI * 1.28, 32)],
    [0, [[-0.62, -0.42], [-0.6, -0.98], [-0.18, -0.64], [0.18, -0.64], [0.6, -0.98], [0.62, -0.42]]],
    [2, arc(-0.32, -0.04, 0.09, 0.09, 0, Math.PI * 2, 7)],
    [2, arc(0.32, -0.04, 0.09, 0.09, 0, Math.PI * 2, 7)],
    [1, [[-1.15, 0.12], [-0.5, 0.2]]],
    [1, [[-1.1, 0.34], [-0.5, 0.3]]],
    [1, [[1.15, 0.12], [0.5, 0.2]]],
    [1, [[1.1, 0.34], [0.5, 0.3]]],
    [1, [[-0.12, 0.3], [0, 0.4], [0.12, 0.3]]],
  ],
};
// 水母出现得最多
const SHAPE_W = [['jelly', 0.34], ['kingyo', 0.16], ['heart', 0.13], ['star', 0.13], ['smile', 0.12], ['neko', 0.12]];
const pickShape = () => {
  let r = Math.random();
  for (const [k, w] of SHAPE_W) if ((r -= w) < 0) return k;
  return 'jelly';
};
// 图案的配色（主线 / 第二色 / 点缀）
const SHAPE_COLORS = {
  jelly: [['cyan', 'violet', 'pink'], ['silver', 'cyan', 'pink'], ['white', 'blue', 'gold']],
  heart: [['pink', 'red', 'gold'], ['red', 'pink', 'gold']],
  star: [['gold', 'yellow', 'red'], ['yellow', 'gold', 'cyan']],
  smile: [['yellow', 'red', 'orange'], ['gold', 'cyan', 'pink']],
  kingyo: [['red', 'orange', 'white'], ['orange', 'red', 'white']],
  neko: [['silver', 'gold', 'green'], ['violet', 'pink', 'gold']],
};

// 沿折线均匀取 n 个点
function sample(lines, n) {
  const segs = [];
  let total = 0;
  for (const [role, pts] of lines)
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segs.push([role, pts[i], pts[i + 1], l]);
      total += l;
    }
  const out = [];
  const step = total / n;
  let acc = step / 2;
  for (const [role, a, b, l] of segs) {
    while (acc <= l) {
      const k = acc / l;
      out.push([role, a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
      acc += step;
    }
    acc -= l;
  }
  return out;
}

const LV = 10; // 透明度档位
const NC = NAMES.length;
// 火星种类
const STAR = 0,
  DOT = 1,
  WILLOW = 2,
  GLITTER = 3,
  SPARK = 4,
  ROCKET = 5,
  POP = 6;

export function createFireworks(canvas, { onBurst } = {}) {
  const ctx = canvas.getContext('2d');
  const isNight = () => document.documentElement.dataset.theme === 'night';
  let W = 0,
    H = 0,
    base = 200,
    scale = 1,
    cap = 4800;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, W * dpr);
    canvas.height = Math.max(1, H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    base = Math.min(W, H * 1.2) * 0.2;
    scale = Math.max(0.55, Math.min(1.2, W / 1400));
    cap = W < 700 ? 1800 : 4800;
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // 预生成每个颜色 × 档位的 rgba 字符串
  const styles = {};
  for (const th of ['night', 'day']) styles[th] = NAMES.map((n) => Array.from({ length: LV }, (_, l) => `rgba(${RGB[th][n].join(',')},${((l + 1) / LV).toFixed(2)})`));
  // 闪光 / 烟 的贴图
  const sprites = new Map();
  const sprite = (th, c, kind) => {
    const key = th + c + kind;
    if (sprites.has(key)) return sprites.get(key);
    const S = 128,
      R = S / 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const x = cv.getContext('2d');
    const g = x.createRadialGradient(R, R, 0, R, R, R);
    if (kind === 'smoke') {
      const col = th === 'night' ? '150,160,200' : '120,108,128';
      g.addColorStop(0, `rgba(${col},0.5)`);
      g.addColorStop(0.5, `rgba(${col},0.22)`);
      g.addColorStop(1, `rgba(${col},0)`);
    } else {
      const [r, gg, b] = RGB[th][NAMES[c]];
      g.addColorStop(0, th === 'night' ? 'rgba(255,255,255,0.9)' : `rgba(${r},${gg},${b},0.5)`);
      g.addColorStop(0.18, `rgba(${r},${gg},${b},0.55)`);
      g.addColorStop(0.5, `rgba(${r},${gg},${b},0.16)`);
      g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    }
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    sprites.set(key, cv);
    return cv;
  };

  const ps = []; // 火星
  const flashes = [];
  const smokes = [];
  const pending = []; // 延迟执行（千輪的小花等）

  function add(x, y, vx, vy, o) {
    if (ps.length > cap * 1.15) return null;
    const p = {
      x,
      y,
      vx,
      vy,
      age: 0,
      life: o.life,
      c: o.c,
      c2: o.c2 ?? -1,
      swap: o.swap ?? 2,
      k: o.k ?? STAR,
      drag: o.drag ?? 0.975,
      g: o.g ?? 0.03,
      trail: o.trail ?? 3,
      thin: o.thin ? 1 : 0,
      strobe: o.strobe || false,
      crackle: o.crackle || false,
      hx: null,
      hy: null,
      hn: 0,
      ht: 0,
      shell: o.shell || null,
    };
    if (p.k === WILLOW) {
      p.hx = new Float32Array(9);
      p.hy = new Float32Array(9);
    }
    ps.push(p);
    return p;
  }

  // 球面上均匀取方向再投影到屏幕：边缘更密，看起来是立体的一颗球
  function sphere(x, y, n, v, o, jitter = 0.06) {
    for (let i = 0; i < n; i++) {
      const z = rand(-1, 1);
      const th = rand(0, TAU);
      const r = Math.sqrt(1 - z * z);
      const s = v * (1 + rand(-jitter, jitter));
      add(x, y, Math.cos(th) * r * s, Math.sin(th) * r * s, o);
    }
  }

  function flash(x, y, r, c, life = 0.4) {
    flashes.push({ x, y, r, c, age: 0, life });
  }
  function smoke(x, y, R) {
    for (let i = 0; i < 4; i++) {
      const a = rand(0, TAU),
        d = rand(0, R * 0.5);
      smokes.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: R * rand(0.25, 0.4), age: 0, life: rand(3, 4.5) });
    }
  }

  /* ---------------- 各种割物 ---------------- */
  function explode(x, y, sh) {
    const R = base * sh.size;
    const [c1, c2, c3] = sh.scheme.map((n) => C[n]);
    const n = (k) => Math.round(k * scale * sh.size);
    switch (sh.type) {
      case 'kiku': {
        const d = 0.975;
        sphere(x, y, n(230), R * (1 - d), { life: rand(1.5, 1.9), c: c1, c2, swap: rand(0.42, 0.58), drag: d, trail: 3.8 });
        sphere(x, y, n(70), R * 0.42 * (1 - d), { life: 1.2, c: c3, drag: d, trail: 2, thin: true }); // 芯
        break;
      }
      case 'botan': {
        const d = 0.972;
        sphere(x, y, n(190), R * (1 - d), { k: DOT, life: rand(1.2, 1.5), c: c1, c2: Math.random() < 0.5 ? c2 : -1, swap: 0.6, drag: d, trail: 1.1, strobe: Math.random() < 0.5 });
        break;
      }
      case 'kamuro': {
        const d = 0.962;
        const gold = Math.random() < 0.7 ? C.gold : C.silver;
        sphere(x, y, n(150), R * 1.05 * (1 - d), { k: WILLOW, life: rand(2.8, 3.6), c: gold, drag: d, g: 0.02, thin: true }, 0.1);
        break;
      }
      case 'senrin': {
        const d = 0.97;
        sphere(x, y, n(40), R * 0.7 * (1 - d), { k: DOT, life: 0.8, c: C.gold, drag: d, trail: 1.5, thin: true });
        const m = Math.round(rand(12, 18) * Math.min(1, scale + 0.2));
        for (let i = 0; i < m; i++) {
          const a = rand(0, TAU),
            r = rand(0.25, 0.85) * R;
          const sx = x + Math.cos(a) * r,
            sy = y + Math.sin(a) * r;
          const c = pick([c1, c2, c3, C.white]);
          pending.push({
            at: rand(0.45, 1.1),
            fn: () => {
              sphere(sx, sy, n(20), R * 0.22 * 0.04, { k: DOT, life: rand(0.6, 0.85), c, drag: 0.96, trail: 1.3, thin: true });
              flash(sx, sy, R * 0.35, c, 0.25);
              onBurst && onBurst(0.25, false);
            },
          });
        }
        break;
      }
      case 'ring': {
        const d = 0.975;
        // 圆环绕两个轴随机倾斜，再投影
        const tx = rand(-1.2, 1.2),
          ty = rand(-0.8, 0.8);
        const m = n(110);
        const v = R * (1 - d);
        for (let i = 0; i < m; i++) {
          const a = (i / m) * TAU;
          let px = Math.cos(a),
            py = Math.sin(a),
            pz = 0;
          // 绕 x 轴
          [py, pz] = [py * Math.cos(tx) - pz * Math.sin(tx), py * Math.sin(tx) + pz * Math.cos(tx)];
          // 绕 y 轴
          [px, pz] = [px * Math.cos(ty) + pz * Math.sin(ty), -px * Math.sin(ty) + pz * Math.cos(ty)];
          add(x, y, px * v, py * v, { life: rand(1.4, 1.7), c: c1, c2, swap: 0.55, drag: d, trail: 2.6 });
        }
        sphere(x, y, n(30), v * 0.35, { k: DOT, life: 1, c: c3, drag: d, trail: 1.2, thin: true });
        break;
      }
      case 'kata': {
        // 型物：每颗星的初速度正比于它在图案上的位置 → 炸开后整个图案等比放大，轮廓一直保持
        const name = sh.shape || pickShape();
        const cols = pick(SHAPE_COLORS[name]).map((n) => C[n]);
        const d = 0.968;
        const v = R * 0.95 * (1 - d);
        const rot = rand(-0.35, 0.35);
        const squash = Math.cos(rand(0, 0.7)) * (Math.random() < 0.5 ? -1 : 1); // 立体感：像从侧面看
        const cr = Math.cos(rot),
          sr = Math.sin(rot);
        for (const [role, px, py] of sample(SHAPES[name](), n(240))) {
          const ux = px * squash,
            uy = py;
          const vx = (ux * cr - uy * sr) * v,
            vy = (ux * sr + uy * cr) * v;
          add(x, y, vx, vy, { life: rand(1.8, 2.2), c: cols[role], c2: Math.random() < 0.3 ? C.white : -1, swap: 0.8, drag: d, g: 0.012, trail: 1.4, strobe: role === 2 });
        }
        flash(x, y, R * 0.8, cols[0], 0.35);
        smoke(x, y, R * 0.8);
        onBurst && onBurst(sh.size * 0.9, false);
        return;
      }
      case 'nishiki': {
        const d = 0.97;
        sphere(x, y, n(200), R * (1 - d), { life: rand(1.6, 2), c: C.gold, drag: d, trail: 3.2, crackle: true });
        break;
      }
    }
    flash(x, y, R * 1.3, c1, 0.45);
    smoke(x, y, R);
    onBurst && onBurst(sh.size, sh.type === 'nishiki' || sh.type === 'senrin');
  }

  function launch(sh) {
    const x = W * sh.x;
    const ty = H * sh.y;
    const g = 0.12;
    const v = Math.sqrt(2 * g * Math.max(60, H + 10 - ty));
    const r = add(x, H + 10, rand(-0.4, 0.4), -v, { k: ROCKET, life: 9, c: C.gold, drag: 1, g, trail: 4, thin: true, shell: sh });
    if (r) r.wob = rand(0, TAU);
  }

  const TYPES = [
    ['kiku', 0.27],
    ['botan', 0.16],
    ['kamuro', 0.14],
    ['senrin', 0.1],
    ['ring', 0.03],
    ['nishiki', 0.11],
    ['kata', 0.19],
  ];
  const randType = () => {
    let r = Math.random();
    for (const [t, w] of TYPES) if ((r -= w) < 0) return t;
    return 'kiku';
  };
  const shell = (o = {}) => ({
    shape: o.shape,
    type: o.type || randType(),
    scheme: pick(SCHEMES),
    size: o.size ?? rand(0.75, 1.25),
    x: o.x ?? rand(0.1, 0.9),
    y: o.y ?? rand(0.1, 0.55),
  });

  /* ---------------- 节目单 ---------------- */
  let playing = false;
  let nextAt = 0;
  let salvoAt = 0;
  let clock = 0;
  const queue = []; // { at, sh }
  function program() {
    if (clock < nextAt) return;
    if (ps.length > cap * 0.8) {
      nextAt = clock + 0.3; // 太满了，等一等
      return;
    }
    if (clock > salvoAt) {
      // スターマイン：一串连发，最后几发冠菊收尾
      const m = Math.round(rand(14, 22) * Math.min(1, scale + 0.25));
      for (let i = 0; i < m; i++) queue.push({ at: clock + i * rand(0.08, 0.16), sh: shell({ type: pick(['kiku', 'botan', 'botan', 'nishiki']), size: rand(0.55, 0.9), x: 0.12 + 0.76 * (i % 2 ? i / (m - 1) : 1 - i / (m - 1)) + rand(-0.05, 0.05), y: rand(0.12, 0.5) }) });
      const end = clock + m * 0.12 + 0.3;
      for (let i = 0; i < 5; i++) queue.push({ at: end + i * 0.1, sh: shell({ type: 'kamuro', size: rand(1, 1.3), x: 0.12 + i * 0.19, y: rand(0.08, 0.2) }) });
      salvoAt = clock + rand(10, 14);
      nextAt = end + 2.6;
      return;
    }
    if (Math.random() < 0.16) {
      // 同一个图案三连发（比如三只水母并排）
      const shape = pickShape();
      [0.24, 0.5, 0.76].forEach((x, i) => queue.push({ at: clock + i * 0.18, sh: shell({ type: 'kata', shape, x: x + rand(-0.04, 0.04), y: rand(0.16, 0.36), size: rand(0.7, 0.9) }) }));
      nextAt = clock + rand(1.8, 2.4);
      return;
    }
    const k = Math.random() < 0.45 ? Math.round(rand(2, 4)) : 1;
    for (let i = 0; i < k; i++) queue.push({ at: clock + i * rand(0.05, 0.25), sh: shell() });
    nextAt = clock + rand(0.35, 0.9);
  }

  /* ---------------- 主循环 ---------------- */
  const buckets = Array.from({ length: 2 * NC * LV }, () => []);
  let running = false;
  let last = 0;
  let cost = 0;
  const push = (thin, c, a, x1, y1, x2, y2) => {
    if (a < 0.04) return;
    const l = Math.min(LV - 1, Math.max(0, Math.round(a * LV) - 1));
    const b = buckets[(thin * NC + c) * LV + l];
    b.push(x1, y1, x2, y2);
  };

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    tick(dt);
    if (playing || ps.length || flashes.length || smokes.length || queue.length || pending.length) requestAnimationFrame(frame);
    else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function tick(dt) {
    const t0 = performance.now();
    const f = dt * 60;
    clock += dt;
    if (playing) program();
    for (let i = queue.length - 1; i >= 0; i--)
      if (queue[i].at <= clock) {
        launch(queue[i].sh);
        queue.splice(i, 1);
      }
    for (let i = pending.length - 1; i >= 0; i--) {
      pending[i].at -= dt;
      if (pending[i].at <= 0) {
        pending[i].fn();
        pending.splice(i, 1);
      }
    }

    const night = isNight();
    const th = night ? 'night' : 'day';
    ctx.clearRect(0, 0, W, H);

    // 烟（白天看得见、夜里被照亮一点点）
    ctx.globalCompositeOperation = 'source-over';
    const sm = sprite(th, 0, 'smoke');
    for (let i = smokes.length - 1; i >= 0; i--) {
      const s = smokes[i];
      s.age += dt;
      if (s.age > s.life) {
        smokes.splice(i, 1);
        continue;
      }
      const k = s.age / s.life;
      s.x += 0.12 * f;
      s.y -= 0.05 * f;
      const r = s.r * (1 + k * 1.2);
      ctx.globalAlpha = (night ? 0.05 : 0.09) * Math.sin(Math.PI * Math.min(1, k * 1.4 + 0.05));
      ctx.drawImage(sm, s.x - r, s.y - r, r * 2, r * 2);
    }

    // 闪光 + 把夜空照亮一下
    ctx.globalCompositeOperation = night ? 'lighter' : 'source-over';
    for (let i = flashes.length - 1; i >= 0; i--) {
      const fl = flashes[i];
      fl.age += dt;
      if (fl.age > fl.life) {
        flashes.splice(i, 1);
        continue;
      }
      const k = 1 - fl.age / fl.life;
      const sp = sprite(th, fl.c, 'flash');
      ctx.globalAlpha = (night ? 0.75 : 0.3) * k * k;
      ctx.drawImage(sp, fl.x - fl.r, fl.y - fl.r, fl.r * 2, fl.r * 2);
      if (night) {
        const R = fl.r * 3.2;
        ctx.globalAlpha = 0.14 * k;
        ctx.drawImage(sp, fl.x - R, fl.y - R, R * 2, R * 2);
      }
    }

    // 火星物理 + 分桶
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.age += dt;
      const fr = p.age / p.life;
      if (fr >= 1) {
        if (p.crackle) {
          for (let k = 0; k < 2; k++) add(p.x + rand(-4, 4), p.y + rand(-4, 4), 0, 0, { k: POP, life: rand(0.08, 0.16), c: C.white, drag: 1, g: 0 });
        }
        ps.splice(i, 1);
        continue;
      }
      const dr = p.drag === 1 ? 1 : Math.pow(p.drag, f);
      p.vx = p.vx * dr + 0.004 * f; // 一点点风
      p.vy = p.vy * dr + p.g * f;
      if (p.k === ROCKET) {
        p.wob += dt * 14;
        p.x += (p.vx + Math.sin(p.wob) * 0.25) * f;
        p.y += p.vy * f;
        // 拖着一串金色小火花往上爬
        if (Math.random() < 0.8 * f) add(p.x, p.y + 4, rand(-0.5, 0.5), rand(0.3, 1.2), { k: SPARK, life: rand(0.3, 0.6), c: C.gold, drag: 0.93, g: 0.02, trail: 1.5, thin: true });
        if (p.vy > -0.6) {
          explode(p.x, p.y, p.shell);
          ps.splice(i, 1);
          continue;
        }
        push(0, night ? C.white : C.gold, 1, p.x - p.vx * 3, p.y - p.vy * 3, p.x, p.y);
        continue;
      }
      p.x += p.vx * f;
      p.y += p.vy * f;

      // 透明度：出生很亮，慢慢暗下去
      let a = fr < 0.08 ? 1 : Math.pow(1 - (fr - 0.08) / 0.92, 1.3);
      if (p.strobe && fr > 0.55) a *= Math.random() < 0.45 ? 1 : 0.12;
      if (p.k === GLITTER || p.k === POP) a *= Math.random() < 0.6 ? 1 : 0.2;
      // 颜色：刚炸开时偏白热，之后变成本色，到点再变色
      let c = fr > p.swap && p.c2 >= 0 ? p.c2 : p.c;
      if (fr < 0.07 && p.k !== WILLOW && p.k !== SPARK) c = C.white;

      if (p.k === WILLOW) {
        // 冠菊：记下走过的路，拖出长长的下垂尾巴，并且一路掉闪粉
        p.ht += f;
        if (p.ht >= 2.5) {
          p.ht = 0;
          for (let k = Math.min(8, p.hn); k > 0; k--) {
            p.hx[k] = p.hx[k - 1];
            p.hy[k] = p.hy[k - 1];
          }
          p.hx[0] = p.x;
          p.hy[0] = p.y;
          p.hn = Math.min(9, p.hn + 1);
        }
        let px = p.x,
          py = p.y;
        for (let k = 0; k < p.hn; k++) {
          push(1, c, a * (1 - k / 9) * 0.85, p.hx[k], p.hy[k], px, py);
          px = p.hx[k];
          py = p.hy[k];
        }
        if (Math.random() < 0.12 * f) add(p.x, p.y, rand(-0.2, 0.2), rand(0, 0.4), { k: GLITTER, life: rand(0.3, 0.7), c: night ? C.white : C.gold, drag: 0.95, g: 0.03, trail: 0.4, thin: true });
        continue;
      }
      push(p.thin, c, a, p.x - p.vx * p.trail, p.y - p.vy * p.trail, p.x, p.y);
    }

    // 两遍：外层柔光（粗、淡）+ 内层亮芯（细）
    ctx.globalCompositeOperation = night ? 'lighter' : 'source-over';
    ctx.lineCap = 'round';
    const S = styles[th];
    for (const pass of [0, 1]) {
      ctx.globalAlpha = pass ? 1 : night ? 0.28 : 0.18;
      for (let thin = 0; thin < 2; thin++) {
        ctx.lineWidth = pass ? (thin ? 1.3 : 2) : thin ? 3.6 : 5.4;
        for (let c = 0; c < NC; c++)
          for (let l = 0; l < LV; l++) {
            const b = buckets[(thin * NC + c) * LV + l];
            if (!b.length) continue;
            ctx.strokeStyle = S[c][l];
            ctx.beginPath();
            for (let j = 0; j < b.length; j += 4) {
              ctx.moveTo(b[j], b[j + 1]);
              ctx.lineTo(b[j + 2], b[j + 3]);
            }
            ctx.stroke();
          }
      }
    }
    for (const b of buckets) b.length = 0;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    cost += (performance.now() - t0 - cost) * 0.1;
    // 很卡就少放一点
    if (cost > 9) cap = Math.max(1200, cap * 0.97);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  return {
    play() {
      if (playing) return;
      playing = true;
      resize();
      // 开场：三发齐放
      salvoAt = clock + rand(7, 10);
      nextAt = clock + 1.4;
      // 开场：中间一发大菊，两边各一只水母
      [0.25, 0.5, 0.75].forEach((x, i) => queue.push({ at: clock + i * 0.08, sh: shell(i === 1 ? { type: 'kiku', x, y: 0.22, size: 1.25 } : { type: 'kata', shape: 'jelly', x, y: rand(0.2, 0.3), size: 0.9 }) }));
      start();
    },
    stop() {
      playing = false;
      queue.length = 0;
    },
    perf: () => ({ cost, n: ps.length, cap }),
    // 调试用：指定发一发
    _fire(o) {
      queue.push({ at: clock, sh: shell(o) });
      start();
    },
    _advance(sec) {
      for (let k = 0; k < sec * 60; k++) tick(1 / 60);
    },
  };
}
