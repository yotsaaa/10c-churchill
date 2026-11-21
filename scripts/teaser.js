/**
 * natalie hrclcuihl — 10c f26
 * project 03 video screen: the youtube player (silent loop until the card is
 * opened), the tiny local clip that feeds its ascii card back, and the running
 * timecode on the floating preview.
 */

(function () {
  const screens = document.querySelectorAll('.tease-screen');
  if (!screens.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // mostly empty, some light static, a few heavier specks
  const NOISE = '          ········..::░░▒▓⋆˚';
  const FPS = 12;

  function fill(pre) {
    if (!pre) return;               // screens showing a real video have no static
    const box = pre.getBoundingClientRect();
    const cols = Math.max(10, Math.ceil(box.width / 6) + 2);
    const rows = Math.max(5, Math.ceil(box.height / 10) + 1);
    let out = '';
    // a soft rolling band, like a bad vhs tracking line
    const band = (performance.now() / 60) % (rows + 8) - 4;
    for (let r = 0; r < rows; r++) {
      const near = Math.abs(r - band) < 1.5;
      for (let c = 0; c < cols; c++) {
        const n = Math.random() * (near ? 0.6 : 1);
        out += NOISE[Math.floor(Math.pow(1 - n, 1.6) * NOISE.length) % NOISE.length];
      }
      out += '\n';
    }
    pre.textContent = out;
  }

  const start = performance.now();
  function timecode() {
    const t = (performance.now() - start) / 1000;
    const pad = (n) => String(Math.floor(n)).padStart(2, '0');
    return `00:${pad((t / 60) % 60)}:${pad(t % 60)}:${pad((t * 24) % 24)}`;
  }

  function tick() {
    screens.forEach((s) => {
      const card = s.closest('.ring-card');
      if (card && card.classList.contains('show-back')) return; // facing away
      fill(s.querySelector('.tease-noise'));
      const tc = s.querySelector('.tease-tc');
      if (tc) tc.textContent = timecode();
    });
  }

  // project 03's tiny local clip: always silent and looping, never clickable.
  // it only feeds the ascii card back (and shows until youtube is ready)
  document.querySelectorAll('.tease-video').forEach((v) => {
    v.muted = true;
    v.controls = false;
    v.play().catch(() => {});
  });

  // project 03 youtube player: silent loop while floating; sound (from the start) once opened.
  // closing the card mutes it again and it keeps looping.
  const ytBoxes = document.querySelectorAll('.yt-player[data-yt]');
  if (ytBoxes.length) {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === 'function') prevReady();
      ytBoxes.forEach(setupYT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  // tells sound.js (background music) and ring.js (idle fade) when youtube is playing out loud
  let ytLoud = false;
  function setLoud(on) {
    if (on === ytLoud) return;
    ytLoud = on;
    document.documentElement.dataset.ytLoud = on ? '1' : '';
    document.dispatchEvent(new Event('ytloudchange'));
  }

  function setupYT(box) {
    const id = box.dataset.yt;
    const card = box.closest('.ring-card');
    const screen = box.closest('.tease-screen');
    const mount = document.createElement('div');
    box.appendChild(mount);
    let ready = false;

    const player = new YT.Player(mount, {
      videoId: id,
      playerVars: {
        autoplay: 1, mute: 1, loop: 1, playlist: id,   // playlist = same id is how youtube loops one video
        controls: 1, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3,
        origin: location.origin
      },
      events: {
        onReady: (e) => {
          ready = true;
          e.target.getIframe().setAttribute('title', 'project 03 video');
          e.target.mute();
          e.target.playVideo();
          sync();
        },
        // youtube refused (offline, blocked, or the page was opened straight from a file):
        // hide the player so the local clip shows instead
        onError: () => { box.style.display = 'none'; ready = false; setLoud(false); },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) screen?.classList.add('yt-ready');
          // closed card: never let it sit paused or finished
          if (!isOpen() && (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED)) {
            player.seekTo(0, true);
            player.playVideo();
          }
          checkLoud();
        }
      }
    });

    const isOpen = () => card && card.classList.contains('focused');
    let wasOpen = false;
    function sync() {
      if (!ready) return;
      const open = isOpen();
      if (open && !wasOpen) {            // just opened → from the top, with sound
        player.seekTo(0, true);
        player.unMute();
        player.setVolume(100);
        player.playVideo();
      } else if (!open && wasOpen) {     // just closed → back to a silent loop
        player.mute();
        player.playVideo();
      }
      wasOpen = open;
      checkLoud();
    }
    function checkLoud() {
      if (!ready) return;
      const playing = player.getPlayerState() === YT.PlayerState.PLAYING;
      setLoud(isOpen() && playing && !player.isMuted());
    }

    if (card) new MutationObserver(sync).observe(card, { attributes: true, attributeFilter: ['class'] });
    // youtube's own mute button doesn't send an event, so check now and then
    setInterval(checkLoud, 700);
  }

  if (reduceMotion) {
    screens.forEach((s) => fill(s.querySelector('.tease-noise')));
    return;
  }
  setInterval(() => { if (!document.hidden) tick(); }, 1000 / FPS);
  tick();
})();
