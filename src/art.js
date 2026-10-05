/* 程序生成的漫画线稿 / 装饰 SVG —— 全部原创绘制，不使用任何 MV 素材 */

export function rng(seed = 1) {
  let a = typeof seed === 'string' ? [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) : seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 100) / 100;

/* ---------- 集中線 (manga focus lines) ---------- */
export function speedLines({ count = 150, inner = 0.34, seed = 3, cls = '' } = {}) {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + r() * 0.04;
    const w = 0.004 + r() * 0.018;
    const R = 90;
    const ri = 50 * inner * (1 + r() * 0.55);
    d += `M${f(Math.cos(a - w) * R)} ${f(Math.sin(a - w) * R)}L${f(Math.cos(a) * ri)} ${f(Math.sin(a) * ri)}L${f(Math.cos(a + w) * R)} ${f(Math.sin(a + w) * R)}Z`;
  }
  return `<svg class="speedlines ${cls}" viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="${d}" fill="currentColor"/></svg>`;
}

/* ---------- 電柱と電線 ---------- */
export function poleScene() {
  const ink = 'var(--ink)';
  const pole = (x, s, top = -40) => {
    const w = 24 * s;
    const arm1 = 150 * s,
      arm2 = 240 * s;
    const ins = [];
    const insulators = (y, half) =>
      [-1, -0.45, 0.45, 1].map((k) => {
        const ix = x + k * half;
        ins.push([ix, y - 14 * s]);
        return `<rect x="${f(ix - 4 * s)}" y="${f(y - 16 * s)}" width="${f(8 * s)}" height="${f(14 * s)}" rx="${f(3 * s)}"/>`;
      }).join('');
    const steps = Array.from({ length: 10 }, (_, i) => {
      const y = 420 * s + i * 52 * s + top;
      const dir = i % 2 ? 1 : -1;
      return `<rect x="${f(dir > 0 ? x + w / 2 : x - w / 2 - 16 * s)}" y="${f(y)}" width="${f(16 * s)}" height="${f(4 * s)}"/>`;
    }).join('');
    const svg = `
      <g fill="${ink}">
        <path d="M${f(x - w / 2)} 1000 L${f(x - w * 0.38)} ${top} L${f(x + w * 0.38)} ${top} L${f(x + w / 2)} 1000Z"/>
        <rect x="${f(x - arm2 / 2)}" y="${f(arm1 + top)}" width="${f(arm2)}" height="${f(10 * s)}"/>
        <rect x="${f(x - arm1 / 2)}" y="${f(arm1 + 90 * s + top)}" width="${f(arm1)}" height="${f(9 * s)}"/>
        <path d="M${f(x - arm2 / 2 + 20 * s)} ${f(arm1 + 10 * s + top)} L${f(x)} ${f(arm1 + 60 * s + top)} L${f(x + arm2 / 2 - 20 * s)} ${f(arm1 + 10 * s + top)}" stroke="${ink}" stroke-width="${f(3 * s)}" fill="none"/>
        ${insulators(arm1 + top, arm2 / 2 - 14 * s)}
        ${insulators(arm1 + 90 * s + top, arm1 / 2 - 10 * s)}
        <rect x="${f(x + w * 0.5)}" y="${f(300 * s + top)}" width="${f(46 * s)}" height="${f(84 * s)}" rx="${f(8 * s)}"/>
        <rect x="${f(x + w * 0.5 - 3 * s)}" y="${f(312 * s + top)}" width="${f(52 * s)}" height="${f(5 * s)}"/>
        <rect x="${f(x + w * 0.5 - 3 * s)}" y="${f(364 * s + top)}" width="${f(52 * s)}" height="${f(5 * s)}"/>
        ${steps}
      </g>`;
    return { svg, ins };
  };

  const big = pole(1210, 1.15, -60);
  const far = pole(250, 0.42, 250);
  // 電線（悬链线）
  let wires = '';
  big.ins.forEach(([x, y], i) => {
    const [fx, fy] = far.ins[i];
    const sag = 60 + i * 8;
    wires += `<path d="M${f(x)} ${f(y)} Q${f((x + fx) / 2)} ${f((y + fy) / 2 + sag)} ${f(fx)} ${f(fy)}"/>`;
    wires += `<path d="M${f(x)} ${f(y)} Q${f(x + 260)} ${f(y + 40 + i * 6)} ${f(1700)} ${f(y - 30 + i * 22)}"/>`;
    wires += `<path d="M${f(fx)} ${f(fy)} Q${f(fx - 160)} ${f(fy + 30)} ${f(-120)} ${f(fy + 10 + i * 9)}"/>`;
  });
  // 電柱の看板
  const sign = `
    <g class="sign" transform="translate(1186 520)">
      <rect width="48" height="150" fill="var(--paper)" stroke="${ink}" stroke-width="3"/>
      <text x="24" y="28" font-size="22" text-anchor="middle" fill="${ink}" font-family="var(--f-mincho)" writing-mode="tb">夏ノ町</text>
      <rect y="100" width="48" height="50" fill="${ink}"/>
      <text x="24" y="134" font-size="20" text-anchor="middle" fill="var(--paper)" font-family="var(--f-mono)">12</text>
    </g>`;
  return `
  <svg class="pole-scene" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <g class="far" opacity=".55">${far.svg}</g>
    <g class="wires" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round">${wires}</g>
    <g class="near">${big.svg}${sign}</g>
  </svg>`;
}

