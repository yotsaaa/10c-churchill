/**
 * natalie churchill — 10c f26
 * briar runs back and forth along the bottom of the page, behind the cards.
 * model: models/briar-web.glb (a small web copy of models/briar-2.glb, with its "Run_Base" animation).
 * size: change --walker-h on .walker in css/ring.css. speed: SPEED below.
 */

(function () {
  const walker = document.querySelector('.walker');
  if (!walker) return;
  const mv = walker.querySelector('model-viewer');
  if (!mv) return;

  // hide her for people who've asked their computer for less motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    walker.remove();
    return;
  }

  // how far she runs each second, in "walker heights" — 1 matches her stride so her feet don't slide
  const SPEED = 1;
  const TURN_MS = 450;          // little pause while she turns round at each edge
  // which way the camera looks at her: from her left side (running right) or her right side (running left)
  const SIDE = { '1': '-90deg 82deg 4m', '-1': '90deg 82deg 4m' };

  let x = -9999, dir = 1, last = null, turnUntil = 0;

  const box = () => walker.getBoundingClientRect();
  const loaderUp = () => !!document.getElementById('ascii-loader-root');

  function face(d) {
    dir = d;
    mv.setAttribute('camera-orbit', SIDE[String(d)]);
  }

  function frame(now) {
    const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    const { width, height } = box();
    const maxX = window.innerWidth - width;

    if (x === -9999) x = -width * 0.6;        // start just off the left edge
    if (!loaderUp() && now > turnUntil) {
      x += dir * SPEED * height * dt;
      // run a little past each edge, then turn round
      if (dir > 0 && x > maxX + width * 0.6) { x = maxX + width * 0.6; face(-1); turnUntil = now + TURN_MS; }
      if (dir < 0 && x < -width * 0.6)        { x = -width * 0.6;       face(1);  turnUntil = now + TURN_MS; }
    }
    walker.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    requestAnimationFrame(frame);
  }

  face(1);
  mv.addEventListener('load', () => { mv.play(); walker.classList.add('ready'); });
  requestAnimationFrame(frame);
})();
