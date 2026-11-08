/**
 * natalie churchill — 10c f26
 * briar runs back and forth along the bottom of the page.
 * click her: she stops, turns to face you and dances for a few seconds, then runs on.
 * model: models/briar-web.glb — a small web copy of models/briar-2.glb ("Run_Base")
 * with the "Dance" animation from models/briar dance.glb added in.
 * size: change --walker-h on .walker in css/ring.css. speed / dance length: the numbers below.
 */

(function () {
  const walker = document.querySelector('.walker');
  if (!walker) return;
  const mv = walker.querySelector('model-viewer');
  const hit = walker.querySelector('.walker-hit');
  if (!mv) return;

  // hide her for people who've asked their computer for less motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    walker.remove();
    return;
  }

  // how far she runs each second, in "walker heights" — 1 matches her stride so her feet don't slide
  const SPEED = 1;
  const TURN_MS = 450;          // little pause while she turns round at each edge
  const DANCE_MS = 3000;        // how long she dances when clicked
  const RUN = 'Run_Base', DANCE = 'Dance';
  // which way the camera looks at her: from her left side (running right), her right side
  // (running left), or straight on (dancing, facing you)
  const SIDE = { '1': '-90deg 82deg 4m', '-1': '90deg 82deg 4m', front: '0deg 82deg 4m' };

  let x = -9999, dir = 1, last = null, turnUntil = 0, dancing = false, danceTimer = null;

  const loaderUp = () => !!document.getElementById('ascii-loader-root');

  function face(d) {
    dir = d;
    if (!dancing) mv.setAttribute('camera-orbit', SIDE[String(d)]);
  }

  function frame(now) {
    const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    const { width, height } = walker.getBoundingClientRect();
    const maxX = window.innerWidth - width;

    if (x === -9999) x = -width * 0.6;        // start just off the left edge
    if (!loaderUp() && !dancing && now > turnUntil) {
      x += dir * SPEED * height * dt;
      // run a little past each edge, then turn round
      if (dir > 0 && x > maxX + width * 0.6) { x = maxX + width * 0.6; face(-1); turnUntil = now + TURN_MS; }
      if (dir < 0 && x < -width * 0.6)        { x = -width * 0.6;       face(1);  turnUntil = now + TURN_MS; }
    }
    walker.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    requestAnimationFrame(frame);
  }

  function dance() {
    if (!walker.classList.contains('ready')) return;
    clearTimeout(danceTimer);
    if (!dancing) {
      dancing = true;
      walker.classList.add('dancing');
      mv.setAttribute('camera-orbit', SIDE.front);
      mv.animationName = DANCE;
      mv.currentTime = 0;
      mv.play();
    }
    // clicking again while she dances keeps her dancing a bit longer
    danceTimer = setTimeout(() => {
      dancing = false;
      walker.classList.remove('dancing');
      mv.setAttribute('camera-orbit', SIDE[String(dir)]);
      mv.animationName = RUN;
      mv.play();
      turnUntil = performance.now() + TURN_MS;   // let her turn back before running off
    }, DANCE_MS);
  }

  if (hit) {
    hit.addEventListener('click', (e) => { e.stopPropagation(); dance(); });
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dance(); }
    });
  }

  face(1);
  mv.addEventListener('load', () => { mv.play(); walker.classList.add('ready'); });
  requestAnimationFrame(frame);
})();
