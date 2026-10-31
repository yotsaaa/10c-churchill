# @}->-- natalie churchill // 10c f26 ♥

Coursework archive for **Art 10C, Fall 2026**: a single-page web-1.0 / net-art portfolio holding three semester projects, in-class demos and outside work. Pure HTML, CSS and vanilla JS, with no build step and no framework.

- **Repo:** https://github.com/yotsaaa/10c-churchill
- **Local folder:** `~/Documents/10c churchill`
- **History:** started in Antigravity, continued with Claude after Antigravity credits ran out.

---

## Look & feel

- **Aesthetic:** net-art / gothic-pastoral / early-web terminal, inspired by eyeorb and soloshow.online.
- **Palette** (`css/style.css` `:root`):

  | token | value | use |
  |---|---|---|
  | `--bg-color` | `#040305` | void-black background |
  | `--bg-box` | `rgba(10,8,12,.85)` | card / box fill |
  | `--pink-main` | `#f4a6c2` | hot pink accent, borders |
  | `--pink-soft` | `#fbcfe8` | links, labels |
  | `--pink-blush` | `#fdf2f8` | highlights |
  | `--pink-dim` | `#9e6b7f` | muted labels |
  | `--text-main` / `--text-dim` | `#e8e8ed` / `#8c8c96` | body text |

- **Fonts:** Crimson Text (serif), Space Mono (pixel/mono), Verdana (body), loaded from Google Fonts.
- **Decor glyphs:** `⋆*✩`, `♡`, `෧`, `@}->--`, plus ASCII symbols everywhere.
- **Custom cursor:** `Images/cursor.png`. **Favicon:** `Images/siteIcon.png` (rose vine).

---

## Pages

| file | what it is |
|---|---|
| `index.html` | Home. A draggable **3D ring of cards** (the "project ring"). |
| `p1.html` | Project 01 final PDF viewer (embedded `Images/p1pdf.pdf` with open and download buttons). |
| `archive.html` | Redirect stub that sends old links to `index.html` (keeps the `#hash`). |
| `style.css` (root) | One-line `@import` of `css/style.css`, kept for old links. |
| `README` | Empty placeholder. |

### Cards on the ring (`index.html`, in order)

1. **About** (`#about`): intro text and a GitHub link. Faces you on load.
2. **Project 01: "uncanny valley"** (`#project-01`): Illustrator + Photoshop collage. **Complete.** Image `Images/p1final-web.jpg`, links to `p1.html`.
3. **Project 02: "quasi-object"** (`#project-02`): rebuild an existing artifact as a 3D object in Blender, shown on its own and in an "exhibition" space. **In progress.** Uses `<model-viewer>` with `models/cube-map-demo.glb` (placeholder model) and `Images/p2placeholders.png`.
4. **Project 03: video** (`#project-03`): **in production.** Teaser screen plays `Images/p3 placeholder.mp4` with a fake timecode overlay.
5. **In-class demos** (`#demos`): gallery of 8 demos (radial blur, space exercise, texture, Blender pawn, screw modifier, cube map, textured cube, demo 02).
6. **Additional work** (`#extra`): gallery of outside work: live visuals (MGNA Crrrta Portola Fest 2026 + Afters), Spotify story visual credits, out1 demo, MGNA Crrrta x Madeon commission IG post, TouchDesigner + MediaPipe exploration.

Controls: ‹ › arrows, dot buttons (`✩ 01 02 03 d +`), drag or arrow keys to spin, click to open, `✕ back to ring` (or click anywhere outside the open card) to close.

---

## Folder structure

```
10c churchill/
├── index.html            home / project ring
├── p1.html               project 01 pdf page
├── archive.html          redirect → index.html
├── style.css             legacy @import
├── PROJECT.md            this file
├── css/
│   ├── style.css         base theme, sidenav, boxes, footer
│   ├── ring.css          3d ring, cards, open state, idle (.is-idle) fade
│   ├── ascii-loader.css  load-in screen
│   └── sparkles.css      background sparkle layer
├── scripts/
│   ├── ascii-loader.js   load-in animation (spiral, orb, symbol "log" text, dissolve)
│   ├── ring.js           3d ring: drag, snap, tilt, open/close, idle screensaver, card text scramble
│   ├── ascii-backs.js    card backs redrawn as ascii art (p03 back is live video)
│   ├── lightswitch.js    sidenav menu + misc interactions
│   ├── sparkles.js       fading ascii sparkles behind content
│   ├── glitch.js         random characters flicker into symbols
│   ├── sound.js          ♫ toggle, persists across pages
│   ├── teaser.js         project 03 static/timecode teaser
│   └── extra.js          gallery viewer for demos + additional work
├── Images/
│   ├── p1final.png / p1final-web.jpg / p1pdf.pdf / p1 draft.png
│   ├── p2placeholders.png, p2 placeholder.png
│   ├── p3 placeholder.mp4, p3 Placeholder.png
│   ├── Demos/            full-size PNGs (git-ignored) + web/ (jpgs used on site)
│   ├── extra/            web-sized images, mp4s + poster jpgs for additional work
│   ├── cursor.png, siteIcon.png
├── models/cube-map-demo.glb
├── audio/Yume Nikki OST - Sky Garden.mp3
└── Additional Works/     original full-size videos/images (git-ignored)
```

