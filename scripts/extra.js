/**
 * natalie churchill — 10c f26
 * gallery cards (additional work, in-class demos): once a card is open, click a thumbnail to show it
 * big. works with images (data-type="image") and videos (data-type="video").
 */

// set up every gallery card on the page (additional work, in-class demos, …)
document.querySelectorAll('.extra-card').forEach(function (card) {
  const items = Array.from(card.querySelectorAll('.extra-item'));
  const viewer = card.querySelector('.extra-viewer');
  const img = viewer && viewer.querySelector('img');
  const video = viewer && viewer.querySelector('video');
  const title = card.querySelector('.extra-title');
  const note = card.querySelector('.extra-note');
  if (!items.length || !viewer) return;

  function show(item) {
    items.forEach((it) => it.classList.toggle('active', it === item));
    const type = item.dataset.type || 'image';
    viewer.dataset.type = type;
    if (type === 'video') {
      if (video.getAttribute('src') !== item.dataset.src) {
        video.pause();
        video.setAttribute('poster', item.dataset.poster || '');
        video.setAttribute('src', item.dataset.src);
      }
    } else {
      video.pause();
      img.src = item.dataset.src;
      img.alt = item.dataset.title || '';
    }
    title.textContent = item.dataset.title || '';
    note.textContent = item.dataset.note || '';
  }

  items.forEach((item) => item.addEventListener('click', (e) => {
    e.stopPropagation();
    show(item);
  }));

  // stop any playing video when the card is closed
  new MutationObserver(() => {
    if (!card.classList.contains('focused') && video) video.pause();
  }).observe(card, { attributes: true, attributeFilter: ['class'] });

  show(items[0]);
});

// floating looping previews (in-class demos, project 02): play while the card floats.
// once opened, the demos one pauses (the gallery takes over); videos marked
// data-play-open (project 02) keep playing, shown big above the 3d model
document.querySelectorAll('.ring-card').forEach(function (card) {
  const loop = card.querySelector('.loop-video');
  if (!loop) return;
  const syncLoop = () => {
    if (card.classList.contains('focused') && !loop.hasAttribute('data-play-open')) loop.pause();
    else { loop.muted = true; loop.play().catch(() => {}); }
  };
  new MutationObserver(syncLoop).observe(card, { attributes: true, attributeFilter: ['class'] });
  syncLoop();
});
