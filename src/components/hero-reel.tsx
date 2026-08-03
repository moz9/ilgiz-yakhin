"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, Download } from "lucide-react";

const disciplines = ["WEB", "DESKTOP", "AUTOMATION", "INFRASTRUCTURE"];

export function HeroReel() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="editorial-hero" aria-labelledby="hero-title">
      <div className="editorial-meta"><span>Портфолио · 2026</span><span>Full-stack / AI-разработчик</span></div>
      <div className="editorial-title">
        <motion.h1 id="hero-title" initial={reduceMotion ? false : { opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75, ease: [0.22, 1, 0.36, 1] }}>
          <span>ILGIZ</span><span>YAKHIN</span>
        </motion.h1>
        <p>Разработка web-продуктов,<br />desktop-приложений и автоматизации.</p>
      </div>
      <div className="editorial-bottom">
        <div className="discipline-track" aria-hidden="true"><div>{[...disciplines, ...disciplines].map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div></div>
        <div className="editorial-actions">
          <a href="#projects">Проекты <ArrowDown aria-hidden="true" /></a>
          <a href="/resume/ilgiz-yakhin-compact.pdf" download>Резюме <Download aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
