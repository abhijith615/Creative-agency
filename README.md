# NOIR — Creative Studio

An Awwwards/FWA-style website for a creative agency in India offering **website
design**, **social media management**, and **photography & videography**.

## Highlights

- **Cream & brown editorial palette** with razor-sharp display-serif + sans typography.
- **Numerical preloader** (0 → 100 count-up) and an immersive hero entrance.
- **WebGL "touch the lines" background** (OGL fragment shader) — a brown line
  field that organically bends and emits a warm glow near the cursor, driven by
  pointer proximity and velocity.
- **Pinned hero** with **3 stacked, full-screen service sections** that each get
  "pulled up" over the previous one as you scroll, each featuring its own video.
- **Magnetic custom cursor** that scales and morphs into contextual labels.
- **Lenis** smooth inertial scrolling synced to **GSAP ScrollTrigger** timelines
  with **SplitText** track-in reveals.

## Tech stack

- [Vite](https://vitejs.dev/) + TypeScript (vanilla — keeps the main thread free for 60fps)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [GSAP](https://gsap.com/) (ScrollTrigger, ScrollToPlugin, SplitText)
- [Lenis](https://github.com/darkroomengineering/lenis) smooth scroll
- [OGL](https://github.com/oframe/ogl) for the WebGL canvas

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to /dist
npm run preview  # preview the build
```

## Structure

```
index.html              markup
src/style.css           Tailwind v4 theme tokens + component styles
src/main.ts             boot sequence
src/modules/
  glLines.ts            WebGL line-field shader (OGL)
  cursor.ts             magnetic custom cursor
  preloader.ts          0 → 100 numerical preloader
  scenes.ts             Lenis + hero entrance + stacked service reveals
public/videos/          service videos
```
