/**
 * natalie churchill — 10c f26
 * sound toggle (bottom right). starts muted; once switched on it stays on
 * across pages and picks the song back up where it left off.
 */

(function () {
  const SRC = 'audio/Yume%20Nikki%20OST%20-%20Sky%20Garden.mp3';
  const VOLUME = 0.45;         // 0 – 1
  const CLICK_SRC = 'audio/click%20sound.mp3';
  const CLICK_VOLUME = 0.6;    // 0 – 1
  const KEY_ON = 'natalie-10c-sound';
  const KEY_TIME = 'natalie-10c-sound-time';

  const btn = document.getElementById('sound-toggle');
  if (!btn) return;

  const store = {
    get(k, s = localStorage) { try { return s.getItem(k); } catch (e) { return null; } },
    set(k, v, s = localStorage) { try { s.setItem(k, v); } catch (e) {} }
  };

  const audio = new Audio();
  audio.src = SRC;
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0;

  let on = false;
  let fadeTimer = null;

  function render() {
    btn.innerHTML = '<span class="snd-icon">♫</span><span class="snd-dot">' + (on ? '●' : '◌') + '</span>';
    btn.setAttribute('aria-label', on ? 'sound on — click to mute' : 'sound off — click to play');
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('playing', on);
  }

  function fadeTo(target, ms, done) {
    clearInterval(fadeTimer);
    const start = audio.volume, steps = 20;
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      audio.volume = Math.min(1, Math.max(0, start + (target - start) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); done && done(); }
    }, ms / steps);
  }

  function play() {
    const t = parseFloat(store.get(KEY_TIME, sessionStorage));
    if (!isNaN(t) && audio.currentTime === 0) {
      audio.addEventListener('loadedmetadata', () => { audio.currentTime = t % (audio.duration || Infinity); }, { once: true });
    }
    return audio.play().then(() => fadeTo(VOLUME, 900));
  }

  function turnOn() {
    on = true; render();
    store.set(KEY_ON, '1');
    play().catch(() => {
      // browser blocked it (no click on this page yet) — start on the first click/key
      const kick = () => { if (on) play().catch(() => {}); };
      document.addEventListener('pointerdown', kick, { once: true });
      document.addEventListener('keydown', kick, { once: true });
    });
  }

  function turnOff() {
    on = false; render();
    store.set(KEY_ON, '0');
    fadeTo(0, 400, () => audio.pause());
  }

  // click sound for the ring (only audible while sound is switched on)
  const clickAudio = new Audio(CLICK_SRC);
  clickAudio.preload = 'auto';
  window.siteClick = function () {
    if (!on) return;
    const c = clickAudio.cloneNode();
    c.volume = CLICK_VOLUME;
    c.play().catch(() => {});
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    on ? turnOff() : turnOn();
    window.siteClick();
  });

  // remember where the song was when leaving the page
  window.addEventListener('pagehide', () => {
    if (!audio.paused) store.set(KEY_TIME, String(audio.currentTime), sessionStorage);
  });

  render();
  if (store.get(KEY_ON) === '1') turnOn(); // stays muted unless they turned it on before
})();
