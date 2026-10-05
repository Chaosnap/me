/* 水母 ── 白蓝半透明的月水母（程序绘制）
 * 伞：菲涅尔式透明（边缘亮、中间透）+ 内伞 + 辐管 + 四叶生殖腺 + 伞缘感觉器
 * 触手 / 口腕：verlet 链条物理，会随游动自然拖曳、摆动
 * 节律：快收缩、慢舒张；远处的水母带景深模糊 */

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const isNight = () => document.documentElement.dataset.theme === 'night';

// 快收缩、慢舒张：0 → 1 → 0
function pulseCurve(p) {
  if (p < 0.28) {
    const k = p / 0.28;
    return 1 - Math.pow(1 - k, 3);
  }
  const k = (p - 0.28) / 0.72;
  return 1 - (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
}

const PALETTE = {
  glow: {
    core: 'rgba(180,220,255,0.03)',
    mid: 'rgba(170,215,255,0.09)',
    edge: 'rgba(200,232,255,0.3)',
    rimFill: 'rgba(235,248,255,0.55)',
    rim: 'rgba(240,250,255,0.85)',
    rimGlow: 'rgba(150,210,255,0.3)',
    inner: 'rgba(200,232,255,0.32)',
    canal: 'rgba(210,236,255,0.16)',
    gon: 'rgba(238,208,255,0.75)',
    gonFill: 'rgba(230,200,255,0.12)',
    tent: 'rgba(205,235,255,0.32)',
    arm: 'rgba(220,240,255,0.13)',
    armEdge: 'rgba(240,250,255,0.32)',
    eye: 'rgba(255,255,255,0.9)',
    shadow: 'rgba(120,190,255,0.7)',
  },
  day: {
    core: 'rgba(255,255,255,0.16)',
    mid: 'rgba(214,234,252,0.26)',
    edge: 'rgba(150,196,240,0.42)',
    rimFill: 'rgba(118,174,232,0.58)',
    rim: 'rgba(48,108,182,0.7)',
    rimGlow: 'rgba(255,255,255,0.65)',
    inner: 'rgba(70,130,200,0.32)',
    canal: 'rgba(70,130,200,0.18)',
    gon: 'rgba(132,100,206,0.62)',
    gonFill: 'rgba(170,140,230,0.12)',
    tent: 'rgba(66,124,194,0.36)',
    arm: 'rgba(150,192,238,0.22)',
    armEdge: 'rgba(66,124,194,0.34)',
    eye: 'rgba(40,96,170,0.8)',
    shadow: 'rgba(30,70,120,0.16)',
  },
};

/**
 * lite：简化版（封面用）——触手更少、口腕用细线、不画阴影/模糊/辐管，30fps、1x 分辨率
 */
export function createJellyLayer(canvas, { fixed = true, max = 36, interactive = false, lite = false, fps = 60, dpr: dprCap = 2 } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0,
    H = 0,
    dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, dprCap);
    W = fixed ? innerWidth : canvas.clientWidth;
    H = fixed ? innerHeight : canvas.clientHeight;
    canvas.width = Math.max(1, W * dpr);
    canvas.height = Math.max(1, H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  if (fixed) addEventListener('resize', resize);
  else new ResizeObserver(resize).observe(canvas);

  const jellies = [];
  const bubbles = [];
  const ripples = [];
  let running = false;
  let visible = true;
  let last = performance.now();
  let t = 0;
  let beat = 0; // 由背景音乐驱动（0~1）
  let ambientOn = false;
  let ambientTimer = null;
  const pointer = { x: -9999, y: -9999 };

  if (!fixed) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }
  if (interactive) {
    addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    });
  }

  function start() {
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(loop);
    }
  }

  const chain = (n, x, y) => Array.from({ length: n }, () => ({ x, y, px: x, py: y }));

  function spawn(x, y, o = {}) {
    const r = o.r ?? rand(22, 40);
    const nt = lite ? Math.round(rand(9, 13)) : Math.round(rand(30, 42));
    const j = {
      x,
      y,
      r,
      vx: o.vx ?? rand(-0.1, 0.1),
      base: o.speed ?? rand(0.18, 0.34),
      boost: o.boost ?? rand(0.7, 1.1),
      ang: o.ang ?? rand(-0.3, 0.3),
      phase: rand(0, 1),
      freq: rand(0.55, 0.85),
      life: o.age ?? 0,
      maxLife: o.life ?? rand(8, 12),
      alpha: o.alpha ?? 1,
      glow: o.glow,
      seed: rand(0, 100),
      depth: o.depth ?? 1,
      push: { x: 0, y: 0 },
      tents: Array.from({ length: nt }, (_, i) => ({ u: i / (nt - 1), len: r * rand(0.7, 1.5), pts: chain(lite ? 5 : 7, x, y) })),
      arms: Array.from({ length: lite ? 2 : 4 }, (_, k) => ({ k: lite ? k + 1 : k, len: r * rand(1.1, 1.7), pts: chain(lite ? 6 : 11, x, y) })),
    };
    jellies.push(j);
    while (jellies.length > max) jellies.shift();
    start();
  }

  function bubble(x, y, o = {}) {
    bubbles.push({ x, y, r: o.r ?? rand(1.5, 4), vy: -rand(0.4, 1.1), vx: rand(-0.2, 0.2), life: 0, max: rand(0.9, 1.8), seed: rand(0, 10) });
    if (bubbles.length > 160) bubbles.shift();
    start();
  }

  function ripple(x, y) {
    ripples.push({ x, y, life: 0 });
    start();
  }

  /** 点击：一大两小 + 一串气泡 + 波纹 */
  function burst(x, y, o = {}) {
    ripple(x, y);
    spawn(x, y, { r: rand(30, 40), ...o });
    spawn(x + rand(-56, -24), y + rand(10, 40), { r: rand(13, 19), ...o, age: 0.2 });
    spawn(x + rand(22, 58), y + rand(0, 36), { r: rand(11, 17), ...o, age: 0.35 });
    for (let i = 0; i < 9; i++) bubble(x + rand(-14, 14), y + rand(-6, 10));
  }

  /* ---------------- 物理 ---------------- */
  function step(pts, ax, ay, seg, f, k) {
    const p0 = pts[0];
    p0.x = p0.px = ax;
    p0.y = p0.py = ay;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.86;
      const vy = (p.y - p.py) * 0.86;
      p.px = p.x;
      p.py = p.y;
      p.x += vx + Math.sin(t * 1.7 + i * 0.6 + k) * 0.05 * f;
      p.y += vy + 0.045 * f;
    }
    for (let it = 0; it < 2; it++) {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1],
          b = pts[i];
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const diff = (d - seg) / d;
        b.x -= dx * diff;
        b.y -= dy * diff;
      }
    }
  }

  /* ---------------- 绘制 ---------------- */
  function smooth(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2,
        my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const lp = pts[pts.length - 1];
    ctx.lineTo(lp.x, lp.y);
  }

  function drawArm(arm, s, P, j) {
    const pts = arm.pts;
    const n = pts.length;
    const L = [],
      R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)],
        b = pts[Math.min(n - 1, i + 1)];
      let tx = b.x - a.x,
        ty = b.y - a.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const v = i / (n - 1);
      const w = j.r * s * 0.11 * Math.pow(1 - v, 0.6);
      const ruffle = 1 + 0.5 * Math.sin(i * 1.9 + t * 3 + arm.k * 1.7);
      L.push([pts[i].x - ty * w * ruffle, pts[i].y + tx * w * ruffle]);
      R.push([pts[i].x + ty * w * (2 - ruffle) * 0.7, pts[i].y - tx * w * (2 - ruffle) * 0.7]);
    }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    ctx.fillStyle = P.arm;
    ctx.fill();
    ctx.strokeStyle = P.armEdge;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  function drawJelly(j, c, env) {
    const glow = j.glow ?? isNight();
    const P = glow ? PALETTE.glow : PALETTE.day;
    const r = j.r,
      s = j.depth;
    const bw = r * (1 - 0.17 * c);
    const bh = r * (0.74 + 0.2 * c);
    const flare = (1 - c) * 0.08;
    const rimX = bw * (1 + flare);
    const rimY = r * 0.05;

    ctx.save();
    ctx.globalAlpha = env * j.alpha;
    if (!lite && s < 0.8) ctx.filter = `blur(${((0.8 - s) * 6).toFixed(1)}px)`;
    if (glow) ctx.globalCompositeOperation = 'lighter';

    // 触手 + 口腕（世界坐标）
    ctx.lineCap = 'round';
    ctx.strokeStyle = P.tent;
    ctx.lineWidth = Math.max(0.5, 0.75 * s);
    for (const tn of j.tents) {
      smooth(tn.pts);
      ctx.stroke();
    }
    if (lite) {
      ctx.strokeStyle = P.arm;
      ctx.lineWidth = j.r * s * 0.07;
      for (const arm of j.arms) {
        smooth(arm.pts);
        ctx.stroke();
      }
    } else for (const arm of j.arms) drawArm(arm, s, P, j);

    // 伞（局部坐标）
    ctx.translate(j.x, j.y);
    ctx.rotate(j.ang);
    ctx.scale(s, s);
    const dome = () => {
      ctx.moveTo(-rimX, rimY);
      ctx.bezierCurveTo(-bw * 1.03, -bh * 0.62, -bw * 0.58, -bh, 0, -bh);
      ctx.bezierCurveTo(bw * 0.58, -bh, bw * 1.03, -bh * 0.62, rimX, rimY);
    };
    ctx.beginPath();
    dome();
    ctx.quadraticCurveTo(0, -bh * 0.2, -rimX, rimY);
    ctx.closePath();
    const g = ctx.createRadialGradient(0, -bh * 0.45, r * 0.08, 0, -bh * 0.4, r * 1.08);
    g.addColorStop(0, P.core);
    g.addColorStop(0.6, P.mid);
    g.addColorStop(0.88, P.edge);
    g.addColorStop(1, P.rimFill);
    ctx.fillStyle = g;
    if (!lite) {
      ctx.shadowColor = P.shadow;
      ctx.shadowBlur = glow ? 16 + beat * 22 : 14;
      ctx.shadowOffsetY = glow ? 0 : 6;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 伞缘：外轮廓 + 柔光
    ctx.beginPath();
    dome();
    ctx.strokeStyle = P.rimGlow;
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.strokeStyle = P.rim;
    ctx.lineWidth = 1.05;
    ctx.stroke();

    // 内伞
    ctx.beginPath();
    ctx.moveTo(-bw * 0.8, rimY * 0.4);
    ctx.bezierCurveTo(-bw * 0.82, -bh * 0.5, -bw * 0.45, -bh * 0.78, 0, -bh * 0.78);
    ctx.bezierCurveTo(bw * 0.45, -bh * 0.78, bw * 0.82, -bh * 0.5, bw * 0.8, rimY * 0.4);
    ctx.strokeStyle = P.inner;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 辐管
    const cy = -bh * 0.42;
    if (!lite) {
    ctx.strokeStyle = P.canal;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const th = Math.PI * (0.06 + 0.88 * (i / 14));
      const ex = -Math.cos(th) * bw * 0.95;
      const ey = -Math.sin(th) * bh * 0.92 + rimY;
      ctx.moveTo(0, cy);
      ctx.quadraticCurveTo(ex * 0.55, cy + (ey - cy) * 0.35 - r * 0.04, ex, ey);
    }
    ctx.stroke();
    }

    // 四叶生殖腺
    for (let k = 0; k < 4; k++) {
      const a = k * (Math.PI / 2) + Math.PI / 4;
      const gx = Math.cos(a) * r * 0.17;
      const gy = cy + Math.sin(a) * r * 0.1;
      ctx.beginPath();
      ctx.ellipse(gx, gy, r * 0.11, r * 0.065, a, 0.55, TAU - 0.55);
      ctx.fillStyle = P.gonFill;
      ctx.fill();
      ctx.strokeStyle = P.gon;
      ctx.lineWidth = r * 0.03;
      ctx.stroke();
    }

    // 伞缘感觉器（8 个小点）
    ctx.fillStyle = P.eye;
    for (let k = 0; k < (lite ? 0 : 8); k++) {
      const u = (k + 0.5) / 8;
      const ex = -rimX + rimX * 2 * u;
      ctx.beginPath();
      ctx.arc(ex, rimY + Math.sin(u * Math.PI) * r * 0.02, Math.max(0.6, r * 0.018), 0, TAU);
      ctx.fill();
    }

    // 高光
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(-bw * 0.32, -bh * 0.74, bw * 0.4, bh * 0.2, -0.45, Math.PI * 1.08, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  }

  const minDt = 1000 / fps - 2;
  function loop(now) {
    if (now - last < minDt) {
      requestAnimationFrame(loop);
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    const f = dt * 60;
    ctx.clearRect(0, 0, W, H);

    for (let i = jellies.length - 1; i >= 0; i--) {
      const j = jellies[i];
      j.life += dt;
      j.phase = (j.phase + dt * j.freq) % 1;
      const c = pulseCurve(j.phase) * (1 + beat * 0.5);
      // 收缩时推进
      const sp = j.base + j.boost * c * c;
      j.ang += (Math.sin(t * 0.3 + j.seed) * 0.0014 - j.ang * 0.002) * f;
      if (interactive) {
        const dx = j.x - pointer.x,
          dy = j.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 170 * 170 && d2 > 1) {
          const d = Math.sqrt(d2);
          j.push.x += (dx / d) * 0.06 * f;
          j.push.y += (dy / d) * 0.06 * f;
        }
      }
      j.push.x *= 0.96;
      j.push.y *= 0.96;
      j.x += (Math.sin(j.ang) * sp + j.vx + j.push.x) * f;
      j.y += (-Math.cos(j.ang) * sp + j.push.y) * f;
      if (j.life > j.maxLife || j.y < -j.r * 5) {
        jellies.splice(i, 1);
        continue;
      }
      // 触手锚点 → 世界坐标
      const s = j.depth;
      const cos = Math.cos(j.ang),
        sin = Math.sin(j.ang);
      const bw = j.r * (1 - 0.17 * c);
      const bh = j.r * (0.74 + 0.2 * c);
      const rimX = bw * (1 + (1 - c) * 0.08);
      const toWorld = (lx, ly) => [j.x + (lx * cos - ly * sin) * s, j.y + (lx * sin + ly * cos) * s];
      for (const tn of j.tents) {
        const [ax, ay] = toWorld(-rimX * 0.97 + rimX * 1.94 * tn.u, j.r * 0.05);
        step(tn.pts, ax, ay, (tn.len * s) / (tn.pts.length - 1), f, tn.u * 9 + j.seed);
      }
      for (const arm of j.arms) {
        const [ax, ay] = toWorld((arm.k - 1.5) * j.r * 0.07, -bh * 0.14);
        step(arm.pts, ax, ay, (arm.len * s) / (arm.pts.length - 1), f, arm.k * 2 + j.seed);
      }
      const env = Math.max(0, Math.min(1, j.life / 0.9) * Math.min(1, (j.maxLife - j.life) / 1.6));
      drawJelly(j, c, env);
    }

    // 气泡
    const night = isNight();
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.life += dt;
      if (b.life > b.max) {
        bubbles.splice(i, 1);
        continue;
      }
      b.x += (b.vx + Math.sin(b.life * 6 + b.seed) * 0.25) * f;
      b.y += b.vy * f;
      const a = Math.min(1, b.life * 6) * (1 - b.life / b.max);
      ctx.globalAlpha = a;
      ctx.lineWidth = 1;
      ctx.strokeStyle = night ? 'rgba(220,240,255,0.85)' : 'rgba(70,130,200,0.7)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,170,220,0.6)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.82, 0.3, 1.4);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, TAU);
      ctx.fill();
    }
    // 波纹
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.life += dt;
      if (r.life > 0.9) {
        ripples.splice(i, 1);
        continue;
      }
      const k = r.life / 0.9;
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = night ? 'rgba(200,232,255,1)' : 'rgba(70,130,200,0.9)';
      ctx.lineWidth = 1.5 * (1 - k) + 0.3;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, 8 + k * 70, (8 + k * 70) * 0.55, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if ((jellies.length || bubbles.length || ripples.length || ambientOn) && (visible || fixed)) requestAnimationFrame(loop);
    else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  /* 持续漂浮：在区域底部不断生成 */
  function ambient(on, o = {}) {
    clearTimeout(ambientTimer);
    ambientOn = on;
    if (!on) return;
    const { count = 6, area = () => ({ x: 0, y: 0, w: W, h: H }), make = {} } = o;
    if (o.prefill) {
      const a = area();
      for (let i = 0; i < count; i++) {
        const life = rand(16, 24);
        spawn(a.x + rand(0.05, 0.95) * a.w, a.y + rand(0.15, 1) * a.h, { life, age: rand(1, life * 0.5), ...rnd(make) });
      }
    }
    const tick = () => {
      if (!ambientOn) return;
      const a = area();
      if (visible && jellies.length < count) {
        const life = rand(16, 24);
        spawn(a.x + rand(0.05, 0.95) * a.w, a.y + a.h + 60, { life, ...rnd(make) });
      }
      ambientTimer = setTimeout(tick, rand(900, 2200));
    };
    tick();
    start();
  }
  const rnd = (make) => Object.fromEntries(Object.entries(make).map(([k, v]) => [k, typeof v === 'function' ? v() : v]));

  return {
    spawn,
    burst,
    bubble,
    ripple,
    ambient,
    setBeat: (v) => (beat = v),
    size: () => ({ W, H }),
  };
}
