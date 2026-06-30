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

  gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
    const split = new SplitText(el, { type: "words", wordsClass: "split-word" });
    gsap.from(split.words, {
      opacity: 0,
      yPercent: 90,
      filter: "blur(8px)",
      duration: 0.95,
      ease: "power3.out",
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 80%" },
    });
  });
}

/**
 * Hero stays PINNED at the top. The three service sections then scroll up
 * one after another and stack over it (and over each other) — each one
 * "pulled up" as scrolling continues. The section being covered eases back
 * in scale + dims, giving cinematic depth.
 */
function stackedReveal() {
  const hero = document.querySelector<HTMLElement>("#hero")!;
  const services = gsap.utils.toArray<HTMLElement>("[data-service]");
  const layers = [hero, ...services];

  // pin every layer except the last so the next one rises over a fixed layer
  layers.forEach((layer, i) => {
    if (i === layers.length - 1) return;
    ScrollTrigger.create({
      trigger: layer,
      start: "top top",
      end: "+=100%",
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    });
  });

  // depth: as the NEXT layer covers the current one, push it back + dim it
  layers.forEach((layer, i) => {
    if (i === layers.length - 1) return;
    const next = layers[i + 1];
    const content =
      layer.querySelector<HTMLElement>(".service__inner") ?? layer;
    const media = layer.querySelector<HTMLElement>(".service__video");

    gsap.fromTo(
      content,
      { scale: 1, opacity: 1, filter: "brightness(1)" },
      {
        scale: 0.9,
        opacity: 0.35,
        filter: "brightness(0.7)",
        ease: "none",
        scrollTrigger: {
          trigger: next,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      }
    );
    if (media) {
      gsap.fromTo(
        media,
        { scale: 1.06 },
        {
          scale: 1.16,
          ease: "none",
          scrollTrigger: {
            trigger: next,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        }
      );
    }
  });

  // incoming layers get a "pulled-up card" rounded top that flattens on arrival
  services.forEach((s) => {
    gsap.fromTo(
      s,
      { borderTopLeftRadius: "44px", borderTopRightRadius: "44px" },
      {
        borderTopLeftRadius: "0px",
        borderTopRightRadius: "0px",
        ease: "none",
        scrollTrigger: {
          trigger: s,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      }
    );
  });

  // play videos only while their section is in view (perf)
  const videos = gsap.utils.toArray<HTMLVideoElement>("[data-service-video]");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    },
    { threshold: 0.15 }
  );
  videos.forEach((v) => io.observe(v));
}

export function initScenes() {
  trackingReveals();
  stackedReveal();
  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
