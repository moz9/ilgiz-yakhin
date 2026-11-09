"use client";

import { useRef } from "react";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

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
  useGSAP(() => {
    const element = band.current;
    if (!element) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const run = { p: 0 };
      gsap.to(run, {
        p: 1,
        ease: "none",
        onUpdate: () => element.style.setProperty("--p", run.p.toFixed(4)),
        scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: 1.2 },
      });
    });
    return () => mm.revert();
  }, { scope: band });

  return <div className="skill-band" ref={band}>
    {rows.map((row, index) =>
      <p className={`skill-row${index ? " is-outline" : ""}`} key={index}>
        {[...row, ...row].map((item, n) => <span key={n} aria-hidden={n >= row.length || undefined}>{item}<i aria-hidden="true" /></span>)}
      </p>)}
  </div>;
}
