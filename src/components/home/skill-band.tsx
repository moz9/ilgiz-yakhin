"use client";

import { useEffect, useRef } from "react";

const rows = [
  ["Web-продукты", "Android", "Desktop", "AI-инструменты"],
  ["Автоматизация", "Инфраструктура", "Стриминг", "Отчётность"],
];

/**
 * Two rows of giant type that slide in opposite directions with the scroll: what I build,
 * said at the scale of the hero. One row is filled, the other only outlined.
 */
export function SkillBand() {
  const band = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = band.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      const box = element.getBoundingClientRect();
      const p = (innerHeight - box.top) / (innerHeight + box.height);
      element.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", schedule, { passive: true });
    return () => { cancelAnimationFrame(frame); removeEventListener("scroll", schedule); };
  }, []);

  return <div className="skill-band" ref={band}>
    {rows.map((row, index) =>
      <p className={`skill-row${index ? " is-outline" : ""}`} key={index}>
        {[...row, ...row].map((item, n) => <span key={n} aria-hidden={n >= row.length || undefined}>{item}<i aria-hidden="true" /></span>)}
      </p>)}
  </div>;
}
