import "./style.css";
import { gsap } from "gsap";
import { initGlLines } from "./modules/glLines";
import { initCursor } from "./modules/cursor";
import { runPreloader } from "./modules/preloader";
import { initSmoothScroll, heroEntrance, initScenes } from "./modules/scenes";

async function boot() {
  // lock scroll while the preloader runs
  document.documentElement.style.overflow = "hidden";

  // WebGL line field starts immediately (sits behind everything)
  const canvas = document.getElementById("gl") as HTMLCanvasElement;
  initGlLines(canvas);

  // smooth scroll + scene timelines can be built up front
  const lenis = initSmoothScroll();
  (window as any).lenis = lenis;
  lenis.stop();

  initCursor();

  // run the countdown, then reveal
  await runPreloader();

  document.documentElement.style.overflow = "";
  lenis.start();

  heroEntrance();
  initScenes();
}

// wait for fonts to avoid SplitText reflow jumps
if ((document as any).fonts?.ready) {
  (document as any).fonts.ready.then(boot);
} else {
  window.addEventListener("DOMContentLoaded", boot);
}

// gsap defaults
gsap.defaults({ ease: "power3.out" });
