/**
 * natalie churchill — 10c f26
 * interactive behaviors (eyeorb + soloshow style)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sidenav menu toggle (soloshow.online style)
  const menuBtn = document.getElementById('menuBtn');
  const sidenav = document.getElementById('sidenav');
  const overlay = document.getElementById('overlay');

  function openNav() {
    if (sidenav) sidenav.classList.add('open');
    if (overlay) overlay.classList.add('open');
  }

  function closeNav() {
    if (sidenav) sidenav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  if (menuBtn && sidenav) {
    menuBtn.addEventListener('click', () => {
      sidenav.classList.contains('open') ? closeNav() : openNav();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeNav);
  }

  // 2. Mood / thought generator (eyeorb.net aroma style)
  const moods = [
    'awaiting uncanny valley',
    'vector bezier curves',
    'photoshop layering',
    'fallen sakura petals',
    'gothic pastoral',
    'whispering pixels',
    'quiet studio static',
    'empty canvas glow'
  ];

  const moodSpan = document.getElementById('mood-text');
  const changeMoodBtn = document.getElementById('change-mood');

  if (changeMoodBtn && moodSpan) {
    changeMoodBtn.addEventListener('click', () => {
      moodSpan.classList.add('animating');
      setTimeout(() => {
        const next = moods[Math.floor(Math.random() * moods.length)];
        moodSpan.textContent = next;
        moodSpan.classList.remove('animating');
      }, 250);
    });
  }

  // 3. Simple hit counter increment in localStorage
  const counterEl = document.getElementById('visit-counter');
  if (counterEl) {
    let visits = parseInt(localStorage.getItem('natalie-10c-visits') || '1026', 10);
    visits += 1;
    localStorage.setItem('natalie-10c-visits', visits.toString());
    counterEl.textContent = visits.toString().padStart(6, '0');
  }

  // 4. Portal scroll to Project 01
  const portal = document.getElementById('portal-circle');
  if (portal) {
    portal.addEventListener('click', () => {
      const p1 = document.getElementById('project-01');
      if (p1) {
        p1.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});
