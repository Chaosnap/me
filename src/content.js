/* ============================================================
 *  週刊ユキ — 网站内容配置
 *  ------------------------------------------------------------
 *  网站上的所有文字、作品、链接都在这个文件里。
 *  改完保存，浏览器会自动刷新。带 ← 的地方建议优先改成你自己的。
 *
 *  图片：放进 public/images/ 文件夹，然后在下面写 '/images/文件名.jpg'
 *       （不放图也没关系，会自动生成漫画风的占位画面）
 * ============================================================ */

export const site = {
  // ---------- 基本信息 ----------
  name: {
    en: 'YUKI', // ← 封面大标题（英文/罗马字，建议 3~6 个字母）
    ja: 'ユキ', // ← 日文/片假名名字
    hand: 'ゆき', // ← 手写体签名
  },
  magazine: {
    title: '週刊ユキ', // ← 杂志名
    sub: 'WEEKLY MANGA MAGAZINE',
    vol: '01',
    price: '¥0',
  },
  tagline: '夏は、まだ終わらない。', // ← 封面手写标语
  bubble: 'はじめまして！', // ← 封面对话气泡
  avatar: '/images/avatar.webp', // ← 自画像（第1話）；留空则显示「顔出しNG」
  icon: '/images/icon.webp', // ← 小头像（目次页的作者コメント）

  // ---------- 背景音乐 ----------
  // 第一次点击页面时开始播放（浏览器不允许无交互自动播放），右上角可以暂停
  bgm: {
    src: '/audio/bgm.mp3',
    title: 'あの夏が飽和する',
    artist: 'カンザキイオリ — covered by 空澄セナ',
  },

  // 封面右侧的「目录式」宣传语
  coverLines: [
    { tag: '巻頭特集', text: '私について', en: 'ABOUT ME', target: 'about' },
    { tag: '一挙掲載', text: '作品集 全10作', en: 'WORKS', target: 'works' },
    { tag: '大公開', text: '能力値・必殺技', en: 'SKILLS', target: 'skills' },
    { tag: '新連載', text: 'これまでのあらすじ', en: 'STORY', target: 'story' },
    { tag: '付録', text: '読者はがき', en: 'CONTACT', target: 'contact' },
  ],

  // 目录页的作者コメント（像少年Jump目录页下面的作者感言）
  authorComment: '最近终于把个人网站做好了。夏天的尾巴总是很长，希望你也喜欢这一期。',

  // ---------- 第1話 自己紹介 ----------
  about: {
    hello: 'はじめまして、ユキです。',
    chara: '/images/chara.webp', // ← 第1話第一格里、对话框后面的立绘（透明背景）
    narration: 'これは、ある夏の日から始まった小さな物語。',
    paragraphs: [
      // ← 自我介绍，每一段一个字符串
      '你好，我是 Yuki。一个喜欢夏天、漫画和代码的人。白天写程序，晚上画画，偶尔在凌晨三点思考人生。',
      '我喜欢把脑子里的画面做成能动的东西——网页、小工具、短动画。最在意的是那些「多看一眼才会发现」的细节。',
      '如果你也喜欢黑白漫画、蝉鸣、汽水和日落时分的电线杆，我们大概会很聊得来。',
    ],
    profile: [
      // ← 角色档案
      { k: '誕生日', en: 'BIRTHDAY', v: '6月31日' },
      { k: '星座', en: 'ZODIAC', v: '双子座' },
      { k: '職業', en: 'CLASS', v: '開発者 / 絵描き' },
      { k: '好物', en: 'FAVORITE', v: 'ラムネ・夕焼け' },
      { k: '苦手', en: 'WEAKNESS', v: '早起き' },
      { k: '座右の銘', en: 'MOTTO', v: '一日一歩' },
    ],
  },

  // ---------- 第2話 作品集 ----------
  // image：大图（详情页用），thumb：小图（右侧胶卷导航用）
  // credit：作者 / 出处，填写后会显示在卡片和详情页 ←
  works: [
    { title: '海月', ja: 'くらげのゆめ', year: '', tags: ['Illustration'], desc: '深蓝的水里，两个人和一群月水母一起慢慢漂浮。', link: '', image: '/images/works/w01.webp', thumb: '/images/thumbs/w01.webp', credit: '' },
    { title: '夏空', ja: 'シャボン玉', year: '', tags: ['Illustration'], desc: '吹出来的泡泡和丝带一起，被风带去了很高的地方。', link: '', image: '/images/works/w02.webp', thumb: '/images/thumbs/w02.webp', credit: '' },
    { title: '窗边', ja: 'まどべ', year: '', tags: ['Illustration'], desc: '窗帘被风掀起来的那一秒，世界只剩下蓝色。', link: '', image: '/images/works/w03.webp', thumb: '/images/thumbs/w03.webp', credit: '' },
    { title: '道口的黄昏', ja: 'ふみきり', year: '', tags: ['Illustration'], desc: '电车经过之前，晚霞把电线染成了橘色。', link: '', image: '/images/works/w04.webp', thumb: '/images/thumbs/w04.webp', credit: '' },
    { title: '树影', ja: 'こもれび', year: '', tags: ['Illustration'], desc: '夏天的林荫道，光斑在脚下晃来晃去。', link: '', image: '/images/works/w05.webp', thumb: '/images/thumbs/w05.webp', credit: '' },
    { title: '水底', ja: 'みなそこ', year: '', tags: ['Illustration'], desc: '站在水面上，背后是另一个安静的世界。', link: '', image: '/images/works/w06.webp', thumb: '/images/thumbs/w06.webp', credit: '' },
    { title: '向日葵', ja: 'ひまわり', year: '', tags: ['Illustration'], desc: '草帽、阳伞，还有开满一整片的向日葵。', link: '', image: '/images/works/w07.webp', thumb: '/images/thumbs/w07.webp', credit: '' },
    { title: '夕凪', ja: 'ゆうなぎ', year: '', tags: ['Illustration'], desc: '隔着铁丝网看到的晚霞，比什么都温柔。', link: '', image: '/images/works/w08.webp', thumb: '/images/thumbs/w08.webp', credit: '' },
    { title: '泡沫', ja: 'うたかた', year: '', tags: ['Illustration'], desc: '倒过来的世界里，气泡一个接一个往上浮。', link: '', image: '/images/works/w09.webp', thumb: '/images/thumbs/w09.webp', credit: '' },
    { title: '玻璃', ja: 'ガラス', year: '', tags: ['Illustration'], desc: '碎掉的玻璃后面，是不肯松开的手。', link: '', image: '/images/works/w10.webp', thumb: '/images/thumbs/w10.webp', credit: '' },
  ],

  // ---------- 第3話 能力値 ----------
  stats: [
    // 雷达图，value 0~100
    { k: '設計', en: 'DESIGN', v: 82 },
    { k: '実装', en: 'CODE', v: 90 },
    { k: '作画', en: 'DRAW', v: 68 },
    { k: '演出', en: 'MOTION', v: 85 },
    { k: '音感', en: 'SOUND', v: 55 },
    { k: '根性', en: 'GRIT', v: 77 },
  ],
  moves: [
    // 「必殺技」= 技能
    { name: '奥義・界面錬成', ruby: 'フロントエンド', desc: 'HTML / CSS / JavaScript / TypeScript / React / Vue', power: 5 },
    { name: '秘技・光と影', ruby: 'グラフィックス', desc: 'WebGL / Shader / Canvas / Three.js', power: 4 },
    { name: '奥義・動く絵', ruby: 'モーション', desc: 'GSAP / After Effects / Lottie', power: 4 },
    { name: '禁術・深夜修正', ruby: 'デバッグ', desc: '凌晨三点也能找到 bug 的特殊能力（副作用：第二天很困）', power: 3 },
  ],

  // ---------- 第4話 あらすじ（时间线，每一项是一站） ----------
  story: [
    { year: '2016', station: '始発', kana: 'しはつ', romaji: 'Shihatsu', text: '第一次在网上看到有人用代码画画，觉得这就是魔法。' },
    { year: '2019', station: '夏祭', kana: 'なつまつり', romaji: 'Natsumatsuri', text: '做出第一个自己的网页，配色很糟，但是很开心。' },
    { year: '2022', station: '夕焼', kana: 'ゆうやけ', romaji: 'Yuyake', text: '开始认真学习设计和动画，迷上了黑白漫画的网点。' },
    { year: '2024', station: '花火', kana: 'はなび', romaji: 'Hanabi', text: '接到第一个委托，熬了很多夜，也学到了很多。' },
    { year: '2026', station: '現在地', kana: 'げんざいち', romaji: 'Genzaichi', text: '你在这里。故事还在继续。' },
  ],

  // ---------- 第5話 好きなもの ----------
  favorites: [
    { cat: '音楽', en: 'MUSIC', items: ['カンザキイオリ', 'ヨルシカ', 'ずっと真夜中でいいのに。', 'Aimer'] },
    { cat: '漫画・アニメ', en: 'MANGA / ANIME', items: ['チェンソーマン', 'ルックバック', '四月は君の嘘', '秒速5センチメートル'] },
    { cat: 'その他', en: 'OTHERS', items: ['夕焼けの電線', '夏の夜の散歩', 'フィルムカメラ', 'ラムネのビー玉'] },
  ],

  // 「夏の音」四个按钮的封面图（留空则显示拟声词）
  padCovers: {
    cicada: '/images/pads/cicada.webp',
    furin: '/images/pads/furin.webp',
    waves: '/images/pads/waves.webp',
    jelly: '/images/pads/jelly.webp',
  },

  // ---------- 次号予告 ----------
  next: [
    // ← 正在做的事
    { tag: '制作中', text: '新的生成艺术系列「蝉時雨」' },
    { tag: '勉強中', text: '日语 N2 & 着色器编程' },
    { tag: '計画中', text: '一本关于夏天的同人志' },
  ],

  // ---------- 読者はがき（联系方式） ----------
  contact: {
    email: 'chaosnap@outlook.com', // 投函按钮会打开邮件客户端发到这里
    socials: [
      // ← 社交链接，不需要的删掉即可
      { name: 'GitHub', handle: '@Chaosnap', url: 'https://github.com/Chaosnap' },
      { name: 'X', handle: '@WalesHua', url: 'https://x.com/WalesHua' },
      { name: 'bilibili', handle: 'UID 2087892128', url: 'https://space.bilibili.com/2087892128' },
      { name: 'pixiv', handle: 'ID 51288817', url: 'https://www.pixiv.net/users/51288817' },
    ],
  },

  // ---------- 奥付（页脚） ----------
  colophon: {
    publisher: 'ユキ',
    editor: 'ユキ',
    printer: 'あなたのブラウザ',
    signoff: 'また来週。',
  },
};
