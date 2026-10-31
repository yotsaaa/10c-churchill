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
  const AUTO_ADVANCE_MS = 0;    // idle time before it spins to the next card (0 = never; it stays where you left it)

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
  const DEPTH_BLUR = 0;          // px of blur on the cards themselves (0 = cards stay sharp; the glass blurs what's behind)
  const PERSPECTIVE = 1400;      // px — lower = stronger 3d effect
  const OPEN_EASE = 0.12;
  const CLOSE_EASE = 0.06;
  const openMix = cards.map(() => 0);
  let backsOn = false, flipMix = 0;
  // intro: cards start turned round (showing their ascii backs) and flip to the
  // front INTRO_BACKS_MS after the loading screen is gone, then the text unscrambles
  const INTRO_BACKS_MS = 250;
  let introEnd = null;           // set once the loading screen has gone
  if (!reduceMotion) flipMix = 1;
  const introHolding = (now) => introEnd === null || now < introEnd;

  // idle "screensaver": after IDLE_MS with no mouse / key / touch activity, every card
  // turns round to its ascii back; any activity turns them back to the front.
  // (not while a card is open or a video is playing with sound — someone's watching)
  const IDLE_MS = 12000;
  let lastActivity = performance.now(), idleOn = false, wokeAt = 0;
  function onActivity() {
    lastActivity = performance.now();
    if (idleOn) { idleOn = false; wokeAt = lastActivity; }
  }
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((t) =>
    window.addEventListener(t, onActivity, { passive: true, capture: true }));
  const watchingVideo = () => Array.from(document.querySelectorAll('video'))
    .some((v) => !v.paused && !v.muted && !v.ended);
  const FLIP_EASE = 0.07;        // how fast the cards turn round for the ꩜ toggle
  let fadeMix = 0;

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
    if (AUTO_ADVANCE_MS > 0 && !reduceMotion && focused < 0 && !dragging && now - lastInteraction > AUTO_ADVANCE_MS) {
      target -= STEP;
      lastInteraction = now;
    }

    // cursor tilt (eased); softer while a card is open so text stays readable
    const k = focused >= 0 ? 0.2 : 1;
    tiltNow.x += (tiltTarget.x * k - tiltNow.x) * TILT_EASE;
    tiltNow.y += (tiltTarget.y * k - tiltNow.y) * TILT_EASE;
    // (the tilt is applied to each card below, so cards can stack flat and blur what's behind them)

    const R = radius();
    const t = (now - start) / 1000;
    if (introEnd === null && !loaderUp()) introEnd = now + (reduceMotion ? 0 : INTRO_BACKS_MS);
    if (!idleOn && !reduceMotion && focused < 0 && introEnd !== null && now - lastActivity > IDLE_MS && !watchingVideo()) idleOn = true;
    // while idle, everything except the ring fades away (see .is-idle in ring.css)
    if (idleOn !== document.documentElement.classList.contains('is-idle')) document.documentElement.classList.toggle('is-idle', idleOn);
    const flipTarget = backsOn || idleOn || (!reduceMotion && introHolding(now)) ? 1 : 0;
    flipMix += (flipTarget - flipMix) * (reduceMotion ? 1 : FLIP_EASE);
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
      // ꩜ toggle: every card that's facing you turns round to show its ascii back
      if (flipMix > 0.001 && Math.cos((rotY * Math.PI) / 180) >= 0) {
        rotY += (a >= 0 ? 1 : -1) * 180 * flipMix;
      }
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

      // each card carries its own perspective + the ring's tilt, so the cards don't share
      // one 3d space — that's what lets the frosted glass blur the cards behind it
      card.style.transform =
        `translate(-50%, -50%) perspective(${PERSPECTIVE}px) rotateX(${tiltNow.x.toFixed(2)}deg) rotateY(${tiltNow.y.toFixed(2)}deg) ` +
        `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg)`;
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


    requestAnimationFrame(frame);
  }

  // ---- ꩜ toggle: flip every card round to show off its ascii back ------------
  const backsBtn = document.getElementById('backs-toggle');
  function setBacks(on) {
    backsOn = on;
    document.documentElement.classList.toggle('backs-on', on);
    if (on && focused >= 0) closeCard();
    if (backsBtn) {
      backsBtn.classList.toggle('playing', on);
      backsBtn.setAttribute('aria-pressed', String(on));
      const dot = backsBtn.querySelector('.snd-dot');
      if (dot) dot.textContent = on ? '●' : '◌';
      backsBtn.setAttribute('aria-label', on ? 'showing card backs — click to flip back' : 'flip cards to show their ascii backs');
    }
  }
  if (backsBtn) backsBtn.addEventListener('click', (e) => { e.stopPropagation(); setBacks(!backsOn); });

  // ---- spin a card round to the front (the short way) ----------------------
  function spinTo(i) {
    const want = -i * STEP;
    target = want + Math.round((angle - want) / 360) * 360;
    velocity = 0;
    lastInteraction = performance.now();
  }

  // ---- open / close -------------------------------------------------------
  function openCard(i, { updateHash = true } = {}) {
    if (i < 0 || i >= N) return;
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
      // the side of the ring nearest the cursor leans toward it
      tiltTarget.x = ((e.clientY / innerHeight) - 0.5) * 2 * TILT_X;
      tiltTarget.y = -((e.clientX / innerWidth) - 0.5) * 2 * TILT_Y;
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
      // anywhere that isn't the open card (including the faded cards behind it) goes back to the ring
      if (!card || !card.classList.contains('focused')) closeCard();
      return;
    }

    if (wasDragging && isClick && performance.now() - wokeAt < 400) return;   // that click just woke it up
    if (wasDragging && isClick) {
      velocity = 0;
      // pointer capture means e.target is the stage, so find what's under the pointer
      if (stage.hasPointerCapture?.(e.pointerId)) stage.releasePointerCapture(e.pointerId);
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const card = hit && hit.closest('.ring-card');
      target = Math.round(angle / STEP) * STEP;
      const idx = card && !hit.closest('a, button') ? cards.indexOf(card) : -1;
      // while ꩜ is on, cards stay turned round: clicking one just spins it to the front
      if (idx >= 0 && backsOn) { if (idx !== frontIndex()) spinTo(idx); return; }
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
    target += STEP; lastInteraction = performance.now();
  });
  document.getElementById('ringNext')?.addEventListener('click', () => {
    if (focused >= 0) return openCard((focused + 1) % N);
    target -= STEP; lastInteraction = performance.now();
  });
  // bottom buttons just spin to that card (click the card itself to open it).
  // if a card is open, it closes first.
  dots.forEach((d, i) => d.addEventListener('click', () => {
    if (focused >= 0) closeCard();
    spinTo(i);
  }));
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

  // ---- scrambled text on cards that aren't featured ------------------------
  // every card except the one in front shows its words as shifting symbols;
  // when a card comes to the front (or is opened) its text unscrambles top to bottom.
  // each letter becomes a symbol of about the same width, so lines don't re-wrap
  // and the cards keep their size while scrambled
  const NARROW_IN = "ijlt.,:;'!|fr()[]1I", NARROW = ".:;·'";
  const WIDE_IN = 'mwMW@%&', WIDE = '@#%&';
  const MID = '*+=~xo°';
  const REVEAL_MS = 750;        // how long the unscramble takes
  const RESCRAMBLE_MS = 160;    // how often the scrambled text shifts
  const pickFrom = (s) => s[Math.floor(Math.random() * s.length)];
  const scramble = (str) => str.replace(/\S/g, (ch) =>
    NARROW_IN.includes(ch) ? pickFrom(NARROW) : WIDE_IN.includes(ch) ? pickFrom(WIDE) : pickFrom(MID));

  // the real text always stays in the page (made invisible while scrambled), so the
  // layout never moves. the symbols are drawn in a copy laid exactly on top of it.
  const BLOCKS = 'h3, .card-prompt, .about-body p, .artwork-meta span, .card-open-hint';
  const cardText = cards.map((card) => {
    const blocks = [];
    card.querySelectorAll(BLOCKS).forEach((el) => {
      if (el.closest('.card-back, .card-extra, .tease-screen')) return;
      if (!/\S/.test(el.textContent)) return;
      const layer = document.createElement('span');
      layer.className = 'scr-layer';
      layer.setAttribute('aria-hidden', 'true');
      el.childNodes.forEach((c) => layer.appendChild(c.cloneNode(true)));
      layer.style.color = getComputedStyle(el).color;
      el.classList.add('scr-host');
      el.appendChild(layer);
      blocks.push({ el, layer });
    });
    // the layer's text, in reading order, for the top-to-bottom unscramble
    const nodes = [];
    let total = 0;
    blocks.forEach(({ layer }) => {
      const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!/\S/.test(n.nodeValue)) continue;
        nodes.push({ n, orig: n.nodeValue, start: total });
        total += n.nodeValue.length;
      }
    });
    return { blocks, nodes, total: Math.max(1, total), readable: false, revealAt: 0, done: false, lastShuffle: 0 };
  });

  const setScrambled = (ct, on) => ct.blocks.forEach(({ el }) => el.classList.toggle('scr-on', on));
  cardText.forEach((ct) => setScrambled(ct, !reduceMotion));

  function updateCardText(now) {
    if (reduceMotion) return;
    // nothing unscrambles until the intro flip has turned the cards to face you
    const featured = (loaderUp() || introHolding(now - 450)) ? -1 : (focused >= 0 ? focused : ((Math.round(-angle / STEP) % N) + N) % N);
    cardText.forEach((ct, i) => {
      if (i === featured && !ct.readable) { ct.readable = true; ct.revealAt = now; ct.done = false; }
      if (i !== featured && ct.readable) { ct.readable = false; ct.lastShuffle = 0; setScrambled(ct, true); }

      if (ct.readable) {
        if (ct.done) return;
        const p = Math.min(1, (now - ct.revealAt) / REVEAL_MS);
        const upto = p * ct.total;                       // characters revealed so far, in reading order
        ct.nodes.forEach(({ n, orig, start }) => {
          const k = Math.max(0, Math.min(orig.length, Math.floor(upto - start)));
          n.nodeValue = k >= orig.length ? orig : orig.slice(0, k) + scramble(orig.slice(k));
        });
        if (p >= 1) { ct.done = true; setScrambled(ct, false); }   // hand back to the real text
      } else if (now - ct.lastShuffle > RESCRAMBLE_MS) {
        ct.lastShuffle = now;
        ct.nodes.forEach(({ n, orig }) => { n.nodeValue = scramble(orig); });
      }
    });
  }
  (function textLoop(now) { updateCardText(now); requestAnimationFrame(textLoop); })(performance.now());

  requestAnimationFrame(frame);
})();
