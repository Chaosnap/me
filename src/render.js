import { site } from './content.js';
import { speedLines, poleScene, fence, barcode, starburst, bubble, motif, silhouette, radar, stampArt } from './art.js';

export const chapters = [
  { id: 'cover', ja: '表紙', tab: '表紙', en: 'COVER', page: 1 },
  { id: 'contents', ja: '目次', tab: '目次', en: 'CONTENTS', page: 3 },
  { id: 'about', ja: '自己紹介', tab: '自己', en: 'ABOUT', no: 1, page: 4 },
  { id: 'works', ja: '作品集', tab: '作品', en: 'WORKS', no: 2, page: 12 },
  { id: 'skills', ja: '能力値', tab: '能力', en: 'SKILLS', no: 3, page: 20 },
  { id: 'story', ja: 'あらすじ', tab: '軌跡', en: 'STORY', no: 4, page: 28 },
  { id: 'favorites', ja: '夏の音', tab: '好き', en: 'FAVORITES', no: 5, page: 34 },
  { id: 'next', ja: '次号予告', tab: '予告', en: 'NEXT ISSUE', page: 38 },
  { id: 'contact', ja: '読者はがき', tab: '手紙', en: 'CONTACT', page: 40 },
  { id: 'colophon', ja: '奥付', tab: '奥付', en: 'COLOPHON', page: 48 },
];
export const TOTAL_PAGES = 48;

