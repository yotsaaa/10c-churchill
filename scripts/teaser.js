/**
 * natalie churchill — 10c f26
 * project 03 teaser: a fake "video" screen of flickering static + a running
 * timecode, until the real video project is ready. delete this file (and its
 * <script> tag) once project 03 has its actual video.
 */

(function () {
  const screens = document.querySelectorAll('.tease-screen');
  if (!screens.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // mostly empty, some light static, a few heavier specks
  const NOISE = '          ········..::░░▒▓⋆˚';
  const FPS = 12;

  function fill(pre) {
    const box = pre.getBoundingClientRect();
    const cols = Math.max(10, Math.ceil(box.width / 6) + 2);
    const rows = Math.max(5, Math.ceil(box.height / 10) + 1);
    let out = '';
    // a soft rolling band, like a bad vhs tracking line
    const band = (performance.now() / 60) % (rows + 8) - 4;
    for (let r = 0; r < rows; r++) {
      const near = Math.abs(r - band) < 1.5;
      for (let c = 0; c < cols; c++) {
        const n = Math.random() * (near ? 0.6 : 1);
        out += NOISE[Math.floor(Math.pow(1 - n, 1.6) * NOISE.length) % NOISE.length];
      }
      out += '\n';
    }
    pre.textContent = out;
  }

  const start = performance.now();
  function timecode() {
    const t = (performance.now() - start) / 1000;
    const pad = (n) => String(Math.floor(n)).padStart(2, '0');
    return `00:${pad((t / 60) % 60)}:${pad(t % 60)}:${pad((t * 24) % 24)}`;
  }

  function tick() {
    screens.forEach((s) => {
      const card = s.closest('.ring-card');
      if (card && card.classList.contains('show-back')) return; // facing away
      fill(s.querySelector('.tease-noise'));
      const tc = s.querySelector('.tease-tc');
      if (tc) tc.textContent = timecode();
    });
  }

  if (reduceMotion) {
    screens.forEach((s) => fill(s.querySelector('.tease-noise')));
    return;
  }
  setInterval(() => { if (!document.hidden) tick(); }, 1000 / FPS);
  tick();
})();
