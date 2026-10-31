/**
 * ascii video background — the project 03 preview video, redrawn in text symbols
 * across the whole page behind everything (same look as the card backs).
 *
 * self-contained: to remove it, delete the two lines marked "ascii bg" in index.html.
 *
 * tweak:
 *   FONT_PX    size of each character (smaller = more detail, more work for the browser)
 *   FPS        how often it redraws
 *   css/ascii-bg.css → --ascii-bg-opacity for how strong it shows
 */
(() => {
  const RAMP = " .'`:-=+*o%#@";   // dark → bright
  const FONT_PX = 9;
  const CHAR_W = 0.6;             // monospace width as a fraction of height
  const FPS = 10;

  const video = document.querySelector('.tease-video');
  if (!video) return;

  const pre = document.createElement('pre');
  pre.className = 'ascii-bg';
  pre.setAttribute('aria-hidden', 'true');
  pre.style.fontSize = FONT_PX + 'px';
  pre.style.lineHeight = FONT_PX + 'px';
  document.body.prepend(pre);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let cols = 0, rows = 0;
  function resize() {
    cols = Math.ceil(window.innerWidth / (FONT_PX * CHAR_W)) + 1;
    rows = Math.ceil(window.innerHeight / FONT_PX) + 1;
    canvas.width = cols; canvas.height = rows;
  }
  resize();
  window.addEventListener('resize', resize);

  function render() {
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || video.readyState < 2) return;
    // cover-fit the video into a cols×rows grid (each canvas pixel = one character)
    const cellW = FONT_PX * CHAR_W, cellH = FONT_PX;
    const W = cols * cellW, H = rows * cellH;
    const s = Math.max(W / vw, H / vh);
    const dw = vw * s, dh = vh * s;
    ctx.setTransform(1 / cellW, 0, 0, 1 / cellH, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
    let data;
    try { data = ctx.getImageData(0, 0, cols, rows).data; } catch (e) { return; }
    let out = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        out += RAMP[Math.round(Math.pow(lum, 0.9) * (RAMP.length - 1))];
      }
      out += '\n';
    }
    pre.textContent = out;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    // one still frame instead of moving ascii
    video.addEventListener('loadeddata', render, { once: true });
    render();
    return;
  }
  setInterval(() => { if (!document.hidden) render(); }, 1000 / FPS);
})();
