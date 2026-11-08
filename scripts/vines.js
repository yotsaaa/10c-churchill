/**
 * natalie churchill — 10c f26
 * ascii vines hanging down the left & right edges of the page, slowly swaying,
 * dropping little ascii petals that fade away as they fall.
 * drawn on one <canvas class="vines"> behind everything (see .vines in css/ring.css).
 *
 * tweak:
 *   SIZE          size of each character
 *   SWAY_PX       how far the vine tips swing
 *   SWAY_SEC      how long one slow sway takes
 *   PETALS_PER_SEC how often petals fall (both sides together)
 *   GLYPHS        which symbols are used for leaves, flowers and petals
 */

(function () {
  const canvas = document.querySelector('.vines');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SIZE = 13;               // px per character
  const STEP = SIZE * 0.92;      // vertical spacing of the vine
  const SWAY_PX = 16;
  const SWAY_SEC = 8;
  const PETALS_PER_SEC = 2;
  const FPS = 30;
  const FONT = SIZE + "px 'Space Mono', 'MS Gothic', 'Courier New', monospace";

  const GLYPHS = {
    leafLeft:  ['~', '<', '{', '%', '&', '❧'],
    leafRight: ['~', '>', '}', '%', '&', '❦'],
    bloom:     ['@', '✿', '❀', '*', '✾'],
    tip:       [',', "'", '.', '✿'],
    petal:     ['✿', '❀', '*', '·', '°', '⁎', '❦', '✾', ',']
  };
  // site palette: dusty rose stems, pink leaves, blush flowers
  const COLOR = {
    stem:  [158, 107, 127],
    leaf:  [244, 166, 194],
    bloom: [251, 207, 232]
  };
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';

  // a fixed random sequence, so the vines keep the same shape every visit
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const pick = (arr, r) => arr[Math.floor((r === undefined ? Math.random() : r) * arr.length) % arr.length];

  let W = 0, H = 0, dpr = 1, vines = [], petals = [];

  function build() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    seed = 7;
    vines = [];
    const zone = Math.max(46, Math.min(190, W * 0.13));     // how far in from each edge the vines grow
    const perSide = W < 700 ? 2 : W < 1100 ? 3 : 4;

    [-1, 1].forEach((side) => {
      for (let i = 0; i < perSide; i++) {
        const f = Math.min(0.95, Math.max(0.08, (i + 0.5 + (rnd() - 0.5) * 0.6) / perSide));
        const fromEdge = f * zone;
        const len = H * (0.32 + rnd() * 0.42) * (1 - f * 0.4);   // vines nearest the edge hang lowest
        const n = Math.max(6, Math.floor(len / STEP));
        const segs = [];
        for (let k = 0; k < n; k++) {
          let leaf = null;
          if (k > 1 && k < n - 1 && rnd() < 0.42) {
            const s = rnd() < 0.5 ? -1 : 1;
            const bloom = rnd() < 0.13;
            leaf = {
              side: s,
              bloom,
              ch: bloom ? pick(GLYPHS.bloom, rnd()) : pick(s < 0 ? GLYPHS.leafLeft : GLYPHS.leafRight, rnd()),
              wig: rnd() * Math.PI * 2
            };
          }
          segs.push(leaf);
        }
        vines.push({
          x0: side < 0 ? fromEdge : W - fromEdge,
          n, segs,
          tip: pick(GLYPHS.tip, rnd()),
          phase: rnd() * Math.PI * 2,
          amp: SWAY_PX * (0.6 + rnd() * 0.8),
          curl: (rnd() * 2 - 1) * 9,
          curlFreq: 0.12 + rnd() * 0.1,
          speed: 0.8 + rnd() * 0.45,
          alpha: 0.5 + rnd() * 0.35
        });
      }
    });
  }

  // where segment k of a vine is at time t (seconds)
  function point(v, k, t) {
    const u = k / Math.max(1, v.n - 1);
    const sway = Math.sin((t / SWAY_SEC) * Math.PI * 2 * v.speed + v.phase - u * 1.5);
    const x = v.x0 + v.curl * Math.sin(k * v.curlFreq * 3 + v.phase) * u + v.amp * sway * Math.pow(u, 1.4);
    return { x, y: k * STEP - 4 };
  }

  function stemChar(dx) {
    const s = dx / STEP;
    if (s > 0.32) return '\\';
    if (s < -0.32) return '/';
    if (s > 0.12) return ')';
    if (s < -0.12) return '(';
    return '|';
  }

  function drawVines(t) {
    vines.forEach((v) => {
      let p = point(v, 0, t);
      for (let k = 0; k < v.n; k++) {
        const next = k < v.n - 1 ? point(v, k + 1, t) : null;
        const fade = v.alpha * (1 - 0.35 * (k / v.n));      // tips a little softer
        if (next) {
          ctx.fillStyle = rgba(COLOR.stem, fade);
          ctx.fillText(stemChar(next.x - p.x), p.x, p.y);
        } else {
          ctx.fillStyle = rgba(COLOR.bloom, fade);
          ctx.fillText(v.tip, p.x, p.y);
        }
        const leaf = v.segs[k];
        if (leaf) {
          const wiggle = reduceMotion ? 0 : Math.sin(t * 1.6 + leaf.wig) * 1.3;
          ctx.fillStyle = rgba(leaf.bloom ? COLOR.bloom : COLOR.leaf, Math.min(1, fade + 0.12));
          ctx.fillText(leaf.ch, p.x + leaf.side * SIZE * 0.66 + wiggle, p.y);
        }
        if (next) p = next;
      }
    });
  }

  // ---- falling petals ------------------------------------------------------
  function spawnPetal(t) {
    const v = vines[Math.floor(Math.random() * vines.length)];
    if (!v) return;
    const leafy = [];
    v.segs.forEach((l, k) => { if (l) leafy.push(k); });
    const k = leafy.length ? pick(leafy) : v.n - 1;
    const p = point(v, k, t);
    const leaf = v.segs[k];
    petals.push({
      x: p.x + (leaf ? leaf.side * SIZE * 0.66 : 0),
      y: p.y,
      vy: 16 + Math.random() * 20,          // px per second
      drift: 6 + Math.random() * 12,        // side-to-side flutter
      ph: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 1.6,
      ch: pick(GLYPHS.petal),
      color: Math.random() < 0.5 ? COLOR.leaf : COLOR.bloom,
      a0: 0.55 + Math.random() * 0.35,
      born: t
    });
  }

  function drawPetals(t, dt) {
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.y += p.vy * dt;
      p.x += Math.sin(t * 1.4 + p.ph) * p.drift * dt;
      p.rot += p.vr * dt;
      // fade in quickly, then fade out the lower it gets
      const low = Math.max(0, 1 - p.y / (H * 0.95));
      const a = p.a0 * Math.min(1, (t - p.born) / 0.5) * Math.pow(low, 1.3);
      if (a < 0.01 || p.y > H) { petals.splice(i, 1); continue; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(p.rot) * 0.9);
      ctx.fillStyle = rgba(p.color, a);
      ctx.fillText(p.ch, 0, 0);
      ctx.restore();
    }
  }

  // ---- loop ----------------------------------------------------------------
  let last = null, lastDraw = 0, spawnDebt = 0;

  function render(t, dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawVines(t);
    if (!reduceMotion) drawPetals(t, dt);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - lastDraw < 1000 / FPS - 2) return;
    const t = now / 1000;
    const dt = last === null ? 0 : Math.min(0.1, t - last);
    last = t;
    lastDraw = now;
    spawnDebt += dt * PETALS_PER_SEC;
    while (spawnDebt >= 1) { spawnDebt -= 1; spawnPetal(t); }
    render(t, dt);
  }

  build();
  window.addEventListener('resize', () => { build(); if (reduceMotion) render(0, 0); });

  if (reduceMotion) {
    render(0, 0);                 // still vines, no swaying or falling
    if (document.fonts) document.fonts.ready.then(() => render(0, 0));
  } else {
    // start with a few petals already on their way down
    for (let i = 0; i < 6; i++) {
      spawnPetal(0);
      const p = petals[petals.length - 1];
      if (p) { p.y += Math.random() * H * 0.5; p.born = -1; }
    }
    requestAnimationFrame(frame);
  }
})();
