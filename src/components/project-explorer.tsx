"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { filterProjects, projectCategories, projects } from "@/lib/projects";
import { ProjectStage } from "@/components/project-stage";
import { useGlassTabs } from "@/components/glass/glass-runtime";

const categoryLabels: Record<(typeof projectCategories)[number], string> = {
  Все: "Все",
  Web: "Web",
  Mobile: "Android",
  Desktop: "Desktop",
  Automation: "Автоматизация",
  Infrastructure: "Инфраструктура",
};

export function ProjectExplorer() {
  const [category, setCategory] = useState<(typeof projectCategories)[number]>("Все");
  const reduced = useReducedMotion();
  const tabs = useRef<HTMLDivElement>(null);
  const visible = filterProjects(category);
  useGlassTabs(tabs, projectCategories.indexOf(category), (index) => setCategory(projectCategories[index]));

  return <>
    <div className="filter" data-lg="surface">
      <div className="filter-tabs" ref={tabs} role="tablist" aria-label="Фильтр проектов">
        {projectCategories.map((item) =>
          <button key={item} type="button" role="tab" aria-selected={category === item} aria-controls="project-grid" tabIndex={category === item ? 0 : -1}>
            <span>{categoryLabels[item]}</span><small>{item === "Все" ? projects.length : filterProjects(item).length}</small>
          </button>)}
      </div>
    </div>
    <div className="project-grid" id="project-grid" role="tabpanel" aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        {visible.map((project, index) =>
          <motion.article className="project-card" key={project.slug} layout={!reduced}
            initial={reduced ? false : { y: 40, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={reduced ? undefined : { scale: 0.92, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : Math.min(index, 6) * 0.04, ease: [0.16, 1, 0.3, 1] }}>
            <Link href={`/projects/${project.slug}`} className="project-card-link">
              <ProjectStage project={project} compact sizes="(max-width: 860px) 92vw, 640px" />
              <span className="project-card-meta">{project.category.map((item) => categoryLabels[item]).join(", ")}</span>
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
            </Link>
            <ul className="chips" aria-label="Технологии">{project.stack.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
          </motion.article>)}
      </AnimatePresence>
    </div>
  </>;
}