---

## Features & behaviors

- **ASCII loader** (`ascii-loader.js`): about 2s "glitch dissolve bloom" on load. Loading-screen text is shown as constantly scrambling symbols (`▓▒░◇◆※∴∵◐◓◑◒⌁⌇⟡⊹✦✧`) instead of words. It restores the original HTML (links, bold, tags) afterward, not plain text.
- **3D ring** (`ring.js` + `ring.css`): glass cards on a rotating ring with a subtle cursor tilt. While a card is open, the faded side cards can't be clicked or hovered, and clicking outside closes it.
- **Card text scramble:** card headings and meta unscramble when they come into view.
- **ASCII card backs** (`ascii-backs.js`): each card's back shows its own image in text characters. The **꩜** button flips all cards to their backs.
- **Idle screensaver:** after 12s with no input (and no open card or playing video), everything except the ring fades and the cards turn to their ASCII backs.
- **Sparkles** (`sparkles.js`): pink/white glyphs fade in and out behind content. Fewer on phones, static if reduced motion is on.
- **Ambient glitch** (`glitch.js`): every 0.4–1.1s one visible character briefly becomes a symbol. Skip an element with `data-no-glitch`.
- **Sound** (`sound.js`): Yume Nikki "Sky Garden" at 45% volume. Starts muted, then remembers on/off and playback position across pages (localStorage).
- **Galleries** (`extra.js`): click a thumbnail in an open demos/extra card to view it large (image or video).
- **Reduced motion:** respected by the loader, ring, sparkles, glitch and teaser.

---

## Tunables (quick knobs)

| file | constant | default | what it does |
|---|---|---|---|
| `ring.js` | `DRAG_SPEED` | `0.28` | degrees of spin per px dragged |
| `ring.js` | `FRICTION` | `0.93` | flick glide (closer to 1 = longer) |
| `ring.js` | `SNAP` | `0.08` | pull toward nearest card |
| `ring.js` | `TILT_X / TILT_Y` | `2.5 / 4` | cursor tilt in degrees |
| `ring.js` | `FACE` | `0.32` | how much side cards turn away |
| `ring.js` | `AUTO_ADVANCE_MS` | `0` | auto-spin when idle (0 = off) |
| `ring.js` | `IDLE_MS` | `12000` | time before idle screensaver |
| `ring.js` | `PERSPECTIVE` | `1400` | lower = stronger 3D |
| `ring.js` | `REVEAL_MS` | `750` | card text unscramble time |
| `ascii-loader.js` | `state.duration` | `2000` | load animation length (ms) |
| `ascii-loader.js` | `LOADER_GLYPHS` | symbol set | loading-screen characters |
| `ascii-backs.js` | `FONT_PX` | `7` | ascii back detail (smaller = finer) |
| `glitch.js` | `EVERY_MS / HOLD_MS` | `[400,1100] / [80,320]` | flicker rate and duration |
| `sound.js` | `VOLUME` | `0.45` | music volume |

---

## How to…

**Add a demo:** put the full PNG in `Images/Demos/`, a web-sized JPG in `Images/Demos/web/`, then copy one `<button class="extra-item">` block in the `#demos` card and change `data-src`, `data-title` and the `<img src>`. Update the "8 demos" count in its `artwork-meta`.

**Add additional work:** same as above in the `#extra` card. For video use `data-type="video"` plus `data-poster="…jpg"` and add `<span class="extra-badge">▶</span>`. Keep mp4s small, since **GitHub rejects files over 100 MB**. Originals go in `Additional Works/` (ignored by git).

**Swap in the real project 03 video:** change the `<video class="tease-video" src>` and `poster` in `#project-03`. Once it's final, `teaser.js` (and its `<script>` tag) can be removed, and the "coming soon" labels and status updated.

**Swap the project 02 model:** replace `models/cube-map-demo.glb` or change `data-model` on `#project-02`.

**Cache busting:** every CSS/JS link carries `?v=1069`. Bump the number in **both** `index.html` and `p1.html` after editing so browsers pick up changes (or hard refresh with Cmd+Shift+R).

**Test locally:** `python3 -m http.server 8766` in the folder, then open `http://localhost:8766`. The 3D model viewer needs internet (loads from Google's CDN).

**Go live:** commit and push to `main` on GitHub. Local edits don't update the live site until pushed.

---

## Status (as of Oct 30, 2026)

- [x] Project 01: uncanny valley, complete with final PDF
- [ ] Project 02: quasi-object, placeholder model and image, Blender reconstruction in progress
- [ ] Project 03: video, placeholder clip, in production
- [x] In-class demos gallery (8)
- [x] Additional work gallery (6)
- Working tree clean; last commit `a17bdd7 bug fix` (Oct 30).
