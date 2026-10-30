/**
 * natalie churchill — 10c f26
 * cursor trail: little pink * fall off the cursor as you move it, then fade.
 * drawn on one see-through canvas on top of the page (clicks pass through it).
 */

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;   // mouse/trackpad only, not phones

  // ---- tunables -----------------------------------------------------------
  const CHARS = ['*', '*', '*', '✦', '·'];            // mostly asterisks, a few extras
  const COLORS = ['#f4a6c2', '#fbcfe8', '#ff8fc0', '#ffffff', '#f4a6c2'];
  const SPACING = 9;        // px of mouse movement per new *  (smaller = more)
  const GRAVITY = 0.06;     // how fast they fall
  const LIFE = [55, 95];    // how long each lasts, in frames (~60 per second)
  const SIZE = [10, 17];    // font size range in px
  const MAX = 160;          // cap so it never gets heavy

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100vw', height: '100vh',
    pointerEvents: 'none', zIndex: '9999'
  });
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const parts = [];
  let lastX = null, lastY = null, running = false;

  function spawn(x, y, dx, dy) {
    if (parts.length >= MAX) parts.shift();
    const life = rand(LIFE[0], LIFE[1]);
    parts.push({
      x: x + rand(-3, 3), y: y + rand(-2, 4),
      vx: rand(-0.6, 0.6) - dx * 0.04,     // a little kick opposite to the movement
      vy: rand(-0.8, 0.2),                 // a tiny hop before falling
      rot: rand(-0.6, 0.6), spin: rand(-0.05, 0.05),
      size: rand(SIZE[0], SIZE[1]),
      ch: pick(CHARS), color: pick(COLORS),
      life, max: life
    });
    if (!running) { running = true; requestAnimationFrame(tick); }
  }

  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += GRAVITY;
      p.vx *= 0.985;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.spin;
      p.life--;
      if (p.life <= 0 || p.y > innerHeight + 20) { parts.splice(i, 1); continue; }
      const t = p.life / p.max;
      ctx.save();
      ctx.globalAlpha = Math.min(1, t * 1.6);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.font = `${p.size.toFixed(1)}px 'Space Mono', 'Courier New', monospace`;
      ctx.fillStyle = p.color;
      ctx.shadowColor = 'rgba(244, 166, 194, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(p.ch, 0, 0);
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(tick);
    else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    // the tip of the custom cursor is the click point; drop the * just under it
    const x = e.clientX + 4, y = e.clientY + 10;
    if (lastX === null) { lastX = x; lastY = y; return; }
    const dx = x - lastX, dy = y - lastY;
    const dist = Math.hypot(dx, dy);
    if (dist < SPACING) return;
    // fill in along fast movements so the trail doesn't get gappy
    const steps = Math.min(4, Math.floor(dist / SPACING));
    for (let s = 1; s <= steps; s++) spawn(lastX + (dx * s) / steps, lastY + (dy * s) / steps, dx, dy);
    lastX = x; lastY = y;
  }, { passive: true });
  document.addEventListener('mouseleave', () => { lastX = lastY = null; });

  function start() {
    resize();
    document.body.appendChild(canvas);
    window.addEventListener('resize', resize);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
