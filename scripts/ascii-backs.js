/**
 * natalie churchill — 10c f26
 * ascii card backs: when a card turns away on the ring, its back shows that
 * card's own picture redrawn in text symbols.
 *   about card      → the site icon (rose vine)
 *   project 01      → the uncanny valley collage
 *   project 02      → a snapshot of the 3d model
 *   project 03      → the preview video, live, as moving ascii
 *   in-class demos  → its looping preview video, live, the same way
 *   gallery cards   → their first four pieces as a 2×2 grid
 * everything is drawn once (except the live video), so it costs almost nothing.
 */

(function () {
  // ---- tunables -----------------------------------------------------------
  const RAMP = " .'`:-=+*o%#@";   // dark → bright (plain characters, all the same width)
  const FONT_PX = 7;              // size of each ascii character (smaller = more detail)
  const CHAR_W = 0.6;             // monospace character width, as a fraction of its height
  const LIVE_MS = 120;            // how often the project 03 video back refreshes

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

    const render = async () => {
      try {
        const srcs = await getSources();
        if (!srcs || !srcs.length) return;
        pre.textContent = toAscii(card, srcs, mode);
        back.classList.add('has-ascii');
      } catch (e) { /* keep the plain symbol pattern */ }
    };
    render();
    if (live) {
      setInterval(() => {
        if (card.classList.contains('show-back') && !document.hidden) render();
      }, LIVE_MS);
    }
  }

  function setup() {
    document.querySelectorAll('.ring-card').forEach((card) => {
      // about card → the site icon
      if (card.classList.contains('about-card')) {
        attach(card, async () => [await loadImg('Images/siteIcon.png')], 'alpha');
        return;
      }
      // in-class demos → its looping preview video, live (same as project 03)
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
      // project 02 → snapshot of the 3d model once it has loaded (the poster image until then)
      const mv = card.querySelector('model-viewer');
      const img = card.querySelector('.card-media img');
      if (mv) {
        const fromModel = async () => {
          try {
            if (mv.loaded && mv.toDataURL) return [await loadImg(mv.toDataURL('image/png'))];
          } catch (e) { /* fall through */ }
          return img ? [await loadImg(img.getAttribute('src'))] : [];
        };
        attach(card, fromModel);
        mv.addEventListener('load', () => setTimeout(() => {
          const pre = card.querySelector('.back-ascii');
          fromModel().then((s) => { if (s.length && pre) { pre.textContent = toAscii(card, s); pre.parentElement.classList.add('has-ascii'); } }).catch(() => {});
        }, 900));
        return;
      }
      // anything else with a picture (project 01)
      if (img) attach(card, async () => [await loadImg(img.getAttribute('src'))]);
    });
  }

  // wait for everything (images, fonts) so the cards are their real size
  if (document.readyState === 'complete') setup();
  else window.addEventListener('load', setup);
})();
