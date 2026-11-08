/**
 * natalie churchill — 10c f26
 * briar runs back and forth along the bottom of the page.
 * click her: she stops, turns to face you and dances the whole dance, then runs on.
 * model: models/briar-web.glb — a small web copy of models/briar-2.glb ("Run_Base")
 * with the "Dance" animation from models/briar dance.glb added in.
 * size: change --walker-h on .walker in css/ring.css. speed: the numbers below.
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
  const DANCE_MAX_MS = 9000;    // backup only — she dances the whole dance animation (about 6.8 s)
  const RUN = 'Run_Base', DANCE = 'Dance';
  // which way the camera looks at her: from her left side (running right), her right side
  // (running left), or straight on (dancing, facing you)
  const SIDE = { '1': '-90deg 82deg 4m', '-1': '90deg 82deg 4m', front: '0deg 82deg 4m' };
  // where the camera points (height of her middle) — a touch lower while dancing so her feet stay on the bottom edge
  const TARGET = { run: '0m 0.78m 0m', dance: '0m 0.67m 0m' };

  let x = -9999, dir = 1, last = null, turnUntil = 0, dancing = false, danceTimer = null;
  let danceStart = 0, danceLastT = 0;

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
    // the dance is over once its clock reaches the end (or jumps back to the start to loop)
    if (dancing && now - danceStart > 1000) {
      const t = mv.currentTime, end = mv.duration;
      if ((end && t >= end - 0.04) || t < danceLastT - 0.5) stopDancing();
      danceLastT = t;
    }
    walker.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    requestAnimationFrame(frame);
  }

  function stopDancing() {
    if (!dancing) return;
    clearTimeout(danceTimer);
    dancing = false;
    walker.classList.remove('dancing');
    mv.setAttribute('camera-orbit', SIDE[String(dir)]);
    mv.setAttribute('camera-target', TARGET.run);
    mv.animationName = RUN;
    mv.play();                                  // loops forever again
    turnUntil = performance.now() + TURN_MS;    // let her turn back before running off
  }

  // she dances the whole dance once (clicks while she's dancing are ignored), then runs on
  function dance() {
    if (!walker.classList.contains('ready') || dancing) return;
    dancing = true;
    walker.classList.add('dancing');
    mv.setAttribute('camera-orbit', SIDE.front);
    mv.setAttribute('camera-target', TARGET.dance);
    mv.animationName = DANCE;
    mv.currentTime = 0;
    mv.play();
    danceStart = performance.now();
    danceLastT = 0;
    // backup in case the end of the dance is somehow missed
    danceTimer = setTimeout(stopDancing, DANCE_MAX_MS);
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
