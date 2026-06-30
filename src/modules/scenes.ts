import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);

export function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href")!;
      if (id.length > 1) {
        e.preventDefault();
        lenis.scrollTo(id, { offset: 0, duration: 1.4 });
      }
    });
  });

  return lenis;
}

/** Hero entrance — fires after the preloader resolves. */
export function heroEntrance() {
  const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

  gsap.set("[data-hero-line]", { yPercent: 120 });

  tl.from(".nav", { yPercent: -100, opacity: 0, duration: 1.0 }, 0)
    .to(lines, { yPercent: 0, duration: 1.3, stagger: 0.08 }, 0.1)
    .from(
      "[data-reveal]",
      { y: 30, opacity: 0, duration: 1.0, stagger: 0.12 },
      0.5
    )
    .from(".hero__scroll", { opacity: 0, y: 20, duration: 0.8 }, 0.7);

  return tl;
}

/** Word/line track-in reveals as headers enter the viewport. */
function trackingReveals() {
  gsap.utils.toArray<HTMLElement>("[data-track]").forEach((el) => {
    const inner = new SplitText(el, { type: "lines", linesClass: "split-line" });
    gsap.set(inner.lines, { yPercent: 110, opacity: 0 });
    gsap.to(inner.lines, {
      yPercent: 0,
      opacity: 1,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.12,
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

}

/**
 * Hero stays PINNED as the base layer. Each of the three service sections is
 * "pulled up" over the one beneath it, then HOLDS fully in view for a dwell so
 * the viewer can read it, before the next one rises. The covered layer eases
 * back in scale + dims for cinematic depth. Driven by one scrubbed master
 * timeline pinned to the stage, so the gaps between pull-ups are explicit.
 */
function stackedReveal() {
  const stage = document.querySelector<HTMLElement>("#stage")!;
  const hero = document.querySelector<HTMLElement>("#hero")!;
  const services = gsap.utils.toArray<HTMLElement>("[data-service]");
  const layers = [hero, ...services];

  // timing in abstract "units"; 1 unit ≈ one viewport of scroll
  const REVEAL = 1.0; // how long a pull-up takes
  const HOLD = 1.2; // the readable GAP each section dwells, fully in view
  const LEAD = 0.6; // initial pause so the hero is readable first

  let totalUnits = LEAD;
  services.forEach(() => (totalUnits += REVEAL + HOLD));

  // pre-split each service title for a word track-in synced to its reveal
  const titleWords = services.map((s) => {
    const el = s.querySelector<HTMLElement>("[data-split]");
    if (!el) return [];
    const split = new SplitText(el, { type: "words", wordsClass: "split-word" });
    gsap.set(split.words, { yPercent: 90, opacity: 0, filter: "blur(8px)" });
    return split.words as HTMLElement[];
  });

  gsap.set(services, {
    yPercent: 100,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
  });
  // start state is set — safe to reveal the stack now (no flash)
  gsap.set(".stack", { visibility: "visible" });

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: stage,
      start: "top top",
      end: () => "+=" + Math.round(totalUnits * window.innerHeight),
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // explicit playhead position; advance by REVEAL + HOLD each section so the
  // dwell is a real, empty gap in the timeline (= readable pause on screen)
  let at = LEAD;

  services.forEach((s, i) => {
    const beneath = layers[i]; // layer being covered
    const beneathContent =
      beneath.querySelector<HTMLElement>(".service__inner") ?? beneath;
    const video = s.querySelector<HTMLVideoElement>("[data-service-video]");
    const media = s.querySelector<HTMLElement>(".service__video");
    const prevVideo =
      i > 0
        ? services[i - 1].querySelector<HTMLVideoElement>("[data-service-video]")
        : null;

    // pull this section up + flatten its rounded "pulled-card" top
    tl.fromTo(
      s,
      { yPercent: 100, borderTopLeftRadius: 48, borderTopRightRadius: 48 },
      {
        yPercent: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        duration: REVEAL,
        ease: "power2.out",
        onStart: () => {
          video?.play().catch(() => {});
          prevVideo?.pause();
        },
        onReverseComplete: () => video?.pause(),
      },
      at
    );

    // slow push-in on the incoming video across reveal + the hold
    if (media) {
      tl.fromTo(
        media,
        { scale: 1.12 },
        { scale: 1.04, duration: REVEAL + HOLD, ease: "none" },
        at
      );
    }

    // depth: dim + scale back the layer being covered, concurrently
    tl.fromTo(
      beneathContent,
      { scale: 1, opacity: 1, filter: "brightness(1)" },
      {
        scale: 0.92,
        opacity: 0.5,
        filter: "brightness(0.72)",
        duration: REVEAL,
        ease: "power2.out",
      },
      at
    );

    // word track-in as the section settles
    const words = titleWords[i];
    if (words.length) {
      tl.to(
        words,
        {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: REVEAL * 0.7,
          ease: "power3.out",
          stagger: REVEAL * 0.06,
        },
        at + REVEAL * 0.35
      );
    }

    // advance past the reveal AND the readable hold/gap
    at += REVEAL + HOLD;
  });

  // ensure the timeline spans the full pinned distance
  tl.to({}, { duration: 0.01 }, totalUnits);
}

export function initScenes() {
  trackingReveals();
  stackedReveal();
  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
