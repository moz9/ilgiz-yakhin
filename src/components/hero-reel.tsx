"use client";

import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Building2, Check, Crown } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GlassLayer } from "@/components/glass-layer";
import { projects } from "@/lib/projects";

const exhibits = [
  { slug: "chessrise", label: "ChessRise", icon: Crown, outcome: "Принят и оплачен заказчиком", type: "Сайт шахматной школы", color: "#b8e4cf" },
  { slug: "pioner", label: "Пионер", icon: Building2, outcome: "Публичный preview · в разработке", type: "Сайт торгового центра", color: "#e2c9ee" },
  { slug: "revalib", label: "RevaLib", icon: BookOpen, outcome: "Работающая публичная база знаний", type: "Контентный web-продукт", color: "#bee0ee" },
].map((exhibit) => ({ ...exhibit, project: projects.find((project) => project.slug === exhibit.slug)! }));

export function HeroReel() {
  const heroRef = useRef<HTMLElement>(null);
  const touchStart = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(pointerX, { stiffness: 75, damping: 24 });
  const rotateX = useSpring(pointerY, { stiffness: 75, damping: 24 });
  const exhibit = exhibits[active];

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      const progress = media.matches ? 0 : Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / hero.offsetHeight));
      hero.style.setProperty("--hero-scroll", String(progress));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    media.addEventListener("change", schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); media.removeEventListener("change", schedule); };
  }, []);

  const select = (index: number) => setActive((index + exhibits.length) % exhibits.length);

  return <section className="redesign-hero hero-studio" id="top" ref={heroRef} aria-labelledby="hero-title">
    <div className="hero-studio-top redesign-mono">
      <span className="redesign-availability"><i />Открыт к удалённой работе</span>
      <span>Full-stack / AI-разработчик</span>
    </div>
    <h1 id="hero-title" aria-label="ILGIZ YAKHIN"><span>ИЛЬГИЗ</span> <span>ЯХИН<span className="hero-name-dot">.</span></span></h1>
    <div className="hero-exhibit" onPointerDown={(event) => { if (event.pointerType === "touch") touchStart.current = event.clientX; }} onPointerUp={(event) => {
      if (touchStart.current !== null && Math.abs(event.clientX - touchStart.current) > 50) select(active + (event.clientX < touchStart.current ? 1 : -1));
      touchStart.current = null;
    }} onPointerCancel={() => { touchStart.current = null; }} onPointerMove={(event) => {
      if (reduced || event.pointerType !== "mouse") return;
      const rect = event.currentTarget.getBoundingClientRect();
      pointerX.set(((event.clientX - rect.left) / rect.width - .5) * 7);
      pointerY.set(((event.clientY - rect.top) / rect.height - .5) * -5);
    }} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
      <motion.div className="hero-exhibit-camera" style={{ rotateX, rotateY }}>
        {exhibits.map((item, index) => {
          const side = index - active;
          return <motion.div className="hero-screen" key={item.slug} data-active={index === active} aria-hidden={index !== active}
            initial={false} animate={{ x: `${side * 103}%`, y: side === 0 ? 0 : 38, rotateY: side * -18, rotateZ: side * 3, scale: side === 0 ? 1 : .88, opacity: side === 0 ? 1 : .55 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 105, damping: 24 }}>
            <div className="hero-screen-bar" style={{ backgroundColor: item.color }}><span aria-hidden="true"><i /><i /><i /></span><span>{item.type}</span><ArrowUpRight aria-hidden="true" /></div>
            <picture><source media="(max-width: 600px)" srcSet={item.project.media?.find((media) => media.presentation === "phone")?.src} /><Image src={item.project.cover} alt={item.project.coverAlt} fill sizes="(max-width: 600px) 115vw, 90vw" loading="eager" /></picture>
          </motion.div>;
        })}
      </motion.div>
      <div className="hero-switcher liquid-surface" role="group" aria-label="Проект на первом экране">
        <GlassLayer />
        <button className="hero-step" onClick={() => select(active - 1)} aria-label="Предыдущий проект" title="Предыдущий проект"><ArrowLeft aria-hidden="true" /></button>
        {exhibits.map((item, index) => <button className="hero-choice" key={item.slug} aria-pressed={active === index} onClick={() => select(index)}>
          {active === index && <motion.span className="hero-choice-selection" layoutId="hero-choice" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
          <item.icon aria-hidden="true" /><span>{item.label}</span>
        </button>)}
        <button className="hero-step" onClick={() => select(active + 1)} aria-label="Следующий проект" title="Следующий проект"><ArrowRight aria-hidden="true" /></button>
      </div>
      <Link className="hero-case-link liquid-surface" href={`/projects/${exhibit.slug}`} aria-label={`Смотреть кейс ${exhibit.label}`}><GlassLayer /><ArrowUpRight aria-hidden="true" /><span>Кейс</span></Link>
    </div>
    <div className="hero-studio-bottom">
      <div className="hero-intro"><p>От задачи до продукта,<br /><strong>которым пользуются.</strong></p><span>Web, desktop и автоматизация. Интерфейс, данные, запуск и сопровождение.</span></div>
      <div className="hero-delivery" aria-live="polite"><span className="redesign-mono">{String(active + 1).padStart(2, "0")} / {exhibits.length.toString().padStart(2, "0")}</span><span><Check aria-hidden="true" />{exhibit.outcome}</span></div>
      <div className="hero-studio-actions"><Link href="#contact" className="hero-contact">Обсудить проект <ArrowUpRight aria-hidden="true" /></Link><Link href="#work">Все работы <ArrowDownRight aria-hidden="true" /></Link></div>
    </div>
  </section>;
}
