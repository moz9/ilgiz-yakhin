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
    const start = performance.now();
    const animate = (now: number) => {
      const time = (now - start) / 1000;
      hero.style.setProperty("--lens-x", `${(64 + 20 * Math.sin(time * 0.32)).toFixed(2)}%`);
      hero.style.setProperty("--lens-y", `${(44 + 18 * Math.sin(time * 0.51 + 1)).toFixed(2)}%`);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
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