/** 资源路径改成相对路径，这样部署在 GitHub Pages 的子目录下也能找到 */
export const asset = (p) => (p ? String(p).replace(/^\//, '') : p);
/** 加载失败的作品图（详情页改用线稿插画） */
export const failedWorks = new Set();
const MOTIFS = ['furin', 'hanabi', 'glasses', 'crossing', 'sunflower', 'ramune'];
export const workMotif = (i) => site.works[i].motif || MOTIFS[i % MOTIFS.length];

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const chars = (s, cls = 'ch') => [...s].map((c) => `<span class="${cls}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
const pad = (n, l = 2) => String(n).padStart(l, '0');
const today = new Date();
const dateJa = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

/* 「あの夏から N日」：夏（7/1~8/31）之中显示倒数，之外显示距最近一个 8/31 的天数 */
function summerCount() {
  const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const y = d0.getFullYear();
  const end = new Date(y, 7, 31);
  const start = new Date(y, 6, 1);
  if (d0 >= start && d0 <= end) return { label: '夏が終わるまで、', n: Math.round((end - d0) / 864e5), en: 'DAYS LEFT OF SUMMER' };
  const last = d0 > end ? end : new Date(y - 1, 7, 31);
  return { label: 'あの夏から、', n: Math.round((d0 - last) / 864e5), en: 'DAYS SINCE THAT SUMMER' };
}

/* 共通：手写下划线 */
const underline = (cls = '') =>
  `<svg class="hand-underline ${cls}" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true"><path d="M6 26 C 120 14, 260 30, 380 18 S 560 10, 594 16" pathLength="1"/><path class="u2" d="M40 34 C 180 26, 360 32, 520 24" pathLength="1"/></svg>`;

/* 共通：扉ページ */
function door({ no, ja, en, lead, dark = false, hashira, seed = 1 }) {
  const word = `${en} ・ ${ja} ・ `;
  return `
  <header class="door ${dark ? 'door--dark' : ''}" data-door>
    <div class="door-lines">${speedLines({ seed, count: 170, inner: 0.42 })}</div>
    <div class="door-bgword" aria-hidden="true"><span>${esc(en)}</span></div>
    <div class="door-inner">
      <div class="door-no" aria-hidden="true">${no ? `<span>第</span><b>${no}</b><span>話</span>` : `<span class="door-no-ex">特別編</span>`}</div>
      <h2 class="door-title" lang="ja" aria-label="${esc(ja)}">${chars(ja)}</h2>
      <div class="door-meta">
        <p class="door-en">${no ? `EPISODE ${pad(no)} — ` : ''}${esc(en)}</p>
        ${lead ? `<p class="door-lead">${esc(lead)}</p>` : ''}
      </div>
    </div>
    <div class="marquee" aria-hidden="true"><div class="marquee-track"><span>${word.repeat(8)}</span><span>${word.repeat(8)}</span></div></div>
    ${hashira ? `<p class="hashira" lang="ja">${esc(hashira)}</p>` : ''}
  </header>`;
}

/* 共通：章末アオリ */
const aori = (text, target) => `<a class="aori" href="#${target}" data-goto="${target}" data-cursor="次へ"><span lang="ja">${esc(text)}</span><b>▶</b></a>`;

/* 胶片边缘的文字 */
const filmEdge = (n = 14) =>
  Array.from({ length: n }, (_, i) => `<span>▸ ${pad(i + 1)}${i % 2 ? 'A' : ''}</span><span>YUKI FILM 400</span>`).join('');

/* ===================== 表紙 ===================== */
function cover() {
  const { name, magazine } = site;
  const sc = summerCount();
  return `
  <section id="cover" class="cover" data-chapter="cover">
    <canvas class="sky" aria-hidden="true"></canvas>
    <div class="cover-tone" aria-hidden="true"></div>
    <div class="cover-flare" aria-hidden="true"><i class="fl-streak"></i><i class="fl-core"></i><i class="fl-ghost g1"></i><i class="fl-ghost g2"></i><i class="fl-ghost g3"></i><i class="fl-ghost g4"></i></div>
    <div class="cover-top">
      <div class="cover-meta"><span>${dateJa}発売</span><span>${esc(magazine.sub)}</span></div>
      <div class="cover-meta r"><span>No.<b>${esc(magazine.vol)}</b></span><span>定価 ${esc(magazine.price)}（税込）</span></div>
    </div>
    <h1 class="masthead" aria-label="${esc(magazine.title)} ${esc(name.en)}">
      <span class="mast-weekly" lang="ja" aria-hidden="true"><b>週刊</b><small>WEEKLY</small></span>
      <span class="mast-word" aria-hidden="true">${chars(name.en, 'mch')}</span>
      <span class="mast-ja" lang="ja" aria-hidden="true">${esc(name.ja)}</span>
    </h1>
    <canvas class="cover-jelly" aria-hidden="true"></canvas>
    <div class="cover-art" data-parallax="0.6">${poleScene()}</div>
    <div class="cover-fence" data-parallax="1.2">${fence()}</div>
    <canvas class="cover-scratch" aria-hidden="true"></canvas>
    <div class="cover-vhs" aria-hidden="true"></div>

    <div class="cover-count" lang="ja">
      <span class="cc-label">${sc.label}</span>
      <span class="cc-num"><b data-count="${sc.n}">${pad(sc.n)}</b><i class="cc-slash" aria-hidden="true"></i></span>
      <span class="cc-unit">日</span>
      <span class="cc-en">${sc.en}</span>
    </div>

    <div class="cover-bubble" data-parallax="1.6">${bubble('bl')}<span lang="ja">${esc(site.bubble)}</span></div>

    <div class="cover-tagline">
      <p class="hand" lang="ja">${chars(site.tagline, 'tch')}</p>
      <p class="hand tag-ghost" lang="ja" aria-hidden="true">${esc(site.tagline)}</p>
      <svg class="tag-slash" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="8" y1="96" x2="92" y2="4" pathLength="1"/></svg>
      ${underline()}
    </div>

    <ul class="cover-lines">
      ${site.coverLines
        .map(
          (l, i) => `
        <li style="--i:${i}"><a href="#${l.target}" data-goto="${l.target}" data-cursor="読む">
          <span class="cl-tag" lang="ja">${esc(l.tag)}</span>
          <span class="cl-text" lang="ja">${esc(l.text)}</span>
          <span class="cl-en" data-scramble>${esc(l.en)}</span>
          <span class="cl-page">P.${pad(chapters.find((c) => c.id === l.target)?.page || 1)}</span>
        </a></li>`,
        )
        .join('')}
    </ul>

    <div class="cover-burst" lang="ja">${starburst(9)}<span>新連載<b>!!</b></span></div>

    <div class="cover-barcode">${barcode(site.name.en)}<span>雑誌 ${pad(today.getMonth() + 1)}${pad(today.getDate())}-${esc(magazine.vol)}</span></div>

    <div class="cover-film" aria-hidden="true"><div class="cf-track"><div>${filmEdge()}</div><div>${filmEdge()}</div></div></div>
    <div class="scroll-hint" aria-hidden="true"><span>SCROLL</span><i></i></div>
  </section>`;
}

/* ===================== 目次 ===================== */
function contents() {
  const rows = chapters.filter((c) => !['cover', 'contents'].includes(c.id));
  const motifs = ['glasses', 'sunflower', 'crossing', 'ramune', 'furin', 'hanabi', 'ramune', 'glasses'];
  return `
  <section id="contents" class="contents" data-chapter="contents">
    <div class="contents-head">
      <h2 class="contents-title" lang="ja">目次<small>CONTENTS</small></h2>
      <p class="contents-sub">週刊ユキ ${today.getFullYear()} No.${esc(site.magazine.vol)} ── 全${rows.length}本立て</p>
    </div>
    <ol class="toc">
      ${rows
        .map(
          (c, i) => `
        <li class="toc-row" style="--i:${i}">
          <a href="#${c.id}" data-goto="${c.id}" data-cursor="開く">
            <span class="toc-no">${c.no ? pad(c.no) : '★'}</span>
            <span class="toc-kind" lang="ja">${c.no ? `第${c.no}話` : '特別'}</span>
            <span class="toc-title" lang="ja">${esc(c.ja)}</span>
            <span class="toc-en" data-scramble>${esc(c.en)}</span>
            <span class="toc-leader"></span>
            <span class="toc-page">${pad(c.page)}</span>
            <span class="toc-thumb" aria-hidden="true">${motif(motifs[i % motifs.length])}</span>
          </a>
        </li>`,
        )
        .join('')}
    </ol>
    <aside class="author-comment">
      ${site.icon ? `<img class="ac-icon" src="${esc(asset(site.icon))}" alt="" width="56" height="56" loading="lazy" onerror="this.remove()">` : ''}
      <div>
        <div class="ac-head"><span class="ac-label" lang="ja">作者コメント</span><span class="ac-en">FROM THE AUTHOR</span></div>
        <p>${esc(site.authorComment)}<span class="ac-name" lang="ja">（${esc(site.name.ja)}）</span></p>
      </div>
    </aside>
  </section>`;
}

/* ===================== 第1話 自己紹介 ===================== */
function about() {
  const a = site.about;
  const avatar = site.avatar
    ? `<img class="manga-img" src="${esc(asset(site.avatar))}" alt="${esc(site.name.ja)}" loading="lazy">`
    : `${silhouette()}<div class="ng-stamp" lang="ja">顔出し<b>NG</b></div>`;
  return `
  <section id="about" class="chapter about" data-chapter="about">
    ${door({ no: 1, ja: '自己紹介', en: 'ABOUT ME', lead: '关于我这个人的一切（大概）', hashira: `★${site.name.ja}の素顔に迫る！ 巻頭カラー大増ページ!!`, seed: 11 })}
    <div class="manga-page about-page">
      <div class="panel pa" data-clip="0 0,100 0,96 100,0 100">
        <div class="panel-inner scene">
          <div class="scene-sky"></div>
          <div class="scene-cloud c1"></div><div class="scene-cloud c2"></div>
          <div class="scene-tone"></div>
          <div class="scene-fence">${fence('a')}</div>
          <p class="narration" lang="ja">${esc(a.narration)}</p>
          ${a.chara ? `<img class="scene-chara" src="${esc(asset(a.chara))}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : ''}
          <div class="speech" lang="ja">${bubble('bl')}<span>${esc(a.hello)}</span></div>
          <span class="sfx sfx-a" lang="ja">ザァ…</span>
        </div>
      </div>
      <div class="panel pb" data-clip="5 0,100 0,100 100,0 100">
        <div class="panel-inner avatar ${site.avatar ? 'has-img' : ''}">
          ${avatar}
          <span class="note hand" lang="ja">← 本人</span>
        </div>
      </div>
      <div class="panel pc" data-clip="0 0,100 0,100 100,0 100">
        <div class="panel-inner sfx-panel">
          ${speedLines({ seed: 5, count: 120, inner: 0.5 })}
          <span class="sfx sfx-big" lang="ja">ミーン<br>ミンミン</span>
        </div>
      </div>
      <div class="panel pd" data-clip="0 0,100 0,100 100,0 100">
        <div class="panel-inner bio">
          <span class="bio-label">MONOLOGUE</span>
          ${a.paragraphs.map((p, i) => `<p style="--i:${i}">${esc(p)}</p>`).join('')}
        </div>
      </div>
      <div class="panel pe" data-clip="0 0,100 0,100 100,0 100">
        <div class="panel-inner profile">
          <div class="profile-head">
            <span class="ph-file">CHARACTER FILE No.${esc(site.magazine.vol)}</span>
            <h3 lang="ja">${esc(site.name.ja)}<small>${esc(site.name.en)}</small></h3>
          </div>
          <dl class="profile-list">
            ${a.profile.map((p) => `<div><dt><span lang="ja">${esc(p.k)}</span><small>${esc(p.en)}</small></dt><dd lang="ja">${esc(p.v)}</dd></div>`).join('')}
          </dl>
        </div>
      </div>
    </div>
    ${aori('次ページ、作品集一挙掲載!!', 'works')}
  </section>`;
}

/* ===================== 第2話 作品集 ===================== */
function works() {
  const list = site.works;
  return `
  <section id="works" class="chapter works" data-chapter="works">
    ${door({ no: 2, ja: '作品集', en: 'WORKS', lead: `全${list.length}作 一挙掲載`, dark: true, hashira: '★作品をクリックすると詳細ページが開くぞ!!', seed: 22 })}
    <div class="works-pin">
      <div class="works-side">
        <p class="ws-title" lang="ja">作品集</p>
        <p class="ws-count"><b id="works-idx">01</b><span>/ ${pad(list.length)}</span></p>
        <p class="ws-hint">SCROLL →</p>
      </div>
      <div class="works-track">
        ${list
          .map(
            (w, i) => `
          <article class="work ${w.image ? 'has-img' : ''}" style="--i:${i}">
            <button class="work-card" type="button" data-work="${i}" data-cursor="見る" aria-label="${esc(w.title)}">
              <span class="work-art">${w.image ? `<img class="work-img" src="${esc(asset(w.image))}" alt="" loading="lazy" decoding="async" data-i="${i}">` : motif(workMotif(i))}</span>
              <span class="work-no">no.${pad(i + 1)}</span>
              <span class="work-ja" lang="ja">${esc(w.ja)}</span>
              <span class="work-info">
                <span class="work-title">${esc(w.title)}</span>
                <span class="work-tags">${(w.tags || []).map((t) => `<i>${esc(t)}</i>`).join('')}</span>
                ${w.credit ? `<span class="work-credit">${esc(w.credit)}</span>` : ''}
              </span>
              ${w.year ? `<span class="work-year">${esc(w.year)}</span>` : ''}
            </button>
          </article>`,
          )
          .join('')}
        <div class="works-end" lang="ja"><span class="hand">まだまだ<br>続きます。</span>${aori('第3話へ', 'skills')}</div>
      </div>
    </div>
  </section>`;
}

/* ===================== 第3話 能力値 ===================== */
function skills() {
  const total = Math.round(site.stats.reduce((s, x) => s + x.v, 0) / site.stats.length);
  return `
  <section id="skills" class="chapter skills" data-chapter="skills">
    ${door({ no: 3, ja: '能力値', en: 'SKILLS', lead: '能力值与必杀技，全部公开', hashira: '★必殺技の威力はあくまで自己申告です。', seed: 33 })}
    <div class="skills-grid">
      <div class="stat-card">
        <div class="stat-head"><span lang="ja">ステータス</span><small>STATUS</small></div>
        ${radar(site.stats)}
        <div class="stat-total"><span lang="ja">総合力</span><b data-count="${total}">0</b><small>/100</small></div>
      </div>
      <div class="moves">
        <div class="moves-head"><span lang="ja">必殺技一覧</span><small>SPECIAL MOVES</small></div>
        ${site.moves
          .map(
            (m, i) => `
          <article class="move" style="--i:${i}">
            <span class="move-no">技${pad(i + 1)}</span>
            <h3 class="move-name" lang="ja"><ruby>${esc(m.name)}<rt>${esc(m.ruby)}</rt></ruby></h3>
            <p class="move-desc">${esc(m.desc)}</p>
            <div class="move-power" aria-label="威力 ${m.power}/5"><span lang="ja">威力</span>${Array.from({ length: 5 }, (_, k) => `<i class="${k < m.power ? 'on' : ''}"></i>`).join('')}</div>
          </article>`,
          )
          .join('')}
      </div>
    </div>
    ${aori('次回、これまでの軌跡!!', 'story')}
  </section>`;
}

/* ===================== 第4話 あらすじ（線路） ===================== */
function story() {
  const s = site.story;
  const flaps = (str) => [...String(str)].map((c) => `<span class="flap" data-d="${esc(c)}">${esc(c)}</span>`).join('');
  return `
  <section id="story" class="chapter story" data-chapter="story">
    ${door({ no: 4, ja: 'あらすじ', en: 'THE STORY SO FAR', lead: '沿着铁轨，走过来的路', hashira: '★各駅停車でお送りします。', seed: 44 })}
    <div class="railway">
      <div class="rw-sky" aria-hidden="true"></div>
      <svg class="track" aria-hidden="true">
        <defs>
          <mask id="railMask" maskUnits="userSpaceOnUse"><path class="tp rm-a" fill="none" stroke="#fff" stroke-width="40"/><path class="tp rm-b" fill="none" stroke="#000" stroke-width="31"/></mask>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".75"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient>
          <radialGradient id="lampGlow"><stop offset="0" stop-color="#ff5a4a" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a4a" stop-opacity="0"/></radialGradient>
        </defs>
        <path class="tp ballast" fill="none"/>
        <path class="tp ties" fill="none"/>
        <rect class="rails" x="0" y="0" width="100%" height="100%" mask="url(#railMask)"/>
        <g class="poles"></g>
      </svg>
      <!-- 会动的东西各自单独一层（只做合成，不重绘上面那张大 SVG） -->
      <div class="trail-clip" aria-hidden="true"><svg class="track-trail"><path class="tp trail-glow" fill="none"/><path class="tp trail" fill="none"/></svg></div>
      <div class="xings" aria-hidden="true"></div>
      <div class="train-layer" aria-hidden="true">
        ${[2, 1, 0]
          .map(
            (k) => `
        <div class="car-el c${k}"><svg viewBox="-50 -40 100 236" width="100" height="236">
          ${k === 0 ? `<path class="beam" d="M-10 30 L-46 190 L46 190 L10 30Z" fill="url(#beam)"/>` : ''}
          <rect class="car-body" x="-13" y="-34" width="26" height="68" rx="${k === 0 ? 10 : 5}"/>
          <rect class="car-stripe" x="-13" y="-34" width="3.5" height="68"/>
          <rect class="car-stripe" x="9.5" y="-34" width="3.5" height="68"/>
          <rect class="car-ac" x="-6" y="${k === 0 ? -22 : -8}" width="12" height="14" rx="2"/>
          ${k === 0 ? `<path class="panto" d="M-9 14 L0 6 L9 14 L0 22Z"/><g class="sparks"><circle r="2"/><circle r="1.5"/><circle r="1.2"/><circle r="1.8"/></g>` : `<path class="car-line" d="M-6 14 H6 M-6 20 H6"/>`}
          <g class="wind"><path d="M-22 -30 V0 M22 -26 V6 M-28 -10 V18 M28 -16 V12"/></g>
        </svg></div>`,
          )
          .join('')}
      </div>
      <ol class="stations">
        ${s
          .map(
            (st, i) => `
          <li class="station ${i % 2 ? 'right' : 'left'} ${i === s.length - 1 ? 'is-now' : ''}" style="--i:${i}">
            <div class="station-sign" lang="ja">
              <span class="ss-badge">YK<b>${pad(i + 1)}</b></span>
              <span class="ss-kana">${esc(st.kana)}</span>
              <strong class="ss-name">${esc(st.station)}</strong>
              <span class="ss-romaji">${esc(st.romaji)}</span>
              <span class="ss-bar">
                <span class="ss-prev">${i > 0 ? `◀ ${esc(s[i - 1].station)}` : ''}</span>
                <span class="ss-year">${flaps(st.year)}</span>
                <span class="ss-next">${i < s.length - 1 ? `${esc(s[i + 1].station)} ▶` : ''}</span>
              </span>
              <span class="ss-arrive">到着</span>
            </div>
            <p class="station-text">${esc(st.text)}</p>
          </li>`,
          )
          .join('')}
      </ol>
      <div class="led" aria-live="polite">
        <span class="led-head" lang="ja">次は</span>
        <span class="led-win"><span class="led-text" lang="ja"></span></span>
        <span class="led-clock"></span>
      </div>
    </div>
  </section>`;
}

/* ===================== 第5話 好きなもの / 夏の音 ===================== */
function favorites() {
  const pads = [
    { id: 'cicada', sfx: 'ミーン<br>ミンミン', ja: '蝉時雨', en: 'CICADAS' },
    { id: 'furin', sfx: 'チリーン', ja: '風鈴', en: 'WIND CHIME' },
    { id: 'waves', sfx: 'ザザーン', ja: '波音', en: 'WAVES' },
    { id: 'jelly', sfx: 'ぷくぷく', ja: '海月', en: 'JELLYFISH' },
  ];
  return `
  <section id="favorites" class="chapter favorites" data-chapter="favorites">
    ${door({ no: 5, ja: '夏の音', en: 'FAVORITES', lead: '喜欢的东西，和夏天的声音', hashira: '★イヤホン推奨。効果音は全部その場で合成しています。', seed: 55 })}
    <div class="fav-wrap">
      <div class="fav-lists">
        ${site.favorites
          .map(
            (c) => `
          <div class="fav-col">
            <h3 lang="ja">${esc(c.cat)}<small>${esc(c.en)}</small></h3>
            <ol>${c.items.map((it, i) => `<li style="--i:${i}"><span class="fav-no">${pad(i + 1)}</span><span class="fav-item" lang="ja">${esc(it)}</span></li>`).join('')}</ol>
          </div>`,
          )
          .join('')}
      </div>
      <div class="soundboard">
        <div class="sb-head"><span lang="ja">夏の音を鳴らす</span><small>SOUND OF SUMMER — CLICK TO PLAY</small></div>
        <div class="pads">
          ${pads
            .map(
              (p) => `
            <button class="pad ${site.padCovers?.[p.id] ? 'has-cover' : ''}" type="button" data-sound="${p.id}" aria-pressed="false" data-cursor="鳴らす">
              ${site.padCovers?.[p.id] ? `<span class="pad-cover"><img src="${esc(asset(site.padCovers[p.id]))}" alt="" loading="lazy" decoding="async"></span>` : ''}
              <span class="pad-sfx" lang="ja">${p.sfx}</span>
              <span class="pad-label"><b lang="ja">${p.ja}</b><small>${p.en}</small></span>
              <span class="pad-meter"><i></i><i></i><i></i><i></i><i></i></span>
            </button>`,
            )
            .join('')}
        </div>
      </div>
    </div>
  </section>`;
}

/* ===================== 次号予告 ===================== */
function next() {
  return `
  <section id="next" class="next" data-chapter="next">
    <div class="next-lines">${speedLines({ seed: 77, count: 200, inner: 0.5 })}</div>
    <p class="next-label"><span lang="ja">次号予告</span><small>NEXT ISSUE</small></p>
    <h2 class="next-title" lang="ja">${chars('乞うご期待')}<span class="bang">!!</span></h2>
    <ul class="next-list">
      ${site.next.map((n, i) => `<li style="--i:${i}"><span class="tag" lang="ja">${esc(n.tag)}</span><span>${esc(n.text)}</span></li>`).join('')}
    </ul>
    <p class="tsuzuku hand" lang="ja">つづく<span>→</span></p>
    <p class="next-hint">TIP: どこをクリックしても、くらげが生まれる。</p>
  </section>`;
}

/* ===================== 読者はがき ===================== */
function contact() {
  const c = site.contact;
  return `
  <section id="contact" class="contact" data-chapter="contact">
    <div class="contact-head">
      <p class="ch-label"><span lang="ja">付録</span> APPENDIX</p>
      <h2 lang="ja">読者はがき</h2>
      <p class="ch-sub">有任何想说的、合作委托，或者只是想打个招呼，都可以寄一张明信片给我。</p>
    </div>
    <form class="postcard" id="postcard" novalidate>
      <div class="pc-address">
        <div class="pc-stamp">${stampArt()}<span class="pc-postmark" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="30"/><path d="M6 50h88"/></svg><b>${today.getMonth() + 1}.${today.getDate()}</b></span></div>
        <div class="pc-zip" aria-hidden="true"><span>〒</span>${'<i></i>'.repeat(3)}<em>-</em>${'<i></i>'.repeat(4)}</div>
        <p class="pc-kind" lang="ja">郵便はがき</p>
        <p class="pc-to" lang="ja"><span>週刊${esc(site.name.ja)}編集部</span><b>${esc(site.name.ja)}先生</b><em>行</em></p>
      </div>
      <div class="pc-body">
        <label class="pc-field"><span lang="ja">お名前 <small>NAME</small></span><input name="name" autocomplete="name" placeholder="你的名字" required></label>
        <label class="pc-field"><span lang="ja">ご連絡先 <small>EMAIL</small></span><input name="email" type="email" autocomplete="email" placeholder="you@example.com"></label>
        <label class="pc-field pc-msg"><span lang="ja">ご感想・ご依頼 <small>MESSAGE</small></span><textarea name="msg" rows="4" placeholder="想对我说的话……" required></textarea></label>
        <fieldset class="pc-survey">
          <legend lang="ja">Q. 今号で一番面白かったのは？</legend>
          ${['第1話', '第2話', '第3話', '第4話', '第5話'].map((t, i) => `<label><input type="radio" name="fav" value="${t}" ${i === 1 ? 'checked' : ''}><span lang="ja">${t}</span></label>`).join('')}
        </fieldset>
        <button class="pc-send" type="submit" data-cursor="投函"><span lang="ja">ポストに投函する</span><b>✉</b></button>
        <p class="pc-done" lang="ja" aria-live="polite"></p>
      </div>
    </form>
    <div class="stickers" aria-label="社交链接">
      <p class="stickers-label"><span lang="ja">付録シール</span> STICKERS</p>
      <div class="sticker-sheet">
        <a class="sticker mail" href="mailto:${esc(c.email)}" data-cursor="✉"><b>MAIL</b><small>${esc(c.email)}</small></a>
        ${c.socials.map((s, i) => `<a class="sticker s${i % 4}" href="${esc(s.url)}" target="_blank" rel="noopener" data-cursor="GO"><b>${esc(s.name)}</b><small>${esc(s.handle)}</small></a>`).join('')}
      </div>
    </div>
  </section>`;
}

/* ===================== 奥付 ===================== */
function colophon() {
  const c = site.colophon;
  return `
  <footer id="colophon" class="colophon" data-chapter="colophon">
    <div class="signoff">
      <p class="hand" lang="ja">${chars(c.signoff, 'tch')}</p>
      ${underline('end')}
    </div>
    <div class="okuzuke" lang="ja">
      <p class="ok-title">${esc(site.magazine.title)} <small>第${Number(site.magazine.vol)}号</small></p>
      <dl>
        <div><dt>発行日</dt><dd>${dateJa}</dd></div>
        <div><dt>発行人</dt><dd>${esc(c.publisher)}</dd></div>
        <div><dt>編集</dt><dd>${esc(c.editor)}</dd></div>
        <div><dt>印刷所</dt><dd>${esc(c.printer)}</dd></div>
        <div><dt>定価</dt><dd>${esc(site.magazine.price)}（税込）</dd></div>
        ${site.bgm ? `<div class="ok-bgm"><dt>BGM</dt><dd>${esc(site.bgm.title)}<br><small>${esc(site.bgm.artist)}</small></dd></div>` : ''}
      </dl>
      <p class="ok-legal">本誌掲載の文章・作品の無断転載を禁じます。</p>
    </div>
    <div class="colophon-foot">
      <span>© ${today.getFullYear()} ${esc(site.name.en)}</span>
      <button class="to-top" type="button" data-goto="cover" data-cursor="戻る"><span lang="ja">↑ 表紙に戻る</span></button>
    </div>
  </footer>`;
}

/* ===================== 右侧胶卷导航 ===================== */
function filmnav() {
  const thumbs = site.works.map((w) => asset(w.thumb || w.image)).filter(Boolean);
  const blank = (n) => '<span class="fn-frame fn-leader fn-blank" aria-hidden="true"></span>'.repeat(n);
  const leader = blank(30) + ['3', '2', '1'].map((n) => `<span class="fn-frame fn-leader" aria-hidden="true"><b>${n}</b></span>`).join('');
  const frames = chapters
    .map((c, i) => {
      const img = thumbs.length ? thumbs[i % thumbs.length] : '';
      return `<a class="fn-frame" href="#${c.id}" data-goto="${c.id}" data-cursor="${esc(c.tab)}" aria-label="${esc(c.ja)}">
        <span class="fn-img"${img ? ` style="background-image:url('${img}'), linear-gradient(135deg, #6a5038, #2c1f15)"` : ''}></span>
        <span class="fn-no">${pad(i + 1)}${i % 2 ? 'A' : ''}</span>
        <span class="fn-label" lang="ja">${c.no ? `第${c.no}話 ` : ''}${esc(c.ja)}</span>
      </a>`;
    })
    .join('');
  return `<div class="fn-reel">${leader}${frames}<span class="fn-frame fn-leader fn-end" aria-hidden="true"><b>END</b></span>${blank(30)}</div><i class="fn-blur top" aria-hidden="true"></i><i class="fn-blur bot" aria-hidden="true"></i>`;
}

export function render(root) {
  root.innerHTML = cover() + contents() + about() + works() + skills() + story() + favorites() + next() + contact() + colophon();

  const nav = document.getElementById('filmnav');
  nav.innerHTML = filmnav();
  // 放映机的片门：放在胶卷外面（胶卷有遮罩，放里面会被裁掉，没法「溢出胶片」）
  nav.insertAdjacentHTML(
    'afterend',
    `<div class="fn-lens" aria-hidden="true">
      <i class="fl-glow"></i>
      <i class="fl-line"></i>
      <div class="fl-frame"><i class="fl-img"></i><i class="fl-img"></i><i class="fl-sheen"></i><b class="fl-no"></b></div>
      <i class="fl-bracket"></i>
    </div>`,
  );
  document.getElementById('mobile-toc').innerHTML = `
    <div class="mt-inner">
      <p class="mt-label" lang="ja">目次 <small>CONTENTS</small></p>
      ${chapters.map((c) => `<a href="#${c.id}" data-goto="${c.id}"><span class="mt-p">${pad(c.page)}</span><span lang="ja">${c.ja}</span><small>${c.en}</small></a>`).join('')}
    </div>`;
  document.getElementById('hud-mag').textContent = site.magazine.title;
  document.querySelector('.nb-mag').textContent = `${site.magazine.title} ${today.getFullYear()} No.${site.magazine.vol}`;
  if (site.bgm) document.querySelector('.bgm-title-text').textContent = `${site.bgm.title} ── ${site.bgm.artist}`;

  // 图片缺失时的退路：作品换成线稿插画，按钮去掉封面
  const onFail = (img, fn) => {
    img.addEventListener('error', fn, { once: true });
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) fn();
  };
  root.querySelectorAll('.work-img').forEach((img) =>
    onFail(img, () => {
      const i = Number(img.dataset.i);
      failedWorks.add(i);
      img.closest('.work').classList.remove('has-img');
      img.insertAdjacentHTML('afterend', motif(workMotif(i)));
      img.remove();
    }),
  );
  root.querySelectorAll('.pad-cover img').forEach((img) =>
    onFail(img, () => {
      img.closest('.pad').classList.remove('has-cover');
      img.parentNode.remove();
    }),
  );
}

export function workDetail(i) {
  const w = site.works[i];
  const img = w.image && !failedWorks.has(i) ? asset(w.image) : '';
  const art = img
    ? `<span class="md-blur" style="background-image:url('${esc(img)}')"></span><img class="md-img" src="${esc(img)}" alt="${esc(w.title)}">`
    : `${motif(workMotif(i))}${speedLines({ seed: i + 90, count: 100, inner: 0.7 })}`;
  return `
    <button class="modal-close" type="button" data-close data-cursor="閉じる">✕ <span lang="ja">閉じる</span></button>
    <div class="md-art ${img ? 'has-img' : ''}">${art}</div>
    <div class="md-body">
      <p class="md-no">no.${pad(i + 1)}${w.year ? ` ／ ${esc(w.year)}` : ''}</p>
      <h3 class="md-ja" lang="ja">${esc(w.ja)}</h3>
      <h4 class="md-title" id="modal-title">${esc(w.title)}</h4>
      <p class="md-tags">${(w.tags || []).map((t) => `<i>${esc(t)}</i>`).join('')}</p>
      <p class="md-desc">${esc(w.desc)}</p>
      ${w.credit ? `<p class="md-credit">${esc(w.credit)}</p>` : ''}
      ${w.link && w.link !== '#' ? `<a class="md-link" href="${esc(w.link)}" target="_blank" rel="noopener" data-cursor="GO">作品を見る →</a>` : ''}
      <div class="md-nav"><button type="button" data-work-step="-1" data-cursor="前へ">← 前</button><button type="button" data-work-step="1" data-cursor="次へ">次 →</button></div>
    </div>`;
}
