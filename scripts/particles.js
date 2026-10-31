/**
 * falling particles — little ascii bits that drift down off the bottom of the card ring.
 *
 * self-contained: to remove it, delete the two lines marked "particles" in index.html
 * (or delete this file + css/particles.css). nothing else depends on it.
 *
 * tweak:
 *   RATE      particles per second (desktop). phones get about half.
 *   GRAVITY   how fast they speed up as they fall
 *   LIFE_MS   how long each one lasts before it has faded out
 *   GLYPHS    the characters it uses
 */
(() => {
  const RATE = 22;
  const GRAVITY = 0.018;       // px per frame², at 60fps
  const LIFE_MS = 3200;
  const GLYPHS = ['·', '.', '˚', '*', '+', '✧', '°', ',', '`'];
  const COLORS = ['#f4a6c2', '#fbcfe8', '#ffffff', '#9e6b7f'];   // pink, soft pink, white, dim pink
  const MAX = 260;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'particle-field';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const cards = Array.from(document.querySelectorAll('.ring-card'));
  const lastX = new Map();          // each card's centre last frame, so bits inherit the spin
  const parts = [];
  let carry = 0, last = performance.now();

  const loaderUp = () => !!document.getElementById('ascii-loader-root');
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function spawnFrom(rect, vxCard) {
    if (parts.length >= MAX) return;
    const size = 9 + Math.random() * 6;
    parts.push({
      x: rect.left + Math.random() * rect.width,
      y: rect.bottom - 2 - Math.random() * 6,
      vx: vxCard * 0.35 + (Math.random() - 0.5) * 0.35,
      vy: 0.15 + Math.random() * 0.45,
      sway: Math.random() * Math.PI * 2,
      born: performance.now(),
      life: LIFE_MS * (0.6 + Math.random() * 0.6),
      glyph: pick(GLYPHS),
      color: pick(COLORS),
      size,
      peak: 0.45 + Math.random() * 0.5,
    });
  }

  function frame(now) {
    const dt = Math.min(50, now - last) / 16.67;   // in 60fps frames
    last = now;
    ctx.clearRect(0, 0, w, h);

    if (!document.hidden && !loaderUp()) {
      // which cards are on screen, how big, and how fast they're sliding sideways
      const live = [];
      let total = 0;
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const vx = lastX.has(c) ? (cx - lastX.get(c)) / Math.max(dt, 0.01) : 0;
        lastX.set(c, cx);
        if (r.width < 20 || r.bottom < 0 || r.top > h) return;
        const weight = r.width * r.width;          // big (front) cards shed more than small (back) ones
        live.push({ r, vx, weight });
        total += weight;
      });

      const rate = RATE * (w < 700 ? 0.5 : 1);
      carry += (rate * dt) / 60;
      while (carry >= 1 && total > 0) {
        carry -= 1;
        let t = Math.random() * total;
        const src = live.find((l) => (t -= l.weight) <= 0) || live[live.length - 1];
        spawnFrom(src.r, src.vx);
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const age = now - p.born;
      if (age > p.life || p.y > h + 20) { parts.splice(i, 1); continue; }
      p.vy += GRAVITY * dt;
      p.vx *= Math.pow(0.985, dt);
      p.sway += 0.04 * dt;
      p.x += (p.vx + Math.sin(p.sway) * 0.25) * dt;
      p.y += p.vy * dt;
      const k = age / p.life;
      const fade = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;   // quick fade in, slow fade out
      ctx.globalAlpha = Math.max(0, fade) * p.peak;
      ctx.fillStyle = p.color;
      ctx.font = `${p.size.toFixed(1)}px 'Space Mono', 'MS Gothic', 'Courier New', monospace`;
      ctx.fillText(p.glyph, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
