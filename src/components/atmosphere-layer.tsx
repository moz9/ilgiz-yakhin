"use client";

import { useEffect } from "react";

/**
 * Two global details: a film grain over the whole page and a cursor spotlight
 * for cards that ask for it with `data-spotlight`.
 */
export function AtmosphereLayer() {
  useEffect(() => {
    let current: HTMLElement | null = null;
    let rect: DOMRect | null = null;

    const refresh = () => { rect = current ? current.getBoundingClientRect() : null; };
    const release = () => { current?.removeAttribute("data-spotlight-active"); current = null; rect = null; };

    const onMove = (event: PointerEvent) => {
      const origin = event.target as HTMLElement | null;
      const element = origin?.closest ? (origin.closest("[data-spotlight]") as HTMLElement | null) : null;
      if (element !== current) {
        current?.removeAttribute("data-spotlight-active");
        current = element;
        if (current) { current.setAttribute("data-spotlight-active", ""); refresh(); }
      }
      if (!current || !rect) return;
      current.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      current.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("resize", refresh);
    document.addEventListener("pointerleave", release);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", refresh);
      window.removeEventListener("resize", refresh);
      document.removeEventListener("pointerleave", release);
    };
  }, []);

  return <div className="grain-overlay" aria-hidden="true" />;
}
