"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { Project } from "@/lib/projects";
import { projects } from "@/lib/projects";

function ProjectFeature({ project }: { project: Project }) {
  const target = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["-4%", "4%"]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], reduceMotion ? [1, 1, 1] : [1.06, 1, 1.06]);

  return (
    <article className={`project-feature project-${project.slug} accent-${project.accent}`} ref={target}>
      <div className="project-feature-copy">
        <div className="project-feature-meta"><span>{project.index}</span><span>{project.category.join(" · ")}</span></div>
        <h3><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3>
        <p>{project.summary}</p>
        <div className="project-feature-footer">
          <span>{project.stack.slice(0, 4).join(" / ")}</span>
          <Link href={`/projects/${project.slug}`} aria-label={`Открыть кейс ${project.title}`}><ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </div>
      <Link className="project-feature-media" href={`/projects/${project.slug}`} aria-label={`Открыть кейс ${project.title}`}>
        <motion.div style={{ y: imageY, scale: imageScale }}>
          <Image src={project.cover} alt={project.coverAlt} fill loading={project.index === "01" ? "eager" : "lazy"} sizes="(max-width: 760px) calc(100vw - 32px), 58vw" unoptimized />
        </motion.div>
        <span>Открыть кейс <ArrowUpRight aria-hidden="true" /></span>
      </Link>
    </article>
  );
}

export function AnimatedProjectList() {
  return (
    <section className="project-film" id="projects" aria-labelledby="work-title">
      <header className="project-film-heading"><p>Selected work · 2023—2026</p><h2 id="work-title">Проекты</h2><span>06</span></header>
      <div>{projects.map((project) => <ProjectFeature project={project} key={project.slug} />)}</div>
    </section>
  );
}
