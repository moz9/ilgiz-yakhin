"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { projects, type Project } from "@/lib/projects";

const featuredSlugs = ["chessrise", "pioner", "worktime-reporting", "infrastructure-inventory", "lunafantasy", "revalib"];
const featured = featuredSlugs.map((slug) => projects.find((project) => project.slug === slug)).filter((project): project is Project => Boolean(project));
const other = projects.filter((project) => !featuredSlugs.includes(project.slug));

export function AnimatedProjectList() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      if (window.innerWidth <= 860 || reduced.matches) {
        wrap.style.height = "";
        track.style.transform = "";
        setProgress(0);
        return;
      }
      const distance = Math.max(0, track.scrollWidth - window.innerWidth);
      wrap.style.height = `${distance + window.innerHeight}px`;
      const amount = Math.max(0, Math.min(1, -wrap.getBoundingClientRect().top / Math.max(distance, 1)));
      track.style.transform = `translate3d(${-amount * distance}px,0,0)`;
      setProgress(amount);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

  return <section className="redesign-work" id="work" aria-labelledby="work-title">
    <div className="redesign-section-head">
      <h2 id="work-title">Проекты</h2>
      <Link href="/projects">Все {projects.length} проектов <ArrowUpRight aria-hidden="true" /></Link>
    </div>
    <div className="redesign-pin-wrap" ref={wrapRef}>
      <div className="redesign-pin">
        <div className="redesign-progress redesign-mono" aria-hidden="true">
          <span>{String(Math.min(featured.length, Math.round(progress * (featured.length - 1)) + 1)).padStart(2, "0")}</span>
          <span className="redesign-progress-track"><i style={{ transform: `scaleX(${progress})` }} /></span>
          <span>{String(featured.length).padStart(2, "0")}</span>
        </div>
        <div className="redesign-track" ref={trackRef}>
          {featured.map((project) =>
            <Link className="redesign-project-card" href={`/projects/${project.slug}`} key={project.slug}>
              <span className="redesign-card-image" style={{ backgroundImage: `url(${project.cover})` }} role="img" aria-label={project.coverAlt} />
              <span className="redesign-card-copy">
                <span className="redesign-card-status redesign-mono"><i />{project.status}</span>
                <strong>{project.title}</strong>
                <span className="redesign-card-task">{project.task}</span>
                <span className="redesign-card-results">{project.results.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</span>
                <span className="redesign-card-stack redesign-mono">{project.stack.slice(0, 4).join(" · ")}</span>
                <ArrowUpRight className="redesign-card-arrow" aria-hidden="true" />
              </span>
            </Link>)}
        </div>
      </div>
    </div>
    <div className="redesign-other">
      <h3>Другие проекты</h3>
      <div>{other.map((project) =>
        <Link href={`/projects/${project.slug}`} key={project.slug}><span>{project.title}</span><ArrowUpRight aria-hidden="true" /></Link>)}</div>
    </div>
  </section>;
}
