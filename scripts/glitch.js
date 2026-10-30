/**
 * natalie churchill — 10c f26
 * ambient glitch: every so often one random character somewhere on screen
 * flickers into a symbol for a split second, then goes back to normal.
 */

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ---- tunables -----------------------------------------------------------
  const GLYPHS = '▓▒░◇◆※∴∵◐◓◑◒⌁⌇⟡⊹✦✧';
  const EVERY_MS = [400, 1100];   // gap between flickers (random in this range)
  const HOLD_MS = [80, 320];     // how long a character stays a symbol
  const BURST_CHANCE = 0.06;     // small chance 2–3 neighbouring characters flicker together

  const SKIP = 'script, style, noscript, textarea, input, select, model-viewer, ' +
               '#ascii-loader-root, .sparkle-field, [data-no-glitch]';

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (s) => s[Math.floor(Math.random() * s.length)];

  let nodes = [], weights = [], total = 0, lastScan = 0;

  // collect text nodes that are actually on screen right now
  function scan() {
    nodes = []; weights = []; total = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!/\S/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        const el = n.parentElement;
        if (!el || el.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = walker.nextNode())) {
      const r = n.parentElement.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      if (getComputedStyle(n.parentElement).visibility === 'hidden') continue;
      const len = n.nodeValue.replace(/\s/g, '').length;
      nodes.push(n); total += len; weights.push(total);
    }
    lastScan = performance.now();
  }

  function flicker() {
    if (document.hidden) return schedule();
    if (performance.now() - lastScan > 1500) scan();
    if (!total) return schedule();

    // pick a character, weighted so longer text gets hit proportionally
    const r = Math.random() * total;
    const node = nodes[weights.findIndex((w) => w > r)];
    if (!node || !node.isConnected) return schedule();

    const text = node.nodeValue;
    const spots = [];
    for (let i = 0; i < text.length; i++) if (/\S/.test(text[i])) spots.push(i);
    if (!spots.length) return schedule();

    const start = pick(spots);
    const count = Math.random() < BURST_CHANCE ? 2 + Math.floor(Math.random() * 2) : 1;
    const swaps = [];
    let chars = Array.from(text);
    // Array.from keeps emoji/surrogate pairs whole; map string index -> char index
    let idx = Array.from(text.slice(0, start)).length;
    for (let k = 0; k < count && idx + k < chars.length; k++) {
      if (/\s/.test(chars[idx + k])) continue;
      const g = pick(GLYPHS);
      swaps.push({ i: idx + k, from: chars[idx + k], to: g });
      chars[idx + k] = g;
    }
    if (!swaps.length) return schedule();
    node.nodeValue = chars.join('');

    setTimeout(() => {
      // only put it back if nothing else has rewritten this text in the meantime
      if (!node.isConnected) return;
      const now = Array.from(node.nodeValue);
      if (!swaps.every((s) => now[s.i] === s.to)) return;
      swaps.forEach((s) => { now[s.i] = s.from; });
      node.nodeValue = now.join('');
    }, rand(HOLD_MS[0], HOLD_MS[1]));

    schedule();
  }

  function schedule() {
    setTimeout(flicker, rand(EVERY_MS[0], EVERY_MS[1]));
  }

  // wait until the loading screen has finished so it never bakes a symbol in
  function startWhenReady() {
    if (document.getElementById('ascii-loader-root')) return setTimeout(startWhenReady, 400);
    setTimeout(() => { scan(); schedule(); }, 1200);
  }
  // (small delay first so the loader has had a chance to appear)
  window.addEventListener('load', () => setTimeout(startWhenReady, 300));
})();
