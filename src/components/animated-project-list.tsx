"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { projects } from "@/lib/projects";

export function AnimatedProjectList() {
  const [activeSlug, setActiveSlug] = useState(projects[0].slug);
  const reduceMotion = useReducedMotion();
  const activeProject = projects.find((project) => project.slug === activeSlug) ?? projects[0];

  return (
    <section className="work-showcase" id="projects" aria-labelledby="work-title">
      <header className="work-heading">
        <p>2023—2026</p>
        <h2 id="work-title">Проекты</h2>
        <span>{projects.length.toString().padStart(2, "0")}</span>
      </header>

      <div className="work-layout">
        <div className="work-list">
          {projects.map((project) => (
            <motion.article
              className={`work-row accent-${project.accent} ${activeSlug === project.slug ? "is-active" : ""}`}
              key={project.slug}
              onFocusCapture={() => setActiveSlug(project.slug)}
              onHoverStart={() => setActiveSlug(project.slug)}
              onViewportEnter={() => setActiveSlug(project.slug)}
              initial={false}
            >
              <div className="work-row-top">
                <span>{project.index}</span>
                <span>{project.category.join(" · ")}</span>
              </div>
              <h3><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3>
              <p>{project.summary}</p>
              <div className="work-row-bottom">
                <span>{project.stack.slice(0, 3).join(" / ")}</span>
                <Link href={`/projects/${project.slug}`} aria-label={`Открыть кейс ${project.title}`}>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
              <Link className="work-mobile-visual" href={`/projects/${project.slug}`} tabIndex={-1} aria-hidden="true">
                <Image src={project.cover} alt="" fill loading="eager" sizes="(max-width: 760px) calc(100vw - 32px), 1px" />
              </Link>
            </motion.article>
          ))}
        </div>

        <div className="work-preview" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              className="work-preview-frame"
              key={activeProject.slug}
              initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -18, scale: 1.01 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/projects/${activeProject.slug}`} aria-label={`Открыть кейс ${activeProject.title}`}>
                <Image src={activeProject.cover} alt={activeProject.coverAlt} fill sizes="(max-width: 1100px) 50vw, 760px" priority={activeProject.slug === projects[0].slug} />
                <span>{activeProject.shortTitle}</span>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
