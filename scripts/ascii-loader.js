/**
 * natalie churchill — 10c f26
 * ascii load-in animation engine
 * aesthetic: gothic-pastoral / net-art / early-web terminal
 */

(function () {
  // Config & State
  const state = {
    mode: 'dissolve', // Set to Glitch Dissolve Bloom as requested
    duration: 2000,   // Balanced 2.0s duration
    scrambleDom: true,
    isRunning: false,
    timer: null,
    animFrame: null
  };

  const ASCII_CHARS = ['░', '▒', '▓', '█', '*', '+', '~', '-', '=', ':', '.', '♥', '෧', '✦', '✧', '@', '#', '%', '$', '/', '\\', '^', 'o'];

  // Orb frames for animated shimmering ASCII sphere
  const ORB_FRAMES = [
`      .:'""'::.      
   .:' ░▒▓███▓▒░ ':.   
  :  ░▒▓███████▓▒░  :  
 :  ░▒▓█████████▓▒░  : 
  :  ░▒▓███████▓▒░  :  
   ':. ░▒▓███▓▒░ .:'   
      ` + "`" + `':....:'` + "`",
`      .:'""'::.      
   .:' ▒▓█████▓▒ ':.   
  :  ▒▓█████████▓▒  :  
 :  ▒▓███████████▓▒  : 
  :  ▒▓█████████▓▒  :  
   ':. ▒▓█████▓▒ .:'   
      ` + "`" + `':....:'` + "`",
`      .:'""'::.      
   .:' ▓███████▓ ':.   
  :  ▓███████████▓  :  
 :  ▓█████████████▓  : 
  :  ▓███████████▓  :  
   ':. ▓███████▓ .:'   
      ` + "`" + `':....:'` + "`",
`      .:'""'::.      
   .:' ░░▒▒▓▓▒▒░░ ':.  
  :  ░░▒▒▓▓██▓▓▒▒░░  : 
 :  ░░▒▒▓█████▓▒▒░░  : 
  :  ░░▒▒▓▓██▓▓▒▒░░  : 
   ':. ░░▒▒▓▓▒▒░░ .:'  
      ` + "`" + `':....:'` + "`"
  ];

  const LOG_MSGS = [
    { at: 0.05, text: 'INITIALIZING VIRTUAL CANVAS BUFFER...' },
    { at: 0.22, text: 'PARSING REPO // DES 10C COURSE ARCHIVE (F26)... <span class="ok-badge">[OK]</span>' },
    { at: 0.42, text: 'ASSET 01: UNCANNY VALLEY (ILLUSTRATOR / PHOTOSHOP)... <span class="ok-badge">[ONLINE]</span>' },
    { at: 0.65, text: 'ASSET 02: QUASI-OBJECT 3D MESH (.GLB VIEWER)... <span class="ok-badge">[READY]</span>' },
    { at: 0.85, text: 'SYNCHRONIZING VOID AESTHETIC & PINK CHROMA...' },
    { at: 0.98, text: 'RENDER COMPLETED. MOUNTING HIGH-RES VIEWPORT... <span class="ok-badge">[100%]</span>' }
  ];

  // Cached DOM elements for text scramble
  let scrambleTargets = [];

  function initScrambleTargets() {
    scrambleTargets = [];
    const selectors = ['h1', 'h2 a', '#statement', '.update', '.portal-caption'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        // save original text or html once
        if (!el.dataset.origText) {
          el.dataset.origText = el.textContent.trim();
        }
        scrambleTargets.push(el);
      });
    });
  }

  function scrambleElement(el, durationMs = 800) {
    if (!el || !el.dataset.origText) return;
    const original = el.dataset.origText;
    const length = original.length;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const revealedCount = Math.floor(progress * length);

      let scrambled = '';
      for (let i = 0; i < length; i++) {
        if (i < revealedCount) {
          scrambled += original[i];
        } else if (original[i] === ' ' || original[i] === '\n') {
          scrambled += original[i];
        } else {
          scrambled += ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
        }
      }

      el.textContent = scrambled;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = original;
      }
    }

    requestAnimationFrame(step);
  }

  function triggerAllScrambles() {
    if (!state.scrambleDom) return;
    scrambleTargets.forEach((el, index) => {
      setTimeout(() => {
        scrambleElement(el, 650);
      }, index * 70);
    });
  }

  // Preloader DOM construction
  function createLoaderDOM() {
    let loader = document.getElementById('ascii-loader-root');
    if (loader) loader.remove();

    loader = document.createElement('div');
    loader.id = 'ascii-loader-root';

    loader.innerHTML = `
      <div class="ascii-scanline-beam" id="ascii-beam"></div>
      <div class="ascii-terminal-frame" id="ascii-frame">
        <div class="ascii-header-strip">
          <span>⋆*✩ NATALIE CHURCHILL // 10C F26 TERMINAL ✩*⋆</span>
          <span>SYSTEM: <span class="live-dot">● ACTIVE</span></span>
        </div>

        <div class="ascii-canvas-wrap">
          <pre class="ascii-art-pre" id="ascii-art-display">
       /\\_/\\
      ( o.o )   @}-&gt;-- natalie churchill // 10c f26 --&lt;-{@
       &gt; ^ &lt;    web art / digital media archive : 3 works
          </pre>
        </div>

        <div class="ascii-canvas-wrap">
          <pre class="ascii-art-pre ascii-orb-highlight" id="ascii-orb-display">
      .:'""'::.      
   .:' ░▒▓███▓▒░ ':.   
  :  ░▒▓███████▓▒░  :  
 :  ░▒▓█████████▓▒░  : 
  :  ░▒▓███████▓▒░  :  
   ':. ░▒▓███▓▒░ .:'   
      ` + "`" + `':....:'` + "`" + `
          </pre>
        </div>

        <div class="ascii-status-stream" id="ascii-logs">
          <span class="ascii-log-item">&gt; INITIALIZING VIRTUAL CANVAS BUFFER...</span>
        </div>

        <div class="ascii-progress-line" id="ascii-progress">
          DECODING: [<span class="ascii-progress-bar-fill">░░░░░░░░░░░░░░░░░░░░</span>] 0%
        </div>

        <div class="ascii-skip-hint" id="ascii-skip-btn">
          [ click anywhere or press ESC to skip ]
        </div>
      </div>
    `;

    document.body.appendChild(loader);

    loader.addEventListener('click', () => {
      finishAnimationEarly();
    });

    const skipBtn = document.getElementById('ascii-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        finishAnimationEarly();
      });
    }

    return loader;
  }

  // Demo Control Bar
  function createDemoControlPanel() {
    if (document.getElementById('ascii-demo-controls')) return;

    const dock = document.createElement('div');
    dock.id = 'ascii-demo-controls';
    dock.innerHTML = `
      <div class="ascii-demo-header">
        <span>⋆*✩ ASCII LOADER DEMO</span>
        <button class="ascii-demo-btn" id="ascii-dock-toggle" title="Minimize">−</button>
      </div>
      <div class="ascii-demo-body" id="ascii-dock-body">
        <div class="ascii-demo-row">
          <span>Animation Style:</span>
          <select class="ascii-demo-select" id="ascii-mode-select">
            <option value="wipe" selected>Scanline Wipe</option>
            <option value="dissolve">Glitch Dissolve</option>
            <option value="cascade">Matrix Cascade</option>
          </select>
        </div>
        <div class="ascii-demo-row">
          <span>Speed:</span>
          <select class="ascii-demo-select" id="ascii-speed-select">
            <option value="1200">Fast (1.2s)</option>
            <option value="2000" selected>Normal (2.0s)</option>
            <option value="3500">Cinematic (3.5s)</option>
          </select>
        </div>
        <div class="ascii-demo-row">
          <span>Scramble Text:</span>
          <input type="checkbox" id="ascii-scramble-toggle" checked style="accent-color: #f4a6c2; cursor: pointer;">
        </div>
        <div class="ascii-demo-row" style="margin-top: 10px; justify-content: stretch;">
          <button class="ascii-demo-btn" id="ascii-replay-btn" style="width: 100%; text-align: center; padding: 6px 0; font-weight: bold;">
            ⟳ Replay Load-in Animation
          </button>
        </div>
        <small style="color: #9e6b7f; font-size: 9px; display: block; margin-top: 6px; text-align: center;">
          Demo only — will not appear in final site
        </small>
      </div>
    `;

    document.body.appendChild(dock);

    // Event listeners for dock
    const replayBtn = document.getElementById('ascii-replay-btn');
    const modeSelect = document.getElementById('ascii-mode-select');
    const speedSelect = document.getElementById('ascii-speed-select');
    const scrambleToggle = document.getElementById('ascii-scramble-toggle');
    const toggleBtn = document.getElementById('ascii-dock-toggle');
    const dockBody = document.getElementById('ascii-dock-body');

    replayBtn.addEventListener('click', () => {
      runAnimation();
    });

    modeSelect.addEventListener('change', (e) => {
      state.mode = e.target.value;
    });

    speedSelect.addEventListener('change', (e) => {
      state.duration = parseInt(e.target.value, 10);
    });

    scrambleToggle.addEventListener('change', (e) => {
      state.scrambleDom = e.target.checked;
    });

    toggleBtn.addEventListener('click', () => {
      if (dockBody.style.display === 'none') {
        dockBody.style.display = 'block';
        toggleBtn.textContent = '−';
      } else {
        dockBody.style.display = 'none';
        toggleBtn.textContent = '+';
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isRunning) {
        finishAnimationEarly();
      }
    });
  }

  function finishAnimationEarly() {
    if (!state.isRunning) return;
    executeTransition();
  }

  // Main animation sequence
  function runAnimation() {
    state.isRunning = true;
    const loader = createLoaderDOM();
    const beam = document.getElementById('ascii-beam');
    const orbEl = document.getElementById('ascii-orb-display');
    const logsEl = document.getElementById('ascii-logs');
    const progressEl = document.getElementById('ascii-progress');

    // Reset styles
    loader.style.opacity = '1';
    loader.style.clipPath = 'none';
    loader.style.filter = 'none';
    loader.classList.remove('ascii-glitching');
    if (beam) beam.style.display = 'none';

    let startTime = performance.now();
    let orbFrameIndex = 0;
    let lastOrbUpdate = 0;
    let loggedIndices = new Set();

    function renderFrame(now) {
      if (!state.isRunning) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / state.duration, 1.0);

      // Shimmer orb
      if (now - lastOrbUpdate > 90) {
        orbFrameIndex = (orbFrameIndex + 1) % ORB_FRAMES.length;
        if (orbEl) orbEl.textContent = ORB_FRAMES[orbFrameIndex];
        lastOrbUpdate = now;
      }

      // Check log lines
      LOG_MSGS.forEach((msg, idx) => {
        if (progress >= msg.at && !loggedIndices.has(idx)) {
          loggedIndices.add(idx);
          if (logsEl) {
            const line = document.createElement('span');
            line.className = 'ascii-log-item';
            line.innerHTML = `&gt; ${msg.text}`;
            logsEl.appendChild(line);
            logsEl.scrollTop = logsEl.scrollHeight;
          }
        }
      });

      // Update progress bar
      if (progressEl) {
        const totalBars = 20;
        const filledBars = Math.floor(progress * totalBars);
        const barStr = '█'.repeat(filledBars) + '░'.repeat(totalBars - filledBars);
        const percent = Math.floor(progress * 100);
        progressEl.innerHTML = `DECODING: [<span class="ascii-progress-bar-fill">${barStr}</span>] ${percent}%`;
      }

      if (progress < 1.0) {
        state.animFrame = requestAnimationFrame(renderFrame);
      } else {
        executeTransition();
      }
    }

    state.animFrame = requestAnimationFrame(renderFrame);
  }

  // Handle transition once 100% is reached
  function executeTransition() {
    state.isRunning = false;
    if (state.animFrame) cancelAnimationFrame(state.animFrame);

    const loader = document.getElementById('ascii-loader-root');
    const beam = document.getElementById('ascii-beam');
    if (!loader) return;

    // Trigger DOM text scramble immediately as real site emerges
    triggerAllScrambles();

    if (state.mode === 'wipe') {
      // Scanline Wipe Mode
      if (beam) {
        beam.style.display = 'block';
        beam.style.top = '0%';
      }

      const wipeDuration = 600; // ms
      const wipeStart = performance.now();

      function stepWipe(now) {
        const elapsed = now - wipeStart;
        const p = Math.min(elapsed / wipeDuration, 1.0);
        const percent = p * 100;

        loader.style.clipPath = `polygon(0 ${percent}%, 100% ${percent}%, 100% 100%, 0 100%)`;
        if (beam) beam.style.top = `${percent}%`;

        if (p < 1.0) {
          requestAnimationFrame(stepWipe);
        } else {
          loader.style.opacity = '0';
          loader.style.pointerEvents = 'none';
          if (beam) beam.style.display = 'none';
        }
      }

      requestAnimationFrame(stepWipe);

    } else if (state.mode === 'dissolve') {
      // Glitch Dissolve Bloom Mode
      loader.classList.add('ascii-glitching');

      // Scramble visible terminal lines into cyber glyphs during dissolve bloom
      const preElements = loader.querySelectorAll('.ascii-art-pre, .ascii-progress-line, .ascii-log-item');
      const glitchInterval = setInterval(() => {
        preElements.forEach(pre => {
          if (Math.random() > 0.35) {
            const txt = pre.textContent;
            if (txt.length > 2) {
              const randIdx = Math.floor(Math.random() * txt.length);
              pre.textContent = txt.substring(0, randIdx) + ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)] + txt.substring(randIdx + 1);
            }
          }
        });
      }, 40);

      loader.style.transition = 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), filter 0.65s ease, transform 0.65s ease';
      loader.style.filter = 'blur(6px) drop-shadow(0 0 24px rgba(244, 166, 194, 0.8))';
      loader.style.opacity = '0';
      loader.style.transform = 'scale(1.02)';

      setTimeout(() => {
        clearInterval(glitchInterval);
        loader.style.pointerEvents = 'none';
        loader.classList.remove('ascii-glitching');
        if (loader.parentNode) {
          loader.remove();
        }
      }, 650);

    } else if (state.mode === 'cascade') {
      // Matrix Cascade Rain Mode
      loader.style.transition = 'transform 0.7s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.7s ease';
      loader.style.transform = 'translateY(100vh)';
      loader.style.opacity = '0';

      setTimeout(() => {
        loader.style.pointerEvents = 'none';
      }, 700);
    }
  }

  // Auto initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initScrambleTargets();

    // Show interactive controls only in demo file, ?demo query param, or if debug flag set
    const isDemoPage = window.location.pathname.includes('demo') ||
                       window.location.search.includes('demo') ||
                       window.ASCII_LOADER_DEBUG === true;

    if (isDemoPage) {
      createDemoControlPanel();
    }

    runAnimation();
  });

  // Public API
  window.AsciiLoader = {
    replay: runAnimation,
    setMode: (m) => { state.mode = m; },
    setSpeed: (ms) => { state.duration = ms; },
    skip: finishAnimationEarly
  };
})();
