import { gsap } from "gsap";

/**
 * Numerical preloader: a 0 -> 100 count-up with a sliding bar and rotating
 * word cycle. Resolves when the intro-out animation finishes so the hero
 * entrance can fire.
 */
export function runPreloader(): Promise<void> {
  return new Promise((resolve) => {
    const root = document.getElementById("preloader")!;
    const numEl = document.getElementById("preloader-num")!;
    const barEl = document.getElementById("preloader-bar")!;
    const words = gsap.utils.toArray<HTMLElement>(
      "#preloader-words span"
    );

    const counter = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => resolve(),
    });

    // rotate the words while loading
    gsap.set(words, { yPercent: 100, opacity: 0 });
    words.forEach((w, i) => {
      tl.to(
        w,
        { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
        i * 0.7
      ).to(
        w,
        { yPercent: -100, opacity: 0, duration: 0.5, ease: "power3.in" },
        i * 0.7 + 0.55
      );
    });

    // count + bar
    tl.to(
      counter,
      {
        v: 100,
        duration: 2.1,
        ease: "power2.inOut",
        onUpdate: () => {
          const val = Math.round(counter.v);
          numEl.textContent = String(val);
          barEl.style.width = val + "%";
        },
      },
      0
    );

    // exit
    tl.to(root, {
      yPercent: -100,
      duration: 1.0,
      ease: "expo.inOut",
      delay: 0.15,
    }).set(root, { display: "none" });
  });
}
