/* 开场 loader 的镜头光斑（bokeh）
 * 三层景深：远处的大片柔光 / 中景的焦外光斑（平底 + 亮边 + 轻微色差 + 洋葱圈）/ 近处闪烁的微尘
 * 开场有一次「对焦」：光斑先略大略虚，再收紧到位；鼠标移动时按景深做一点视差。
 * 所有光斑都预先画成贴图，每帧只是 drawImage，几十个也很便宜。 */

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 夏夜 / 水下的色调：青为主，少量琥珀和蓝紫
const COLORS = {
  teal: [86, 200, 206],
  aqua: [150, 226, 236],
  ice: [196, 232, 255],
  amber: [255, 178, 120],
  violet: [150, 140, 238],
};

function sprite(kind, rgb) {
  const S = kind === 'speck' ? 48 : 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const R = S / 2;
  const col = (a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
  if (kind === 'glow') {
    const g = x.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, col(0.5));
    g.addColorStop(0.35, col(0.28));
    g.addColorStop(0.7, col(0.08));
    g.addColorStop(1, col(0));
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
  } else if (kind === 'disc') {
    const r = R * 0.9;
    x.filter = 'blur(5px)';
    // 平底 + 边缘稍亮（焦外光斑的特征），边缘是柔的，不是一圈硬线
    const g = x.createRadialGradient(R, R, 0, R, R, r);
    g.addColorStop(0, col(0.2));
    g.addColorStop(0.6, col(0.24));
    g.addColorStop(0.86, col(0.32));
    g.addColorStop(0.95, col(0.4));
    g.addColorStop(1, col(0));
    x.fillStyle = g;
    x.beginPath();
    x.arc(R, R, r, 0, Math.PI * 2);
    x.fill();
    // 洋葱圈：很淡的同心纹
    x.lineWidth = 1.2;
    for (const k of [0.32, 0.52, 0.7]) {
      x.strokeStyle = col(0.06);
      x.beginPath();
      x.arc(R, R, r * k, 0, Math.PI * 2);
      x.stroke();
    }
    // 色差：边缘一侧偏暖、另一侧偏冷
    x.lineWidth = 4;
    x.strokeStyle = 'rgba(255,150,170,0.14)';
    x.beginPath();
    x.arc(R + 1.8, R, r * 0.95, -1.2, 1.2);
    x.stroke();
    x.strokeStyle = 'rgba(120,190,255,0.16)';
    x.beginPath();
    x.arc(R - 1.8, R, r * 0.95, Math.PI - 1.2, Math.PI + 1.2);
    x.stroke();
  } else {
    const g = x.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.12, col(0.9));
    g.addColorStop(0.35, col(0.25));
    g.addColorStop(1, col(0));
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
  }
  return c;
}

export function initLoaderBokeh(canvas, { still = false } = {}) {
  if (!canvas) return { stop() {} };
  const ctx = canvas.getContext('2d');
  const cache = new Map();
  const tex = (kind, name) => {
    const key = kind + name;
    if (!cache.has(key)) cache.set(key, sprite(kind, COLORS[name]));
    return cache.get(key);
  };

  let W = 0,
    H = 0,
    M = 0;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth;
    H = innerHeight;
    M = Math.min(W, H);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  const items = [];
  // 远：大片柔光（位置大致沿用原来的构图：左上青、右上琥珀、右下蓝紫）
  [
    [0.36, 0.33, 0.3, 'teal', 0.9],
    [0.44, 0.45, 0.15, 'aqua', 0.7],
    [0.8, 0.24, 0.2, 'amber', 0.55],
    [0.72, 0.66, 0.38, 'violet', 0.42],
    [0.22, 0.68, 0.1, 'teal', 0.7],
    [0.56, 0.8, 0.13, 'teal', 0.6],
    [0.12, 0.2, 0.22, 'violet', 0.25],
  ].forEach(([x, y, r, c, a]) => items.push({ kind: 'glow', c, x, y, r, a, z: 0.2, sp: rand(0.004, 0.01), ph: rand(0, 6.28) }));
  // 中：焦外光斑
  for (let i = 0; i < 17; i++) {
    // 让开中间那一列竖排字
    let x = rand(0.04, 0.84);
    if (x > 0.4) x += 0.12;
    items.push({
      kind: 'disc',
      c: pick(['teal', 'teal', 'aqua', 'ice', 'ice', 'amber', 'violet']),
      x,
      y: rand(0.05, 1.05),
      r: rand(0.018, 0.075),
      a: rand(0.35, 0.85),
      z: rand(0.45, 0.8),
      sp: rand(0.006, 0.018),
      ph: rand(0, 6.28),
    });
  }
  // 近：闪烁的微尘
  for (let i = 0; i < 46; i++) {
    items.push({ kind: 'speck', c: pick(['ice', 'aqua', 'amber']), x: rand(0, 1), y: rand(0, 1.05), r: rand(0.004, 0.011), a: rand(0.4, 1), z: rand(0.9, 1.3), sp: rand(0.01, 0.03), ph: rand(0, 6.28), tw: rand(1.5, 4) });
  }
  // 远的先画
  items.sort((a, b) => a.z - b.z);

  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    ptr.tx = e.clientX / W - 0.5;
    ptr.ty = e.clientY / H - 0.5;
  };
  addEventListener('pointermove', onMove);

  const t0 = performance.now();
  let raf = 0;
  let stopped = false;
  function frame(now) {
    if (stopped || !canvas.isConnected) return stop();
    const t = (now - t0) / 1000;
    // 对焦：0 → 1（前 1.8 秒从虚到实）
    const focus = still ? 1 : 1 - Math.pow(1 - Math.min(1, t / 1.8), 3);
    ptr.x += (ptr.tx - ptr.x) * 0.05;
    ptr.y += (ptr.ty - ptr.y) * 0.05;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of items) {
      // 缓慢上浮 + 左右漂，出了顶部从底部回来
      const rise = still ? 0 : t * p.sp * p.z;
      let y = p.y - rise;
      y = ((y % 1.15) + 1.15) % 1.15 - 0.05;
      const x = p.x + Math.sin(t * 0.25 + p.ph) * 0.012 * p.z;
      const px = x * W - ptr.x * 40 * p.z;
      const py = y * H - ptr.y * 28 * p.z;
      let r = p.r * M;
      let a = p.a;
      if (p.kind === 'glow') {
        r *= 1 + Math.sin(t * 0.4 + p.ph) * 0.06;
        a *= 0.85 + Math.sin(t * 0.5 + p.ph) * 0.15;
      } else if (p.kind === 'disc') {
        // 对焦前更大更淡；之后轻轻「呼吸」
        r *= 1 + (1 - focus) * 0.45 + Math.sin(t * 0.7 + p.ph) * 0.04;
        a *= (0.35 + 0.65 * focus) * (0.8 + Math.sin(t * 0.9 + p.ph) * 0.2);
      } else {
        a *= focus * (0.5 + 0.5 * Math.sin(t * p.tw + p.ph)) ** 2;
      }
      if (a < 0.01) continue;
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(tex(p.kind, p.c), px - r, py - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (!still) raf = requestAnimationFrame(frame);
  }
  function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onMove);
  }
  raf = requestAnimationFrame(frame);
  return { stop };
}
