"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { projects, type Project } from "@/lib/projects";
import { ProjectStage } from "@/components/project-stage";

const featuredSlugs = ["chessrise", "pioner", "worktime-reporting", "infrastructure-inventory", "content-platform", "revalib"];
const featured = featuredSlugs.map((slug) => projects.find((project) => project.slug === slug)).filter((project): project is Project => Boolean(project));
const other = projects.filter((project) => !featuredSlugs.includes(project.slug));

export function AnimatedProjectList() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [preview, setPreview] = useState(other[0]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".redesign-project-card"));
    let frame = 0;
    const update = () => {
      if (window.innerWidth <= 860 || reduced.matches) {
        wrap.style.height = "";
        track.style.transform = "";
        cards.forEach((card) => card.style.removeProperty("--travel"));
        setActiveIndex(0);
        if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
        return;
      }
      const distance = Math.max(0, track.scrollWidth - window.innerWidth);
      wrap.style.height = `${distance + window.innerHeight}px`;
      const amount = Math.max(0, Math.min(1, -wrap.getBoundingClientRect().top / Math.max(distance, 1)));
      track.style.transform = `translate3d(${-amount * distance}px,0,0)`;
      cards.forEach((card) => {
        const offset = (card.offsetLeft + card.offsetWidth / 2 - amount * distance - innerWidth / 2) / (innerWidth * .7);
        card.style.setProperty("--travel", String(Math.max(-1, Math.min(1, offset))));
      });
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${amount})`;
      setActiveIndex(Math.round(amount * (featured.length - 1)));
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
          <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          <span className="redesign-progress-track"><i ref={progressRef} style={{ transform: "scaleX(0)" }} /></span>
          <span>{String(featured.length).padStart(2, "0")}</span>
        </div>
        <div className="redesign-track" ref={trackRef}>
          {featured.map((project, index) =>
            <Link className="redesign-project-card" href={`/projects/${project.slug}`} key={project.slug}>
              <span className="project-scene-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <ProjectStage project={project} compact />
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
      <div className="other-preview"><h3>Другие проекты</h3><div key={preview.slug} className="other-preview-stage"><ProjectStage project={preview} compact /></div><span className="redesign-mono">{preview.stack.slice(0, 3).join(" · ")}</span></div>
      <div className="other-project-links">{other.map((project, index) =>
        <Link href={`/projects/${project.slug}`} key={project.slug} data-preview={preview.slug === project.slug} onMouseEnter={() => setPreview(project)} onFocus={() => setPreview(project)}><small className="redesign-mono">{String(index + 1).padStart(2, "0")}</small><span>{project.title}</span><ArrowUpRight aria-hidden="true" /></Link>)}</div>
    </div>
  </section>;
}
