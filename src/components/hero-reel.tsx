"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, Download } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { projects } from "@/lib/projects";

const reel = projects.filter(({ access }) => access !== "private").slice(0, 4);

export function HeroReel() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % reel.length), 4800);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const project = reel[active];

  return (
    <section className="cinematic-hero" aria-labelledby="hero-title">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          className="cinematic-media"
          key={project.slug}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.045 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image src={project.cover} alt="" fill sizes="100vw" priority unoptimized />
        </motion.div>
      </AnimatePresence>
      <div className="cinematic-shade" />

      <div className="cinematic-meta"><span>Портфолио · 2026</span></div>
      <div className="cinematic-title">
        <p>Full-stack / AI-разработчик</p>
        <h1 id="hero-title"><span>ILGIZ</span><span>YAKHIN</span></h1>
      </div>
      <div className="cinematic-bottom">
        <p>Web-продукты, desktop-приложения,<br />автоматизация и инфраструктура.</p>
        <div className="reel-controls" role="group" aria-label="Проекты на первом экране">
          {reel.map((item, index) => (
            <button key={item.slug} type="button" className={active === index ? "is-active" : ""} onClick={() => setActive(index)} aria-label={`Показать ${item.title}`} aria-pressed={active === index}>
              <span>{(index + 1).toString().padStart(2, "0")}</span><i />
            </button>
          ))}
        </div>
        <div className="cinematic-actions">
          <a href="#projects">Проекты <ArrowDown aria-hidden="true" /></a>
          <a href="/resume/ilgiz-yakhin-compact.pdf" download>Резюме <Download aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
