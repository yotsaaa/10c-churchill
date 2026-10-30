/**
 * natalie churchill — 10c f26
 * ascii sparkle field: glyphs that slowly fade in & out around the page
 */

(function () {
  const SINGLES = ['✦', '✧', '⋆', '˚', '*', '+', '·', '✩', '｡', '⊹', '°', '♡'];
  const CLUSTERS = ['·˚✧', '⋆｡°✩', '✦ ˚', '. ⋆', '˚ ·. ✧', '+ ·', '⊹ ˚.', '✩°｡⋆'];
  const TONES = ['', '', 'soft', 'soft', 'white', 'dim'];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rand = (min, max) => min + Math.random() * (max - min);

  // move a sparkle to a fresh random spot with a new look
  function reroll(el) {
    const isCluster = Math.random() < 0.18;
    el.textContent = isCluster ? pick(CLUSTERS) : pick(SINGLES);
    el.className = 'sparkle ' + pick(TONES);
    el.style.left = rand(1, 97) + 'vw';
    el.style.top = rand(1, 96) + 'vh';
    el.style.fontSize = (isCluster ? rand(9, 12) : rand(9, 18)).toFixed(1) + 'px';
    el.style.setProperty('--peak', rand(0.25, 0.8).toFixed(2));
  }

  function build() {
    if (document.querySelector('.sparkle-field')) return;

    const field = document.createElement('div');
    field.className = 'sparkle-field';
    field.setAttribute('aria-hidden', 'true');

    // density scales with screen size (fewer on phones)
    const area = window.innerWidth * window.innerHeight;
    const count = Math.max(12, Math.min(38, Math.round(area / 32000)));

    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      reroll(s);
      // each sparkle keeps one slow duration for good. (changing it every cycle made
      // some of them jump straight to full brightness — that was the fast flicker)
      s.style.animationDuration = rand(7, 13).toFixed(2) + 's';
      // stagger so they don't all pulse together on load
      s.style.animationDelay = (-rand(0, 10)).toFixed(2) + 's';
      // each time a sparkle finishes fading out, it reappears somewhere new
      s.addEventListener('animationiteration', () => reroll(s));
      field.appendChild(s);
    }

    document.body.insertBefore(field, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
