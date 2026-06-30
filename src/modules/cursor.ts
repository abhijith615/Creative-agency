import { gsap } from "gsap";

/**
 * Magnetic, state-changing custom cursor.
 * - Lerps to the pointer for a fluid trail.
 * - Elements with [data-cursor="..."] scale the cursor up and show a label.
 * - Elements with [data-magnetic] pull the cursor (and themselves) toward them.
 */
const LABELS: Record<string, string> = {
  explore: "Explore",
  scroll: "Scroll",
  watch: "Watch",
  home: "Home",
  write: "Say hi",
};

export function initCursor() {
  if (window.matchMedia("(hover: none)").matches) return;

  const cursor = document.getElementById("cursor")!;
  const label = document.getElementById("cursor-label")!;

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const mouse = { x: pos.x, y: pos.y };

  const xSet = gsap.quickSetter(cursor, "x", "px");
  const ySet = gsap.quickSetter(cursor, "y", "px");

  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );

  gsap.ticker.add(() => {
    const dt = 1 - Math.pow(0.0001, gsap.ticker.deltaRatio() / 60);
    pos.x += (mouse.x - pos.x) * 0.2;
    pos.y += (mouse.y - pos.y) * 0.2;
    xSet(pos.x);
    ySet(pos.y);
  });

  // hover states
  document.querySelectorAll<HTMLElement>("[data-cursor]").forEach((el) => {
    const key = el.dataset.cursor || "";
    el.addEventListener("pointerenter", () => {
      cursor.classList.add("cursor--hover");
      label.textContent = LABELS[key] ?? key;
    });
    el.addEventListener("pointerleave", () => {
      cursor.classList.remove("cursor--hover");
      label.textContent = "";
    });
  });

  // generic link/button hover -> subtle grow
  document
    .querySelectorAll<HTMLElement>("a:not([data-cursor]), button")
    .forEach((el) => {
      el.addEventListener("pointerenter", () =>
        gsap.to(cursor, { scale: 2.4, duration: 0.3, ease: "power3.out" })
      );
      el.addEventListener("pointerleave", () =>
        gsap.to(cursor, { scale: 1, duration: 0.3, ease: "power3.out" })
      );
    });

  // magnetic elements
  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic || "0.35");
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      gsap.to(el, {
        x: mx * strength,
        y: my * strength,
        duration: 0.6,
        ease: "power3.out",
      });
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    });
  });
}