/* ---------- 金網フェンス ---------- */
export function fence(k = '') {
  return `
  <svg class="fence" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <pattern id="chain${k}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0H22M0 0V22" stroke="var(--ink)" stroke-width="1.6" fill="none"/>
      </pattern>
      <linearGradient id="fenceFade${k}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".0"/>
        <stop offset=".35" stop-color="#fff" stop-opacity=".85"/>
        <stop offset="1" stop-color="#fff" stop-opacity="1"/>
      </linearGradient>
      <mask id="fenceMask${k}"><rect width="1600" height="300" fill="url(#fenceFade${k})"/></mask>
    </defs>
    <g mask="url(#fenceMask${k})">
      <rect y="40" width="1600" height="260" fill="url(#chain${k})"/>
      <rect y="34" width="1600" height="9" fill="var(--ink)"/>
      ${[80, 520, 960, 1400].map((x) => `<rect x="${x}" y="30" width="12" height="270" fill="var(--ink)"/>`).join('')}
    </g>
  </svg>`;
}

/* ---------- バーコード ---------- */
export function barcode(seed = 'yuki') {
  const r = rng(seed);
  let x = 0,
    bars = '';
  const guard = () => {
    bars += `<rect x="${x}" y="0" width="1.4" height="62"/>`;
    x += 2.8;
    bars += `<rect x="${x}" y="0" width="1.4" height="62"/>`;
    x += 3;
  };
  guard();
  for (let i = 0; i < 42; i++) {
    const w = [1, 1.4, 2.2, 2.8][Math.floor(r() * 4)];
    if (r() > 0.45) bars += `<rect x="${f(x)}" y="0" width="${w}" height="56"/>`;
    x += w + 0.9;
    if (i === 20) guard();
  }
  guard();
  const digits = Array.from({ length: 13 }, () => Math.floor(r() * 10)).join('');
  return `<svg class="barcode" viewBox="-6 -4 ${f(x + 12)} 80" aria-hidden="true">
    <rect x="-6" y="-4" width="${f(x + 12)}" height="80" fill="var(--paper)"/>
    <g fill="var(--ink)">${bars}</g>
    <text x="${f(x / 2)}" y="73" text-anchor="middle" font-size="10" letter-spacing="2" fill="var(--ink)" font-family="var(--f-mono)">${digits}</text>
  </svg>`;
}

