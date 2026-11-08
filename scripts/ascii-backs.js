/**
 * natalie churchill — 10c f26
 * ascii card backs: when a card turns away on the ring, its back shows that
 * card's own picture redrawn in text symbols.
 *   about card      → the site icon (rose vine)
 *   project 01      → the uncanny valley collage
 *   project 02      → its looping preview video (Images/extra/p2vid.mp4), live
 *   project 03      → the preview video, live, as moving ascii
 *   in-class demos  → its looping preview video, live, the same way
 *   gallery cards   → their first four pieces as a 2×2 grid
 * everything is drawn once (except the live video), so it costs almost nothing.
 * while a back's picture is still loading it shows constantly-scrambling symbols
 * (like the loading screen), then unscrambles into the picture once it's ready.
 */

(function () {
  // ---- tunables -----------------------------------------------------------
  const RAMP = " .'`:-=+*o%#@";   // dark → bright (plain characters, all the same width)
  const FONT_PX = 7;              // size of each ascii character (smaller = more detail)
  const CHAR_W = 0.6;             // monospace character width, as a fraction of its height
  const LIVE_MS = 120;            // how often the project 03 video back refreshes
  const SCRAMBLE_MS = 70;         // how often the loading scramble changes
  const REVEAL_MS = 600;          // how long the scramble takes to settle into the picture
  // same symbols as the loading screen
  const SCRAMBLE = '▓▒░◇◆※∴∵◐◓◑◒⌁⌇⟡⊹✦✧';
  const randGlyph = () => SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];

  const loadImg = (src) => new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

  // draw something into a w×h box, cropped to fill it (like object-fit: cover)
  function drawCover(ctx, src, x, y, w, h) {
    const sw = src.videoWidth || src.naturalWidth || src.width;
    const sh = src.videoHeight || src.naturalHeight || src.height;
    if (!sw || !sh) return;
    const s = Math.max(w / sw, h / sh);
    const dw = sw * s, dh = sh * s;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(src, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  }

  // turn a card's picture(s) into a block of ascii text sized to fill the card
  function toAscii(card, sources, mode) {
    const cellW = FONT_PX * CHAR_W, cellH = FONT_PX;
    const cols = Math.max(10, Math.floor(card.offsetWidth / cellW));
    const rows = Math.max(6, Math.floor(card.offsetHeight / cellH));
    const W = cols * cellW, H = rows * cellH;

    const canvas = document.createElement('canvas');
    canvas.width = cols; canvas.height = rows;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.setTransform(1 / cellW, 0, 0, 1 / cellH, 0, 0);   // one canvas pixel per character
    if (sources.length === 1) {
      drawCover(ctx, sources[0], 0, 0, W, H);
    } else {                                               // 2×2 grid
      const gw = W / 2, gh = H / 2;
      sources.slice(0, 4).forEach((s, k) => drawCover(ctx, s, (k % 2) * gw, Math.floor(k / 2) * gh, gw - cellW, gh - cellH));
    }

    const data = ctx.getImageData(0, 0, cols, rows).data;  // throws if the image isn't allowed — caller falls back
    const vals = new Float32Array(cols * rows);
    let lo = 1, hi = 0;
    for (let i = 0; i < vals.length; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3] / 255;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      // "alpha" mode is for dark line drawings on a transparent background (the site icon)
      const v = mode === 'alpha' ? a * (1 - lum) : lum * a;
      vals[i] = v;
      if (a > 0.05) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    const span = Math.max(0.08, hi - lo);
    let out = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const t = Math.min(1, Math.max(0, (vals[y * cols + x] - lo) / span));
        out += RAMP[Math.round(Math.pow(t, 0.9) * (RAMP.length - 1))];
      }
      out += '\n';
    }
    return out;
  }

  function attach(card, getSources, mode, live) {
    const back = card.querySelector('.card-back');
    if (!back) return;
    const pre = document.createElement('pre');
    pre.className = 'back-ascii';
    back.appendChild(pre);
    const num = back.querySelector('.back-num');
    const label = document.createElement('div');
    label.className = 'back-label';
    label.textContent = num ? num.textContent : '';
    back.appendChild(label);

    // scramble straight away, until the picture is ready
    const st = { card, pre, final: null, order: null, revealStart: 0, done: false };
    back.classList.add('has-ascii');
    scrambling.push(st);

    const render = async () => {
      try {
        const srcs = await getSources();
        if (!srcs || !srcs.length) return;
        const text = toAscii(card, srcs, mode);
        if (!st.final && !st.done) startReveal(st, text);   // first time: unscramble into it
        else if (st.done) pre.textContent = text;           // live video backs: just update
        else st.final = text;
      } catch (e) { /* picture not ready yet — keep scrambling */ }
    };
    st.render = render;
    st.live = live;
    allStates.push(st);
    render();
    if (live) {
      setInterval(() => {
        if (card.classList.contains('show-back') && !document.hidden) render();
      }, LIVE_MS);
    }
  }

  // ---- loading scramble ------------------------------------------------------
  const scrambling = [];
  const allStates = [];

  function startReveal(st, text) {
    st.final = text;
    // each character settles at its own random moment during the reveal
    st.order = new Float32Array(text.length);
    for (let i = 0; i < text.length; i++) st.order[i] = Math.random();
    st.revealStart = performance.now();
  }

  function scrambleBlock(card) {
    const cols = Math.max(10, Math.floor(card.offsetWidth / (FONT_PX * CHAR_W)));
    const rows = Math.max(6, Math.floor(card.offsetHeight / FONT_PX));
    let out = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) out += Math.random() < 0.35 ? ' ' : randGlyph();
      out += '\n';
    }
    return out;
  }

  function tickScramble() {
    const now = performance.now();
    for (let k = scrambling.length - 1; k >= 0; k--) {
      const st = scrambling[k];
      const facing = st.card.classList.contains('show-back') && !document.hidden;
      if (!st.final) {
        if (facing) st.pre.textContent = scrambleBlock(st.card);
        continue;
      }
      const p = (now - st.revealStart) / REVEAL_MS;
      if (p >= 1 || !facing) {               // finished (or nobody's looking) — show the picture
        st.pre.textContent = st.final;
        st.done = true;
        scrambling.splice(k, 1);
        continue;
      }
      const f = st.final;
      let out = '';
      for (let i = 0; i < f.length; i++) {
        const c = f[i];
        out += (c === '\n' || st.order[i] < p) ? c : (c === ' ' && Math.random() < 0.6 ? ' ' : randGlyph());
      }
      st.pre.textContent = out;
    }
  }
  setInterval(tickScramble, SCRAMBLE_MS);

  function setup() {
    document.querySelectorAll('.ring-card').forEach((card) => {
      // about card → the site icon
      if (card.classList.contains('about-card')) {
        attach(card, async () => [await loadImg('Images/siteIcon.png')], 'alpha');
        return;
      }
      // in-class demos & project 02 → their looping preview video, live (same as project 03)
      const loop = card.querySelector('.loop-video');
      if (loop) {
        attach(card, async () => (loop.readyState >= 2 ? [loop] : []), null, true);
        return;
      }
      // gallery cards → first four thumbnails
      if (card.classList.contains('extra-card')) {
        const srcs = Array.from(card.querySelectorAll('.extra-item img')).slice(0, 4).map((i) => i.getAttribute('src'));
        attach(card, () => Promise.all(srcs.map(loadImg)));
        return;
      }
      // project 03 → the preview video, live
      const video = card.querySelector('.tease-video');
      if (video) {
        attach(card, async () => (video.readyState >= 2 ? [video] : []), null, true);
        return;
      }
      // project 02 → a still of the lampe berger 3d model (Images/p2-lamp-back.png),
      // rendered face-on so the back always shows the full silhouette
      if (card.id === 'project-02') {
        attach(card, async () => [await loadImg('Images/p2-lamp-back.png')]);
        return;
      }
      const img = card.querySelector('.card-media img');
      // anything else with a picture (project 01)
      if (img) attach(card, async () => [await loadImg(img.getAttribute('src'))]);
    });
  }

  // start right away (scrambling until each picture is ready); once everything has loaded
  // (images, fonts) the cards are their final size, so redraw the still pictures to fit
  setup();
  const refit = () => allStates.forEach((st) => { if (!st.live) st.render(); });
  if (document.readyState !== 'complete') window.addEventListener('load', () => setTimeout(refit, 50));
})();
