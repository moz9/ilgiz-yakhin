"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

const columns = [
  ["chessrise", "worktime", "pioner"],
  ["pioner", "sysinvent", "chessrise"],
  ["worktime", "chessrise", "sysinvent"],
];

function ProjectWall({ color = false }: { color?: boolean }) {
  return <div className={`redesign-wall-layer ${color ? "redesign-wall-color" : "redesign-wall-base"}`} aria-hidden="true">
    <div className="redesign-wall">{columns.map((column, index) =>
      <div className="redesign-wall-column" key={index}>{[...column, ...column].map((name, tile) =>
        <span className={`redesign-wall-tile redesign-tile-${name}`} key={tile} />)}</div>)}</div>
  </div>;
}

export function HeroReel() {
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    // The lens keeps its box and moves by transform only: changing left and top on every
    // frame is a layout change, and the hero is the largest element on the page.
    const baseX = 64;
    const baseY = 44 + 18 * Math.sin(1);
    let box = hero.getBoundingClientRect();
    const onResize = () => { box = hero.getBoundingClientRect(); };
    window.addEventListener("resize", onResize, { passive: true });
    const start = performance.now();
    const animate = (now: number) => {
      const time = (now - start) / 1000;
      const x = baseX + 20 * Math.sin(time * 0.32);
      const y = 44 + 18 * Math.sin(time * 0.51 + 1);
      hero.style.setProperty("--lens-x", `${x.toFixed(2)}%`);
      hero.style.setProperty("--lens-y", `${y.toFixed(2)}%`);
      hero.style.setProperty("--lens-dx", `${(((x - baseX) / 100) * box.width).toFixed(2)}px`);
      hero.style.setProperty("--lens-dy", `${(((y - baseY) / 100) * box.height).toFixed(2)}px`);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); };
  }, []);

  return <section className="redesign-hero" id="top" ref={heroRef} aria-labelledby="hero-title">
    <ProjectWall /><ProjectWall color />
    <div className="redesign-hero-shade" aria-hidden="true" />
    <div className="redesign-lens" aria-hidden="true" />
    <div className="redesign-hero-top redesign-mono">
      <span className="redesign-availability"><i />Открыт к удалённой работе</span>
      <span>Full-stack / AI-разработчик</span>
    </div>
    <div className="redesign-hero-copy">
      <h1 id="hero-title" aria-label="ILGIZ YAKHIN"><span>ИЛЬГИЗ</span><span>ЯХИН</span></h1>
      <p>Проектирую, пишу и выпускаю web-продукты, desktop-приложения и автоматизацию. От интерфейса до запуска и сопровождения.</p>
      <div className="redesign-hero-actions">
        <Link className="redesign-button redesign-button-main" href="#work">Смотреть проекты <ArrowDownRight aria-hidden="true" /></Link>
        <Link className="redesign-button" href="/resume">Резюме <ArrowUpRight aria-hidden="true" /></Link>
      </div>
    </div>
  </section>;
}
