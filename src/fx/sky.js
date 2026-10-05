/* 封面的天空：WebGL 片元着色器
 * 夏日积云 + 太阳光晕 + 网点 + 色差 + 颗粒；夜晚切换为星空与月光 */

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uNight;
uniform float uScroll;
uniform float uScale;

float hash(vec2 p){ p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

float cloud(vec2 p, float y, float t){
  vec2 q = vec2(p.x * 1.5 + t, p.y * 2.6);
  float w = fbm(q * 0.8 + vec2(0.0, t * 0.3));
  float n = fbm(q * 1.15 + vec2(w, w * 0.7) * 1.1);
  // 越接近地平线越厚：入道雲
  float h = smoothstep(0.92, 0.12, y);
  float th = mix(0.63, 0.44, h);
  return smoothstep(th, th + 0.13, n);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y) + uMouse * vec2(0.012, 0.008);
  float t = uTime * 0.012;

  // ---- 天空渐变
  vec3 dayTop = vec3(0.22, 0.42, 0.78);
  vec3 dayHor = vec3(0.95, 0.9, 0.9);
  vec3 nightTop = vec3(0.015, 0.03, 0.065);
  vec3 nightHor = vec3(0.17, 0.14, 0.25);
  vec3 skyTop = mix(dayTop, nightTop, uNight);
  vec3 skyHor = mix(dayHor, nightHor, uNight);
  vec3 col = mix(skyHor, skyTop, smoothstep(0.05, 0.95, uv.y));

  // ---- 星星（夜）
  vec2 sg = floor(gl_FragCoord.xy / (2.0 * uScale));
  float st = step(0.9965, hash(sg)) * (0.6 + 0.4 * sin(uTime * 2.0 + hash(sg + 3.1) * 40.0));
  col += vec3(st) * uNight * smoothstep(0.25, 0.8, uv.y);

  // ---- 太阳 / 月亮
  vec2 sun = vec2(0.80 * asp, 0.84) + uMouse * vec2(0.03, 0.02);
  float d = length(p - sun);
  vec3 sunCol = mix(vec3(1.0, 0.96, 0.88), vec3(0.85, 0.9, 1.0), uNight);
  float disc = smoothstep(0.065, 0.058, d) * mix(1.0, 0.9, uNight);
  float glow = exp(-d * mix(3.2, 7.0, uNight)) * mix(0.75, 0.35, uNight);

  // ---- 云（性能考虑：只采样一次，再加一次朝向太阳的受光采样）
  float cG = cloud(p, uv.y, t);
  // 受光：朝太阳方向偏移采样
  vec2 toSun = normalize(sun - p) * 0.035;
  float cS = cloud(p + toSun, uv.y + toSun.y, t);
  float lit = clamp(1.0 - (cS - cG) * 2.4, 0.0, 1.0);
  vec3 cLit = mix(vec3(1.0), vec3(0.34, 0.36, 0.48), uNight);
  vec3 cShade = mix(vec3(0.5, 0.53, 0.66), vec3(0.05, 0.06, 0.1), uNight);
  vec3 cc = mix(cShade, cLit, lit);
  // 太阳附近的云边缘透光
  cc += sunCol * glow * 0.8 * (1.0 - uNight * 0.6);

  col = mix(col, cc, cG * 0.96);

  // ---- 光漏（左下暖色、右侧品红）
  col += vec3(1.0, 0.55, 0.35) * smoothstep(0.85, 0.0, length(uv - vec2(-0.05, -0.05))) * mix(0.22, 0.12, uNight);
  col += vec3(0.85, 0.3, 0.7) * smoothstep(0.7, 0.0, length(uv - vec2(1.05, 0.25))) * mix(0.08, 0.14, uNight);

  // ---- 去饱和 = MV 的黑白感
  float L = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(L), col, mix(0.68, 0.75, uNight));

  // ---- 网点
  vec2 g = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / (3.2 * uScale);
  float r = sqrt(clamp(1.0 - L, 0.0, 1.0)) * 0.5;
  float dotv = 1.0 - smoothstep(r - 0.12, r + 0.12, length(fract(g) - 0.5));
  col = mix(col, col * 0.84, dotv * 0.55 * (1.0 - uNight) * (1.0 - glow));

  // ---- 太阳 / 月亮（最后叠加，保持过曝）
  float hide = 1.0 - cG * 0.85;
  col += sunCol * glow * hide;
  col += sunCol * exp(-d * 1.2) * mix(0.18, 0.06, uNight);
  col = mix(col, vec3(1.0), disc * hide);

  // ---- 白飞 & 暗角
  float vig = smoothstep(0.55, 1.35, length((uv - 0.5) * vec2(1.5, 1.0)));
  col = mix(col, vec3(1.0), vig * 0.3 * (1.0 - uNight));
  col *= 1.0 - vig * 0.45 * uNight;
  col = mix(col, mix(vec3(0.98), vec3(0.03, 0.05, 0.08), uNight), uScroll * 0.7);

  // ---- 颗粒
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 91.0) - 0.5) * 0.05;

  gl_FragColor = vec4(col, 1.0);
}`;

export function initSky(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) {
    canvas.style.background = 'linear-gradient(to bottom, #8fb0d8, #eceaf0)';
    return { ready: Promise.resolve(), hold() {}, setNight() {}, setMouse() {}, setScroll() {} };
  }
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uRes', 'uTime', 'uMouse', 'uNight', 'uScroll', 'uScale'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  let scale = 0.5;
  let cur = scale;
  const MAX_PX = 420000; // 渲染像素上限：大屏幕也不会更慢
  let held = false;
  const state = { night: document.documentElement.dataset.theme === 'night' ? 1 : 0, nightTarget: 0, mx: 0, my: 0, tx: 0, ty: 0, scroll: 0 };
  state.nightTarget = state.night;

  const resize = () => {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    cur = Math.min(scale, Math.sqrt(MAX_PX / Math.max(1, w * h)));
    canvas.width = Math.max(2, Math.round(w * cur));
    canvas.height = Math.max(2, Math.round(h * cur));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  let markReady;
  const ready = new Promise((r) => (markReady = r));
  let frames = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  let slow = 0,
    last = t0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    // 开场 loader 盖住天空时：画完前 3 帧就暂停
    if (held && frames >= 3) return;
    // 云走得很慢，30fps 足够
    const dt = now - last;
    if (frames >= 3 && dt < 31) return;
    last = now;
    // 自适应画质：持续掉帧就降分辨率
    if (frames > 3 && dt > 55) slow++;
    else slow = Math.max(0, slow - 1);
    if (slow > 20 && scale > 0.3) {
      scale -= 0.08;
      slow = 0;
      resize();
    }
    state.night += (state.nightTarget - state.night) * 0.05;
    state.mx += (state.tx - state.mx) * 0.04;
    state.my += (state.ty - state.my) * 0.04;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, reduce ? 20 : (now - t0) / 1000 + 40);
    gl.uniform2f(U.uMouse, state.mx, state.my);
    gl.uniform1f(U.uNight, state.night);
    gl.uniform1f(U.uScroll, state.scroll);
    gl.uniform1f(U.uScale, cur);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (++frames === 3) markReady();
  };
  requestAnimationFrame(frame);

  return {
    ready,
    /** loader 期间暂停渲染 */
    hold(v) {
      held = v;
    },
    setNight(v) {
      state.nightTarget = v ? 1 : 0;
    },
    setMouse(x, y) {
      state.tx = x;
      state.ty = y;
    },
    setScroll(v) {
      state.scroll = v;
    },
  };
}
