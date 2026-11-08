"use client";

import { useEffect, type RefObject } from "react";
import { loadGlassKit } from "@/components/glass/glass-runtime";

/**
 * The one bold moment of the site: a large liquid lens that floats over the hero,
 * follows the pointer with a spring and refracts the real name and screens under it.
 * Without a pointer it drifts on a slow path; with reduced motion it rests in place.
 * It moves by transform only (the kit sets translate), so it never shifts layout.
 */
export function HeroLens({ host }: { host: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let cleanup = () => {};
    Promise.all([loadGlassKit(), import("@/lib/liquid-glass/liquid-glass.js")]).then(([kit, core]) => {
      if (cancelled) return;
      const lens = kit.createLens(element, { className: "hero-lens" });
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      const x = new core.Spring(0, { response: 0.55, dampingRatio: 0.82 });
      const y = new core.Spring(0, { response: 0.55, dampingRatio: 0.82 });
      const grow = new core.Spring(0, { response: 0.4, dampingRatio: 0.7 });
      let size = 220;
      let pointerInside = false;
      let visible = true;
      let idle = 0;
      const start = performance.now();

      const rest = () => {
        const box = element.getBoundingClientRect();
        // Rest over the end of the name: the lens is first seen bending the letters.
        return { x: box.width * (box.width < 760 ? 0.62 : 0.38), y: box.height * (box.width < 760 ? 0.36 : 0.5) };
      };
      const measure = () => {
        const width = element.clientWidth;
        size = width < 760 ? 132 : width < 1180 ? 190 : 236;
      };
      const render = () => {
        const s = size * (1 + grow.value * 0.12);
        const speed = Math.min(1, (Math.abs(x.velocity) + Math.abs(y.velocity)) / 2400);
        const stretch = 1 + speed * 0.16;
        const w = s * stretch;
        const h = s / Math.sqrt(stretch);
        lens.set({
          x: x.value - w / 2, y: y.value - h / 2, w, h, r: Math.min(w, h) / 2,
          lift: 0.35 + grow.value * 0.4,
          strength: 34 + grow.value * 10,
          bezel: Math.min(46, s * 0.22),
          magnify: 1.22 + grow.value * 0.06,
          blur: 0,
        });
      };
      const driver = core.springDriver(render);
      driver.add(x, y, grow);

      const place = (px: number, py: number, instant = false) => {
        x.target = px; y.target = py;
        if (instant || reduced.matches) { x.set(px); y.set(py); render(); } else driver.kick();
      };
      measure();
      const home = rest();
      place(home.x, home.y, true);

      // Drift without a pointer: a slow Lissajous loop around the resting point.
      const drift = (now: number) => {
        idle = 0;
        if (cancelled || pointerInside || !visible || reduced.matches) return;
        const t = (now - start) / 1000;
        const box = element.getBoundingClientRect();
        const origin = rest();
        place(origin.x + Math.sin(t * 0.37) * box.width * 0.16, origin.y + Math.sin(t * 0.53 + 1.2) * box.height * 0.14);
        idle = requestAnimationFrame(drift);
      };
      const startDrift = () => { if (!idle && !reduced.matches) idle = requestAnimationFrame(drift); };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || reduced.matches) return;
        const box = element.getBoundingClientRect();
        pointerInside = true;
        place(event.clientX - box.left, event.clientY - box.top);
      };
      const onLeave = () => { pointerInside = false; startDrift(); };
      const onDown = (event: PointerEvent) => { if (event.pointerType === "mouse") { grow.target = 1; driver.kick(); } };
      const onUp = () => { grow.target = 0; driver.kick(); };
      const onResize = () => { measure(); const point = rest(); place(point.x, point.y, true); };
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) startDrift();
      });
      observer.observe(element);
      element.addEventListener("pointermove", onMove);
      element.addEventListener("pointerleave", onLeave);
      element.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("resize", onResize);
      const offGlass = kit.onGlassChange(render);
      startDrift();

      cleanup = () => {
        cancelAnimationFrame(idle);
        driver.stop();
        observer.disconnect();
        offGlass();
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerleave", onLeave);
        element.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("resize", onResize);
        lens.destroy();
      };
    });
    return () => { cancelled = true; cleanup(); };
  }, [host]);
  return null;
}
