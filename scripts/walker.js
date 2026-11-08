/**
 * natalie churchill — 10c f26
 * briar runs back and forth along the bottom of the page.
 * click her: she stops, turns to face you and dances the whole dance, then runs on.
 * click her 5 times quickly: she plays her death animation right where she is, stays
 * down for a moment, blinks out, drops back in with her respawn animation and runs on.
 * model: models/briar-web.glb — a small web copy of models/briar-2.glb ("Run_Base") with
 * "Dance" (models/briar dance.glb), "Death" (models/briar death.glb) and "Respawn"
 * (models/briar respawn.glb) added in. the death & respawn are pinned in place; the death
 * ends with her exploded and only her pillory left on the ground.
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
  const DOWN_MS = 1000;         // how long she holds the last frame of the death before respawning
  const BLINK_MS = 350;         // quick fade out before the respawn (and back in as she drops)
  const DEATH_MAX_MS = 7000;    // backup only
  const RUN = 'Run_Base', DANCE = 'Dance', DEATH = 'Death';
  const RESPAWN = 'Respawn';    // played between lying down and running, if the model has it
  // which way the camera looks at her: from her left side (running right), her right side
  // (running left), or straight on (dancing, facing you)
  const SIDE = { '1': '-90deg 82deg 4m', '-1': '90deg 82deg 4m', front: '0deg 82deg 4m' };
  // where the camera points (height of her middle) — a touch lower while dancing so her feet
  // stay on the bottom edge
  // (and a touch lower while she dies, so the pillory lying on the ground isn't cut off by the bottom edge)
  const TARGET = { run: '0m 1.26m 0m', dance: '0m 1.15m 0m', death: '0m 1.1m 0m' };
  const BOX = 1.5;              // her box is this many times her size (see .walker in css/ring.css)

  let x = -9999, dir = 1, last = null, turnUntil = 0;
  let dancing = false, danceTimer = null, danceStart = 0, danceLastT = 0;
  // dead: false, or which part of dying she's in — 'dying' → 'down' → 'blink' → 'up' → running again
  let dead = false, phaseStart = 0, phaseLastT = 0, deathTimer = null;
  let clicks = 0, lastClick = 0;

  const loaderUp = () => !!document.getElementById('ascii-loader-root');

  function face(d) {
    dir = d;
    if (!dancing && !dead) mv.setAttribute('camera-orbit', SIDE[String(d)]);
  }

  function frame(now) {
    const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    const { width } = walker.getBoundingClientRect();
    const size = width / BOX;                   // how big she is
    // she runs until her middle is a little past each edge, then turns round
    const minX = -width / 2 - size * 0.1;
    const maxX = window.innerWidth - width / 2 + size * 0.1;

    if (x === -9999) x = minX;                  // start just off the left edge
    if (!loaderUp() && !dancing && !dead && now > turnUntil) {
      x += dir * SPEED * size * dt;
      if (dir > 0 && x > maxX) { x = maxX; face(-1); turnUntil = now + TURN_MS; }
      if (dir < 0 && x < minX) { x = minX; face(1);  turnUntil = now + TURN_MS; }
    }
    // the dance is over once its clock reaches the end (or jumps back to the start to loop)
    if (dancing && now - danceStart > 1000) {
      const t = mv.currentTime, end = mv.duration;
      if ((end && t >= end - 0.05) || t < danceLastT - 0.5) stopDancing();
      danceLastT = t;
    }
    if (dead) deathStep(now);
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
    mv.play({ repetitions: 1 });               // once, holding the last frame (never loops back)
    danceStart = performance.now();
    danceLastT = 0;
    // backup in case the end of the dance is somehow missed
    danceTimer = setTimeout(stopDancing, DANCE_MAX_MS);
  }

  function die() {
    if (dead) return;
    stopDancing();
    dead = 'dying';
    walker.classList.add('dead');
    // right where she's standing, turned to face you (like the dance)
    mv.setAttribute('camera-orbit', SIDE.front);
    mv.setAttribute('camera-target', TARGET.death);
    playOnce(DEATH);
    deathTimer = setTimeout(getUp, DEATH_MAX_MS);   // backup
  }

  // play an animation once, holding its last frame — so it never jumps back to its first
  // frame (e.g. the respawn starts with her up in the air) before the next one takes over
  function playOnce(name) {
    mv.animationName = name;
    mv.currentTime = 0;
    mv.play({ repetitions: 1 });
    phaseStart = performance.now();
    phaseLastT = 0;
  }

  // true once the current animation has reached its end (or looped back round)
  function reachedEnd(now) {
    if (now - phaseStart < 400) return false;
    const t = mv.currentTime, end = mv.duration;
    const done = (end && t >= end - 0.05) || t < phaseLastT - 0.3;
    phaseLastT = t;
    return done;
  }

  function deathStep(now) {
    if (dead === 'dying' && reachedEnd(now)) {
      // freeze on the last frame
      mv.pause();
      mv.currentTime = Math.max(0, mv.duration - 0.001);
      dead = 'down';
      phaseStart = now;
    } else if (dead === 'down' && now - phaseStart > DOWN_MS) {
      getUp();
    } else if (dead === 'blink' && now - phaseStart > BLINK_MS) {
      // invisible now — start the respawn and fade back in as she drops into place
      dead = 'up';
      mv.setAttribute('camera-orbit', SIDE[String(dir)]);   // back to side-on for the respawn & run
      mv.setAttribute('camera-target', TARGET.run);
      if (mv.jumpCameraToGoal) mv.jumpCameraToGoal();
      playOnce(RESPAWN);
      walker.classList.remove('blink');
    } else if (dead === 'up' && reachedEnd(now)) {
      // hold her landing pose so the run blends in from her standing on the ground
      mv.pause();
      mv.currentTime = Math.max(0, mv.duration - 0.001);
      runAgain();
    }
  }

  function getUp() {
    clearTimeout(deathTimer);
    if ((mv.availableAnimations || []).includes(RESPAWN)) {
      dead = 'blink';
      phaseStart = performance.now();
      walker.classList.add('blink');
      deathTimer = setTimeout(runAgain, DEATH_MAX_MS);   // backup
    } else {
      runAgain();
    }
  }

  function runAgain() {
    clearTimeout(deathTimer);
    dead = false;
    walker.classList.remove('dead', 'blink');
    mv.setAttribute('camera-orbit', SIDE[String(dir)]);
    mv.setAttribute('camera-target', TARGET.run);
    mv.animationName = RUN;
    mv.play();
    turnUntil = performance.now() + TURN_MS;
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
