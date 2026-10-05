/* 封面的老胶片质感：划痕、灰尘、偶尔的头发丝（12fps），以及 VHS 跟踪条 */
const isNight = () => document.documentElement.dataset.theme === 'night';

export function initFilmFx(cover) {
  const canvas = cover.querySelector('.cover-scratch');
  const vhs = cover.querySelector('.cover-vhs');
  const ctx = canvas.getContext('2d');
  let W = 0,
    H = 0;
  const resize = () => {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W;
    canvas.height = H;
  };
  resize();
  new ResizeObserver(resize).observe(canvas);
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(cover);

  // 持续几帧的划痕
  let scratches = [];
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const col = isNight() ? '255,255,255' : '20,22,28';
    if (Math.random() < 0.18) scratches.push({ x: Math.random() * W, life: 2 + Math.floor(Math.random() * 6), w: Math.random() < 0.3 ? 1.6 : 0.8, a: 0.25 + Math.random() * 0.35 });
    scratches = scratches.filter((s) => s.life-- > 0);
    scratches.forEach((s) => {
      s.x += (Math.random() - 0.5) * 3;
      ctx.strokeStyle = `rgba(${col},${s.a})`;
      ctx.lineWidth = s.w;
      ctx.beginPath();
      ctx.moveTo(s.x, 0);
      ctx.bezierCurveTo(s.x + 2, H * 0.3, s.x - 2, H * 0.7, s.x + 1, H);
      ctx.stroke();
    });
    // 灰尘
    const n = Math.floor(Math.random() * 7);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `rgba(${col},${0.25 + Math.random() * 0.45})`;
      const r = Math.random() * 2.2 + 0.4;
      ctx.beginPath();
      ctx.ellipse(Math.random() * W, Math.random() * H, r, r * (0.5 + Math.random()), Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // 头发丝
    if (Math.random() < 0.04) {
      const x = Math.random() * W,
        y = Math.random() * H;
      ctx.strokeStyle = `rgba(${col},0.45)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 30, y - 20, x + 10, y + 40, x + 60, y + 30);
      ctx.stroke();
    }
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce)
    setInterval(() => {
      if (visible && !document.hidden) draw();
    }, 83);

  // VHS 跟踪条：偶尔从上往下扫过
  const sweep = () => {
    if (visible && !reduce) {
      vhs.animate(
        [
          { top: '-30px', opacity: 0 },
          { opacity: 0.9, offset: 0.1 },
          { opacity: 0.9, offset: 0.85 },
          { top: '102%', opacity: 0 },
        ],
        { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.5,0,.5,1)' },
      );
    }
    setTimeout(sweep, 6500 + Math.random() * 7000);
  };
  setTimeout(sweep, 4000);
}
