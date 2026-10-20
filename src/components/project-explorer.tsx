"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { filterProjects, projectCategories, projects } from "@/lib/projects";
import { ProjectStage } from "@/components/project-stage";

export function ProjectExplorer() {
  const [category, setCategory] = useState<(typeof projectCategories)[number]>("Все");
  const reduced = useReducedMotion();
  const visible = filterProjects(category);

  return (
    <>
      <div className="filter-bar" role="group" aria-label="Фильтр проектов">
        {projectCategories.map((item) => (
          <button key={item} type="button" className={category === item ? "is-active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>
            {category === item && !reduced && <motion.span className="filter-active" layoutId="catalog-filter" transition={{ type: "spring", stiffness: 420, damping: 38, mass: .8 }} aria-hidden="true" />}
            <span className="filter-label">{item}</span>
            <motion.span className="filter-count" key={`${item}-${visible.length}`} initial={reduced ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, ease: [0.22, 1, 0.36, 1] }}>{item === "Все" ? projects.length : filterProjects(item).length}</motion.span>
          </button>
        ))}
      </div>
      <div className="project-list" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((project, index) => (
            <motion.article
              className={`project-row accent-${project.accent}`}
              key={project.slug}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: .55, delay: reduced ? 0 : Math.min(index, 8) * .045, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link className="catalog-stage-link" href={`/projects/${project.slug}`} aria-label={`Экраны проекта: ${project.title}`} tabIndex={-1}><ProjectStage project={project} compact /></Link>
              <div className="project-main">
                <div className="project-meta"><span>{project.shortTitle}</span><span>{project.status}</span></div>
                <h2><Link href={`/projects/${project.slug}`}>{project.title}</Link></h2>
                <p>{project.summary}</p>
                <ul className="tag-list" aria-label="Технологии">{project.stack.slice(0, 6).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <Link className="project-arrow" href={`/projects/${project.slug}`} aria-label={`Открыть кейс ${project.title}`}><ArrowUpRight aria-hidden="true" /></Link>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
