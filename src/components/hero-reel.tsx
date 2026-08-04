"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowDownRight, Download } from "lucide-react";
import type { PointerEvent } from "react";
import { useState } from "react";

const fragments = [
  { className: "cover-fragment cover-fragment-chess", src: "/cases/chessrise.webp", alt: "Фрагмент интерфейса ChessRise" },
  { className: "cover-fragment cover-fragment-pioner", src: "/cases/pioner.webp", alt: "Фрагмент сайта ТРЦ Пионер" },
  { className: "cover-fragment cover-fragment-worktime", src: "/cases/worktime.webp", alt: "Фрагмент программы подготовки отчетности" },
  { className: "cover-fragment cover-fragment-sysinvent", src: "/cases/sysinvent.webp", alt: "Фрагмент системы учета инфраструктуры" },
] as const;

export function HeroReel() {
  const reduceMotion = useReducedMotion();
  const [lensVisible, setLensVisible] = useState(false);
  const pointerX = useMotionValue(420);
  const pointerY = useMotionValue(230);
  const lensX = useSpring(pointerX, { stiffness: 180, damping: 24, mass: 0.45 });
  const lensY = useSpring(pointerY, { stiffness: 180, damping: 24, mass: 0.45 });

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion) return;
    setLensVisible(true);
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(event.clientX - bounds.left - 94);
    pointerY.set(event.clientY - bounds.top - 58);
  };

  return (
    <section className="liquid-cover" aria-labelledby="hero-title" onPointerMove={handlePointerMove} onPointerLeave={() => setLensVisible(false)}>
      <svg className="glass-filter" aria-hidden="true">
        <filter id="liquid-glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.028" numOctaves="2" seed="8" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </svg>

      <div className="cover-grid-lines" aria-hidden="true"><i /><i /><i /><i /></div>

      <div className="cover-fragments" aria-hidden="true">
        {fragments.map((fragment, index) => (
          <motion.div
            className={fragment.className}
            key={fragment.src}
            initial={reduceMotion ? false : { opacity: 0, y: 28, rotate: index % 2 ? 2 : -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.16 + index * 0.08, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image src={fragment.src} alt={fragment.alt} fill sizes="(max-width: 760px) 42vw, 24vw" priority={index < 2} />
          </motion.div>
        ))}
      </div>

      <div className="cover-copy">
        <motion.p className="cover-kicker" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          Portfolio / 2026
        </motion.p>
        <motion.h1 id="hero-title" initial={reduceMotion ? false : { opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}>
          <span>ILGIZ</span>
          <span>YAKHIN</span>
        </motion.h1>
        <motion.p className="cover-role" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34, duration: 0.55 }}>
          Full-stack / AI-разработчик
        </motion.p>
      </div>

      <motion.div className="liquid-lens" animate={{ opacity: lensVisible ? 1 : 0 }} style={reduceMotion ? undefined : { x: lensX, y: lensY }} aria-hidden="true">
        <span>Web</span><span>Desktop</span><span>Automation</span>
      </motion.div>

      <div className="cover-actions glass-surface">
        <Link href="#projects">Смотреть проекты <ArrowDownRight aria-hidden="true" /></Link>
        <a href="/resume/ilgiz-yakhin-compact.pdf" download>Резюме <Download aria-hidden="true" /></a>
      </div>
    </section>
  );
}
