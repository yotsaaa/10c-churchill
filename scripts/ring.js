/**
 * natalie churchill — 10c f26
 * page 2 // 3d project ring
 * drag (or ← →) to spin · cursor tilts the ring · click a card to open it
 */

(function () {
  const stage = document.getElementById('ringStage');
  const tilt = document.getElementById('ringTilt');
  const cards = Array.from(document.querySelectorAll('.ring-card'));
  const dots = Array.from(document.querySelectorAll('.ring-dot'));
  const closeBtn = document.getElementById('ringClose');
  if (!stage || !tilt || !cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = cards.length;
  const STEP = 360 / N;

  // ---- tunables -----------------------------------------------------------
  const DRAG_SPEED = 0.28;      // degrees of spin per pixel dragged
  const FRICTION = 0.93;        // how quickly a flick slows down (closer to 1 = longer glide)
  const SNAP = 0.08;            // how strongly it settles on the nearest card
  const TILT_X = 2.5, TILT_Y = 4; // max cursor tilt in degrees (subtle)
  const TILT_EASE = 0.025;        // how lazily the tilt follows the cursor (smaller = slower)
  const FACE = 0.32;            // how much side cards turn away (0 = always face you)
  const AUTO_ADVANCE_MS = 6500; // idle time before it spins to the next project

  // ---- state --------------------------------------------------------------
  let angle = 0;                // start facing the first card (the about card)
  let velocity = 0;
  let target = 0;               // the angle we settle on
  let focused = -1;
  let dragging = false, moved = 0, lastX = 0, downX = 0, downY = 0;
  let tiltTarget = { x: 0, y: 0 }, tiltNow = { x: 0, y: 0 };
  let lastInteraction = performance.now();
  const start = performance.now();

  // wider ring on big screens so the side cards peek out more
  // open / close animation speed (per frame, 0–1: smaller = slower & floatier)
  const DEPTH_BLUR = 4;          // px of blur on the card furthest back (0 = no blur)
  const OPEN_EASE = 0.12;
  const CLOSE_EASE = 0.06;
  const openMix = cards.map(() => 0);
  let fadeMix = 0;
  let lastPassing = 0;
  const click = () => { if (window.siteClick) window.siteClick(); };

  // ---- card backs: symbol pattern + card number, shown when a card faces away
  const BACK_GLYPHS = ['✦', '·', '⋆', '˚', '✧', '·', '∴', '·', '◇', '·'];
  function buildBack(card, label) {
    const back = document.createElement('div');
    back.className = 'card-back';
    back.setAttribute('aria-hidden', 'true');
    let rows = [];
    for (let r = 0; r < 34; r++) {
      let row = '';
      for (let c = 0; c < 40; c++) row += BACK_GLYPHS[(r * 3 + c * 2) % BACK_GLYPHS.length] + ' ';
      rows.push(row);
    }
    back.innerHTML = '<pre class="back-pattern"></pre>' +
      '<div class="back-emblem">@}-&gt;--<br><span class="back-num">✩ ' + label + ' ✩</span><br><small>natalie churchill</small></div>';
    back.querySelector('pre').textContent = rows.join('\n');
    card.appendChild(back);
  }
  cards.forEach((card, i) => buildBack(card, (dots[i] && dots[i].textContent.trim()) || String(i)));

  const radius = () => cards[0].offsetWidth * (innerWidth > 700 ? 1.25 : 0.95);
  const frontIndex = () => ((Math.round(-target / STEP) % N) + N) % N;

  // ---- render loop --------------------------------------------------------
  // the symbol loading screen sits on top at first — hold the ring until it's gone
  const loaderUp = () => !!document.getElementById('ascii-loader-root');

  function frame(now) {
    if (loaderUp()) lastInteraction = now;
    // spin physics: free glide while flicked, then settle on nearest card
    if (!dragging && !loaderUp()) {
      if (Math.abs(velocity) > 0.05) {
        angle += velocity;
        velocity *= FRICTION;
        target = Math.round(angle / STEP) * STEP;
      } else {
        velocity = 0;
        angle += (target - angle) * (reduceMotion ? 1 : SNAP);
      }
    }

    // idle auto-advance (not while a card is open)
    if (!reduceMotion && focused < 0 && !dragging && now - lastInteraction > AUTO_ADVANCE_MS) {
      target -= STEP;
      lastInteraction = now;
    }

    // cursor tilt (eased); softer while a card is open so text stays readable
    const k = focused >= 0 ? 0.2 : 1;
    tiltNow.x += (tiltTarget.x * k - tiltNow.x) * TILT_EASE;
    tiltNow.y += (tiltTarget.y * k - tiltNow.y) * TILT_EASE;
    tilt.style.transform = `rotateX(${tiltNow.x}deg) rotateY(${tiltNow.y}deg)`;

    const R = radius();
    const t = (now - start) / 1000;
    const anyOpen = focused >= 0 ? 1 : 0;
    fadeMix += (anyOpen - fadeMix) * (reduceMotion ? 1 : anyOpen ? OPEN_EASE : CLOSE_EASE);

    cards.forEach((card, i) => {
      let a = i * STEP + angle;
      a = ((a % 360) + 540) % 360 - 180;            // wrap to -180..180 (0 = front)
      const rad = (a * Math.PI) / 180;
      const depth = (1 - Math.cos(rad)) / 2;        // 0 front … 1 back
      const bob = reduceMotion ? 0 : Math.sin(t * 0.9 + i * 2.1) * 7;

      let x = Math.sin(rad) * R;
      let z = (Math.cos(rad) - 1) * R;
      let y = bob - depth * 75;            // cards at the back sit a little higher so their backs peek out
      // in front: cards mostly face you. past the sides they keep turning,
      // so a card at the very back shows you its back
      const abs = Math.abs(a);
      let rotY = abs <= 90 ? a * FACE
        : Math.sign(a) * (90 * FACE + ((abs - 90) / 90) * (180 - 90 * FACE));
      let opacity = 1 - depth * 0.4;
      let bright = 1 - depth * 0.3;

      // blend smoothly between "on the ring" and "opened" instead of jumping
      // (opening eases in fairly quickly, closing drifts back more slowly)
      const want = i === focused ? 1 : 0;
      openMix[i] += (want - openMix[i]) * (reduceMotion ? 1 : want ? OPEN_EASE : CLOSE_EASE);
      const m = openMix[i];
      x += (0 - x) * m;
      y += (-innerHeight * 0.04 - y) * m;
      z += (40 - z) * m;
      rotY += (0 - rotY) * m;
      opacity += (1 - opacity) * m;
      bright += (1 - bright) * m;

      // the other cards sink back & fade while something is open
      const fade = Math.max(0, fadeMix - m);   // (the card being closed never dips)
      z -= 260 * fade;
      opacity *= 1 - 0.82 * fade;
      bright *= 1 - 0.4 * fade;

      card.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg)`;
      card.style.opacity = opacity.toFixed(3);
      // cards further back are softly out of focus, so through the glass they look blurred
      const blurPx = depth * DEPTH_BLUR * (1 - m);
      const f = [];
      if (bright < 0.99) f.push(`brightness(${bright.toFixed(3)})`);
      if (blurPx > 0.15) f.push(`blur(${blurPx.toFixed(2)}px)`);
      card.style.filter = f.join(' ');
      card.style.zIndex = String(Math.round(1000 + z));

      const back = Math.cos((rotY * Math.PI) / 180) < 0;
      if (back !== card.classList.contains('show-back')) card.classList.toggle('show-back', back);
    });

    const front = focused >= 0 ? focused : frontIndex();
    dots.forEach((d, i) => d.classList.toggle('active', i === front));

    // little click each time a new card passes the front while spinning by hand
    const passing = ((Math.round(-angle / STEP) % N) + N) % N;
    if (passing !== lastPassing) {
      if (focused < 0 && (dragging || Math.abs(velocity) > 0.05)) click();
      lastPassing = passing;
    }

    requestAnimationFrame(frame);
  }

  // ---- spin a card round to the front (the short way) ----------------------
  function spinTo(i) {
    const want = -i * STEP;
    target = want + Math.round((angle - want) / 360) * 360;
    velocity = 0;
    lastInteraction = performance.now();
    click();
  }

  // ---- open / close -------------------------------------------------------
  function openCard(i, { updateHash = true } = {}) {
    if (i < 0 || i >= N) return;
    if (focused !== i) click();
    focused = i;
    // turn the ring the short way so this card ends up in front
    const want = -i * STEP;
    target = want + Math.round((angle - want) / 360) * 360;
    velocity = 0;
    cards.forEach((c, j) => c.classList.toggle('focused', j === i));
    stage.classList.add('is-focused');
    const card = cards[i];
    card.scrollTop = 0;
    if (card.dataset.model) loadModel(card);
    if (updateHash) history.replaceState(null, '', '#' + card.id);
  }

  function closeCard() {
    if (focused < 0) return;
    cards[focused].classList.remove('focused');
    focused = -1;
    click();
    stage.classList.remove('is-focused');
    history.replaceState(null, '', location.pathname);
    lastInteraction = performance.now();
  }

  // project 02's 3d model (loaded straight away, see bottom of file)
  function loadModel(card) {
    const slot = card.querySelector('.card-model');
    if (!slot || slot.querySelector('model-viewer')) return;
    const mv = document.createElement('model-viewer');
    mv.setAttribute('src', card.dataset.model);
    mv.setAttribute('alt', card.dataset.modelAlt || '3d model');
    mv.setAttribute('poster', card.querySelector('.card-media img')?.getAttribute('src') || '');
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('ar', '');
    slot.appendChild(mv);
  }

  // ---- pointer: drag to spin, click to open --------------------------------
  stage.addEventListener('pointerdown', (e) => {
    lastInteraction = performance.now();
    downX = lastX = e.clientX; downY = e.clientY; moved = 0;
    // inside an open card, let people scroll, select, use links & the 3d viewer
    if (focused >= 0 && e.target.closest('.ring-card.focused')) return;
    if (e.target.closest('a, button, model-viewer')) return;
    if (focused >= 0) return; // a click outside closes (handled on pointerup)
    dragging = true;
    velocity = 0;
    stage.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener('pointermove', (e) => {
    // tilt follows the cursor (mouse/pen only — not fingers)
    if (e.pointerType !== 'touch') {
      tiltTarget.x = -((e.clientY / innerHeight) - 0.5) * 2 * TILT_X;
      tiltTarget.y = ((e.clientX / innerWidth) - 0.5) * 2 * TILT_Y;
    }
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
    angle += dx * DRAG_SPEED;
    velocity = dx * DRAG_SPEED;
    target = angle;
    lastInteraction = performance.now();
  });

  function endDrag(e) {
    const wasDragging = dragging;
    dragging = false;
    stage.classList.remove('dragging');
    const isClick = Math.hypot(e.clientX - downX, e.clientY - downY) < 6;

    if (focused >= 0) {
      if (!isClick) return;
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const card = hit && hit.closest('.ring-card');
      if (!card) closeCard();
      else if (!card.classList.contains('focused')) openCard(cards.indexOf(card));
      return;
    }

    if (wasDragging && isClick) {
      velocity = 0;
      // pointer capture means e.target is the stage, so find what's under the pointer
      if (stage.hasPointerCapture?.(e.pointerId)) stage.releasePointerCapture(e.pointerId);
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const card = hit && hit.closest('.ring-card');
      target = Math.round(angle / STEP) * STEP;
      const idx = card && !hit.closest('a, button') ? cards.indexOf(card) : -1;
      if (idx >= 0) {
        // front card opens; any other card spins round to the front first
        if (idx === frontIndex()) openCard(idx);
        else spinTo(idx);
      }
    }
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', () => { dragging = false; stage.classList.remove('dragging'); });

  // mouse leaving the window lets the tilt drift back to centre
  document.addEventListener('mouseleave', () => { tiltTarget.x = 0; tiltTarget.y = 0; });

  // ---- buttons & keys -----------------------------------------------------
  document.getElementById('ringPrev')?.addEventListener('click', () => {
    if (focused >= 0) return openCard((focused - 1 + N) % N);
    target += STEP; lastInteraction = performance.now(); click();
  });
  document.getElementById('ringNext')?.addEventListener('click', () => {
    if (focused >= 0) return openCard((focused + 1) % N);
    target -= STEP; lastInteraction = performance.now(); click();
  });
  dots.forEach((d, i) => d.addEventListener('click', () => openCard(i)));
  closeBtn?.addEventListener('click', closeCard);

  window.addEventListener('keydown', (e) => {
    if (document.getElementById('sidenav')?.classList.contains('open')) return;
    if (e.key === 'Escape') closeCard();
    else if (e.key === 'ArrowLeft') document.getElementById('ringPrev')?.click();
    else if (e.key === 'ArrowRight') document.getElementById('ringNext')?.click();
    else if (e.key === 'Enter' && focused < 0 && document.activeElement === document.body) openCard(frontIndex());
  });

  // ---- deep links: archive.html#project-02 opens that card -----------------
  function openFromHash() {
    const i = cards.findIndex((c) => '#' + c.id === location.hash);
    if (i < 0) return;
    const go = () => loaderUp() ? setTimeout(go, 200) : openCard(i, { updateHash: false });
    setTimeout(go, reduceMotion ? 0 : 700);
  }
  window.addEventListener('hashchange', () => {
    // menu links now point at this same page, so close the menu when one is used
    document.getElementById('sidenav')?.classList.remove('open');
    document.getElementById('overlay')?.classList.remove('open');
    openFromHash();
  });
  openFromHash();

  // load the 3d model(s) right away so they spin inside the floating card
  cards.forEach((c) => { if (c.dataset.model) loadModel(c); });

  requestAnimationFrame(frame);
})();
