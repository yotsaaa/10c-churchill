/**
 * natalie churchill — 10c f26
 * briar runs back and forth along the bottom of the page.
 * click her: she stops, turns to face you and dances the whole dance, then runs on.
 * click her 5 times quickly: she plays her death animation, fades away, and comes
 * running back in from the left a moment later.
 * model: models/briar-web.glb — a small web copy of models/briar-2.glb ("Run_Base")
 * with "Dance" (models/briar dance.glb) and "Death" (models/briar death.glb) added in.
 * size: change --walker-h on .walker in css/ring.css. speed etc: the numbers below.
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
  const DEATH_CLICKS = 5;       // clicks in a row that set off the death animation
  const CLICK_GAP_MS = 1200;    // clicks further apart than this start the count again
  const FADE_AT = 2.6;          // seconds into the death animation when she starts fading away
  const RESPAWN_MS = 1800;      // how long she's gone (after fading) before running back in
  const DEATH_MAX_MS = 7000;    // backup only
  const RUN = 'Run_Base', DANCE = 'Dance', DEATH = 'Death';
  // which way the camera looks at her: from her left side (running right), her right side
  // (running left), or straight on (dancing, facing you)
  const SIDE = { '1': '-90deg 82deg 4m', '-1': '90deg 82deg 4m', front: '0deg 82deg 4m' };
  // where the camera points (height of her middle) — a touch lower while dancing so her feet
  // stay on the bottom edge; shifted back while dying so the knock-back stays in frame
  const TARGET = { run: '0m 0.78m 0m', dance: '0m 0.67m 0m', death: '0m 0.74m -0.55m' };
  // the death animation starts her a little ahead of where she runs, then knocks her back —
  // nudge the box by this much (in "walker heights") so it starts right where she was
  const DEATH_SHIFT = 0.71;

  let x = -9999, dir = 1, last = null, turnUntil = 0;
  let dancing = false, danceTimer = null, danceStart = 0, danceLastT = 0;
  let dead = false, deathStart = 0, faded = false, deathTimer = null;
  let clicks = 0, lastClick = 0;

  const loaderUp = () => !!document.getElementById('ascii-loader-root');

  function face(d) {
    dir = d;
    if (!dancing && !dead) mv.setAttribute('camera-orbit', SIDE[String(d)]);
  }

  function frame(now) {
    const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    const { width, height } = walker.getBoundingClientRect();
    const maxX = window.innerWidth - width;

    if (x === -9999) x = -width * 0.6;        // start just off the left edge
    if (!loaderUp() && !dancing && !dead && now > turnUntil) {
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
    // dying: fade her out while she's down, before she drops out of sight
    if (dead && !faded && now - deathStart > 300 && mv.currentTime >= FADE_AT) fadeAway();
    walker.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
    requestAnimationFrame(frame);
  }

  function stopDancing() {
    if (!dancing) return;
    clearTimeout(danceTimer);
    dancing = false;
    walker.classList.remove('dancing');
    if (dead) return;                           // the death animation took over
    mv.setAttribute('camera-orbit', SIDE[String(dir)]);
    mv.setAttribute('camera-target', TARGET.run);
    mv.animationName = RUN;
    mv.play();                                  // loops forever again
    turnUntil = performance.now() + TURN_MS;    // let her turn back before running off
  }

  // she dances the whole dance once (clicks while she's dancing don't restart it), then runs on
  function dance() {
    if (dancing || dead) return;
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

  function die() {
    if (dead) return;
    dead = true;
    stopDancing();
    walker.classList.add('dead');
    // side view, camera pulled back along her path, box nudged so she starts where she stood
    mv.setAttribute('camera-orbit', SIDE[String(dir)]);
    mv.setAttribute('camera-target', TARGET.death);
    if (mv.jumpCameraToGoal) mv.jumpCameraToGoal();
    x -= dir * DEATH_SHIFT * walker.getBoundingClientRect().height;
    mv.animationName = DEATH;
    mv.currentTime = 0;
    mv.play({ repetitions: 1 });
    deathStart = performance.now();
    faded = false;
    deathTimer = setTimeout(fadeAway, DEATH_MAX_MS);   // backup
  }

  function fadeAway() {
    if (!dead || faded) return;
    faded = true;
    clearTimeout(deathTimer);
    walker.classList.add('gone');
    setTimeout(respawn, RESPAWN_MS);
  }

  // back to life: running in from the left edge again
  function respawn() {
    const { width } = walker.getBoundingClientRect();
    x = -width * 0.6;
    dir = 1;
    dead = false;
    walker.classList.remove('dead');
    mv.setAttribute('camera-orbit', SIDE['1']);
    mv.setAttribute('camera-target', TARGET.run);
    if (mv.jumpCameraToGoal) mv.jumpCameraToGoal();
    mv.animationName = RUN;
    mv.play();
    turnUntil = 0;
    walker.classList.remove('gone');
  }

  // every click counts toward the death; the first one starts the dance
  function tap() {
    if (!walker.classList.contains('ready') || dead) return;
    const now = performance.now();
    clicks = now - lastClick > CLICK_GAP_MS ? 1 : clicks + 1;
    lastClick = now;
    if (clicks >= DEATH_CLICKS) { clicks = 0; die(); }
    else dance();
  }

  if (hit) {
    hit.addEventListener('click', (e) => { e.stopPropagation(); tap(); });
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); }
    });
  }

  face(1);
  mv.addEventListener('load', () => { mv.play(); walker.classList.add('ready'); });
  requestAnimationFrame(frame);
})();
