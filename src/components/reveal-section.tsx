"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A calm arrival for a block: it rises into place once it enters the viewport.
 * Transform only — an opacity fade on an ancestor would cut the glass inside off its backdrop.
 */
export function RevealSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < innerHeight * 0.9) return;
    element.classList.add("reveal-armed");
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { element.classList.add("reveal-arrived"); observer.disconnect(); }
    }, { threshold: 0.08 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal-section ${className}`}>{children}</div>;
}