/* ---------- 爆発フキダシ (starburst) ---------- */
export function starburst(seed = 9, spikes = 22) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rad = i % 2 ? 36 + r() * 4 : 47 + r() * 3;
    pts.push(`${f(Math.cos(a) * rad)},${f(Math.sin(a) * rad)}`);
  }
  return `<svg class="burst" viewBox="-50 -50 100 100" aria-hidden="true"><polygon points="${pts.join(' ')}" fill="var(--red)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}

/* ---------- フキダシ (speech bubble) ---------- */
export function bubble(tail = 'bl') {
  const tails = {
    bl: 'M58 92 L20 128 L84 98',
    br: 'M138 96 L184 130 L120 100',
    tl: 'M50 22 L14 -14 L76 14',
    l: 'M18 66 L-22 84 L22 52',
  };
  return `<svg class="bubble-svg" viewBox="-30 -20 260 160" preserveAspectRatio="none" aria-hidden="true">
    <path d="${tails[tail]}" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
    <ellipse cx="100" cy="60" rx="100" ry="58" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4" vector-effect="non-scaling-stroke"/>
    <path d="${tails[tail]}" fill="var(--paper)" stroke="none" transform="translate(0 -4)"/>
  </svg>`;
}

/* ---------- 网点纸 pattern ---------- */
const tone = (id, size = 6, r = 1.3) => `
  <pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="var(--ink)"/>
  </pattern>`;

/* ---------- 作品モチーフ ---------- */
let uid = 0;
export function motif(name) {
  const id = `t${uid++}`;
  const S = 'stroke="var(--ink)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  const P = 'fill="var(--paper)"';
  const T = `fill="url(#${id})"`;
  let body = '';
  switch (name) {
    case 'sunflower': {
      let petals = '';
      for (let ring = 0; ring < 2; ring++)
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * 360 + ring * 13;
          petals += `<ellipse cx="0" cy="${-46 - ring * 6}" rx="11" ry="${30 + ring * 4}" transform="rotate(${a})" ${ring ? P : T} ${S}/>`;
        }
      body = `
        <path d="M100 150 C 96 190, 108 220, 100 270" fill="none" ${S} stroke-width="5"/>
        <path d="M101 205 C 130 185, 160 190, 168 176 C 150 206, 126 214, 101 214Z" ${T} ${S}/>
        <path d="M99 232 C 72 214, 44 218, 34 204 C 52 236, 76 242, 99 241Z" ${P} ${S}/>
        <g transform="translate(100 100)">${petals}
          <circle r="34" fill="var(--ink)"/>
          <circle r="34" fill="url(#${id}w)" />
          <circle r="34" fill="none" ${S}/>
        </g>`;
      body += `<defs><pattern id="${id}w" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.6" fill="var(--paper)"/></pattern></defs>`;
      break;
    }
    case 'glasses':
      body = `
        <ellipse cx="100" cy="200" rx="86" ry="14" ${T} opacity=".6"/>
        <path d="M30 120 C 18 96, 8 92, 2 104" fill="none" ${S}/>
        <path d="M170 120 C 186 98, 196 96, 199 108" fill="none" ${S}/>
        <circle cx="62" cy="130" r="40" ${P} ${S} stroke-width="4"/>
        <circle cx="140" cy="130" r="40" ${P} ${S} stroke-width="4"/>
        <path d="M100 124 Q101 112 102 124" fill="none" ${S} stroke-width="4"/>
        <path d="M42 104 L60 92 M38 118 L70 98" ${S}/>
        <path d="M120 104 L138 92 M116 118 L148 98" ${S}/>
        <path d="M30 150 A40 40 0 0 0 80 166" fill="none" stroke="url(#${id})" stroke-width="10"/>
        <path d="M108 150 A40 40 0 0 0 158 166" fill="none" stroke="url(#${id})" stroke-width="10"/>`;
      break;
    case 'furin':
      body = `
        <path d="M100 0 V40" ${S}/>
        <path d="M58 92 C 58 52, 78 40, 100 40 C 122 40, 142 52, 142 92 Z" ${P} ${S}/>
        <path d="M66 66 C 80 58, 120 58, 134 66" fill="none" ${S} stroke-width="2"/>
        <path d="M70 78 C 84 72, 116 72, 130 78" fill="none" stroke="url(#${id})" stroke-width="10"/>
        <path d="M100 92 V150" ${S} stroke-width="2"/>
        <circle cx="100" cy="100" r="5" fill="var(--ink)"/>
        <g transform="rotate(6 100 150)">
          <rect x="82" y="150" width="36" height="92" ${P} ${S}/>
          <text x="100" y="186" font-size="24" text-anchor="middle" fill="var(--ink)" font-family="var(--f-mincho)">涼</text>
          <path d="M86 210 H114 M86 222 H110" ${S} stroke-width="2"/>
        </g>
        <path d="M150 60 q 14 -8 26 0 M152 80 q 16 -8 32 0 M44 60 q -14 -8 -26 0" fill="none" ${S} stroke-width="2"/>`;
      break;
    case 'crossing': {
      const stripes = Array.from({ length: 7 }, (_, i) => `<rect x="${i * 24}" y="0" width="12" height="16" fill="var(--ink)"/>`).join('');
      body = `
        <rect x="94" y="40" width="12" height="230" ${P} ${S}/>
        <g transform="translate(100 66)">
          <g transform="rotate(30)"><rect x="-70" y="-9" width="140" height="18" ${P} ${S}/><rect x="-70" y="-9" width="140" height="18" ${T}/></g>
          <g transform="rotate(-30)"><rect x="-70" y="-9" width="140" height="18" ${P} ${S}/></g>
        </g>
        <rect x="56" y="118" width="88" height="10" fill="var(--ink)"/>
        <circle cx="62" cy="146" r="20" fill="var(--ink)"/><circle cx="62" cy="146" r="12" fill="var(--red)"/>
        <circle cx="138" cy="146" r="20" fill="var(--ink)"/><circle cx="138" cy="146" r="12" ${P}/>
        <path d="M30 128 l-14 -8 M30 146 h-18 M30 164 l-14 8" ${S} stroke-width="2"/>
        <g transform="translate(106 210) rotate(-12)"><svg x="0" y="-8" width="168" height="16" viewBox="0 0 168 16" overflow="visible"><rect width="168" height="16" ${P} ${S}/>${stripes}</svg></g>`;
      break;
    }
    case 'hanabi': {
      const r2 = rng(7);
      let rays = '';
      [[100, 100, 78, 36], [42, 196, 34, 22], [168, 210, 26, 18]].forEach(([cx, cy, R, n]) => {
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + r2() * 0.1;
          const r0 = R * 0.28,
            r1 = R * (0.82 + r2() * 0.2);
          rays += `<path d="M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)} L${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)}" stroke="var(--paper)" stroke-width="2.2" stroke-linecap="round"/>`;
          rays += `<circle cx="${f(cx + Math.cos(a) * (r1 + 6))}" cy="${f(cy + Math.sin(a) * (r1 + 6))}" r="2.2" fill="var(--paper)"/>`;
        }
      });
      body = `<rect x="-40" y="-40" width="280" height="340" fill="var(--ink)"/>
        <rect x="-40" y="-40" width="280" height="340" fill="url(#${id}p)" opacity=".35"/>
        ${rays}
        <path d="M100 270 C 98 230 104 200 100 176" stroke="var(--paper)" stroke-width="2" stroke-dasharray="3 6" fill="none"/>`;
      body += `<defs><pattern id="${id}p" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="1" fill="var(--paper)"/></pattern></defs>`;
      break;
    }
    case 'ramune':
    default:
      body = `
        <path d="M78 20 H122 V40 C122 56 112 62 112 74 C112 84 124 88 124 100 C124 112 112 116 112 128 C112 142 140 150 140 176 V250 C140 262 132 268 120 268 H80 C68 268 60 262 60 250 V176 C60 150 88 142 88 128 C88 116 76 112 76 100 C76 88 88 84 88 74 C88 62 78 56 78 40Z" ${P} ${S}/>
        <path d="M60 200 H140 V250 C140 262 132 268 120 268 H80 C68 268 60 262 60 250Z" ${T}/>
        <circle cx="100" cy="100" r="16" ${P} ${S}/>
        <path d="M92 94 a10 10 0 0 1 10 -6" fill="none" ${S} stroke-width="2"/>
        <path d="M72 180 V240 M78 178 V200" ${S} stroke-width="2"/>
        ${[[110, 220, 4], [120, 196, 3], [102, 170, 5], [116, 150, 3], [96, 236, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${P} ${S} stroke-width="1.6"/>`).join('')}
        <rect x="74" y="12" width="52" height="14" rx="3" fill="var(--ink)"/>`;
  }
  return `<svg class="motif" viewBox="-20 -20 240 300" aria-hidden="true"><defs>${tone(id)}</defs>${body}</svg>`;
}

/* ---------- 顔出しNG シルエット ---------- */
export function silhouette() {
  return `<svg class="silhouette" viewBox="0 0 200 240" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <defs>
      ${tone('silTone', 5, 1.4)}
      <linearGradient id="silFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>
      <mask id="silMask"><rect width="200" height="240" fill="url(#silFade)"/></mask>
    </defs>
    <g mask="url(#silMask)">
      <path d="M100 30 C 136 30 150 58 148 90 C 147 118 132 142 112 148 L 114 166 C 160 172 192 196 198 240 H 2 C 8 196 40 172 86 166 L 88 148 C 68 142 53 118 52 90 C 50 58 64 30 100 30Z" fill="var(--ink)"/>
      <path d="M100 30 C 136 30 150 58 148 90 C 147 118 132 142 112 148 L 114 166 C 160 172 192 196 198 240 H 2 C 8 196 40 172 86 166 L 88 148 C 68 142 53 118 52 90 C 50 58 64 30 100 30Z" fill="url(#silTone)" transform="translate(4 -2)" opacity=".5"/>
      <path d="M52 86 C 40 40 80 14 112 20 C 150 26 160 64 150 98 C 140 70 120 56 96 60 C 76 64 60 74 52 86Z" fill="var(--ink)"/>
    </g>
  </svg>`;
}

/* ---------- 雷达图 ---------- */
export function radar(stats) {
  const n = stats.length;
  const R = 120;
  const pt = (i, v) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(a) * R * v, Math.sin(a) * R * v];
  };
  const ring = (v) => stats.map((_, i) => pt(i, v).map(f).join(',')).join(' ');
  const grid = [0.25, 0.5, 0.75, 1].map((v) => `<polygon points="${ring(v)}" fill="none" stroke="var(--ink)" stroke-opacity="${v === 1 ? 1 : 0.25}" stroke-width="${v === 1 ? 2 : 1}"/>`).join('');
  const axes = stats.map((_, i) => `<line x1="0" y1="0" x2="${f(pt(i, 1)[0])}" y2="${f(pt(i, 1)[1])}" stroke="var(--ink)" stroke-opacity=".3"/>`).join('');
  const labels = stats
    .map((s, i) => {
      const [x, y] = pt(i, 1.24);
      return `<g class="radar-label" transform="translate(${f(x)} ${f(y)})"><text text-anchor="middle" y="-2" font-size="17" font-family="var(--f-gothic)" fill="var(--ink)">${s.k}</text><text text-anchor="middle" y="14" font-size="9" letter-spacing="1.5" font-family="var(--f-mono)" fill="var(--ink)" opacity=".6">${s.en} ${s.v}</text></g>`;
    })
    .join('');
  const shape = stats.map((s, i) => pt(i, s.v / 100).map(f).join(',')).join(' ');
  const dots = stats.map((s, i) => `<circle cx="${f(pt(i, s.v / 100)[0])}" cy="${f(pt(i, s.v / 100)[1])}" r="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>`).join('');
  return `<svg class="radar" viewBox="-185 -170 370 340" aria-label="能力值雷达图">
    <defs>${tone('radarTone', 5, 1.3)}</defs>
    ${grid}${axes}
    <g class="radar-shape">
      <polygon points="${shape}" fill="url(#radarTone)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="${shape}" fill="var(--red)" fill-opacity=".14"/>
      ${dots}
    </g>
    ${labels}
  </svg>`;
}

/* ---------- 切手 (stamp art) ---------- */
export function stampArt() {
  return `<svg viewBox="0 0 100 120" aria-hidden="true">
    <defs>${tone('stTone', 4, 0.9)}</defs>
    <rect width="100" height="120" fill="var(--sky-soft)"/>
    <rect y="70" width="100" height="50" fill="url(#stTone)" opacity=".5"/>
    <circle cx="70" cy="34" r="14" fill="var(--paper)"/>
    <path d="M0 92 C 20 80 40 86 60 78 C 76 72 88 76 100 70 V120 H0Z" fill="var(--ink)"/>
    <path d="M20 120 L22 40 M14 46 H30 M12 54 H32" stroke="var(--ink)" stroke-width="2.2"/>
    <path d="M22 44 Q 60 54 100 50 M22 52 Q 60 64 100 58" stroke="var(--ink)" stroke-width="1" fill="none"/>
    <text x="8" y="16" font-size="12" font-family="var(--f-gothic)" fill="var(--ink)">85</text>
    <text x="92" y="112" font-size="7" text-anchor="end" font-family="var(--f-mincho)" fill="var(--paper)">夏ノ町郵便</text>
  </svg>`;
}
