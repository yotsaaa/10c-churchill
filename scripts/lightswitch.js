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
    'empty canvas glow',
    'quasi-object in blender',
    'cube map texturing',
    'spatial 3D exhibition'
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

  // 4. Portal Orb 3-Project Carousel & Menu Switcher
  const portalCircle = document.getElementById('portal-circle');
  const slides = document.querySelectorAll('.portal-slide');
  const menuButtons = document.querySelectorAll('.portal-menu-btn');
  const dots = document.querySelectorAll('.portal-dot');
  const continueLink = document.getElementById('continue');
  const portalSubtitle = document.getElementById('portal-subtitle');

  const projectDetails = [
    {
      targetId: 'project-01',
      title: 'enter // project 01: uncanny valley',
      subtitle: 'adobe illustrator & photoshop ෧ prompt: uncanny valley',
      link: 'archive.html#project-01'
    },
    {
      targetId: 'project-02',
      title: 'enter // project 02: quasi-object',
      subtitle: 'blender & 3d web reconstruction ෧ prompt: quasi-object',
      link: 'archive.html#project-02'
    },
    {
      targetId: 'project-03',
      title: 'enter // project 03: [unopened archive]',
      subtitle: 'third semester exploration / final ෧ prompt: tba (locked)',
      link: 'archive.html#project-03'
    }
  ];

  let currentProjectIndex = 0;
  let autoPlayTimer = null;

  function switchProject(index) {
    if (!slides.length) return;
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentProjectIndex = index;

    // Update active slide
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    // Update three dots on the bottom of circle
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    // Update menu buttons
    menuButtons.forEach((btn, i) => {
      const isSelected = i === index;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected.toString());
      const dot = btn.querySelector('.btn-dot');
      if (dot) {
        dot.textContent = isSelected ? '♥' : (i === 1 ? '♡' : '෧');
      }
    });

    // Update dynamic enter link & description
    const data = projectDetails[index];
    if (data && continueLink) {
      continueLink.textContent = data.title;
      continueLink.setAttribute('href', data.link);
    }
    if (data && portalSubtitle) {
      portalSubtitle.textContent = data.subtitle;
    }
  }

  // Auto-switch carousel images every 6 seconds
  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(() => {
      switchProject(currentProjectIndex + 1);
    }, 6000);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  // Dots click navigation
  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(dot.dataset.index, 10);
      switchProject(idx);
      resetAutoPlay();
    });
  });

  // Menu button clicks
  menuButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      switchProject(idx);
      resetAutoPlay();
    });
  });

  // Pause on hover so viewer can inspect without sudden slide transitions
  if (portalCircle) {
    portalCircle.addEventListener('mouseenter', stopAutoPlay);
    portalCircle.addEventListener('mouseleave', startAutoPlay);

    // Clicking the circle smoothly scrolls to the currently active project
    portalCircle.addEventListener('click', (e) => {
      if (e.target.closest('.portal-dots')) return;
      const targetData = projectDetails[currentProjectIndex];
      if (targetData) {
        const targetEl = document.getElementById(targetData.targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        } else {
          // projects live on page 2 now
          window.location.href = targetData.link;
        }
      }
    });
  }

  // Start 6-second auto rotation
  startAutoPlay();
});
