"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { projects, type Project } from "@/lib/projects";

const homeOrder = ["chessrise", "pioner", "worktime-reporting", "infrastructure-inventory", "lunafantasy", "revalib"];
const homeProjects = homeOrder.map((slug) => projects.find((project) => project.slug === slug)).filter((project): project is Project => Boolean(project));

const posterWords: Record<string, [string, string]> = {
  pioner: ["PIONER", "WEB"],
  chessrise: ["CHESS", "RISE"],
  "worktime-reporting": ["WORK", "TIME"],
  "infrastructure-inventory": ["SYS", "INVENT"],
  lunafantasy: ["LUNA", "FANTASY"],
  revalib: ["REVA", "LIB"],
};

function CasePoster({ project }: { project: Project }) {
  const words = posterWords[project.slug] ?? [project.title, project.category[0]];

  return (
    <div className={`case-poster case-poster-${project.slug}`}>
      <div className="case-poster-head">
        <span>Case {(homeProjects.indexOf(project) + 1).toString().padStart(2, "0")}</span>
        <span>{project.category.join(" / ")}</span>
      </div>
      <div className="case-poster-grid" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="case-poster-word" aria-hidden="true"><span>{words[0]}</span><span>{words[1]}</span></div>
      <strong>{project.title}</strong>
      <div className="case-poster-stack">{project.stack.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div>
    </div>
  );
}

export function AnimatedProjectList() {
  const [activeSlug, setActiveSlug] = useState(homeProjects[0].slug);
  const reduceMotion = useReducedMotion();
  const activeProject = homeProjects.find((project) => project.slug === activeSlug) ?? homeProjects[0];

  return (
    <section className="project-index-home" id="projects" aria-labelledby="work-title">
      <header className="project-index-heading"><span>01</span><h2 id="work-title">Избранные проекты</h2><span>06</span></header>
      <div className="project-index-layout">
        <div className="project-index-list">
          {homeProjects.map((project, index) => (
            <motion.article
              className={activeSlug === project.slug ? "is-active" : ""}
              key={project.slug}
              onHoverStart={() => setActiveSlug(project.slug)}
              onFocusCapture={() => setActiveSlug(project.slug)}
              onViewportEnter={() => setActiveSlug(project.slug)}
              initial={false}
            >
              <span className="index-number" aria-hidden="true">{(index + 1).toString().padStart(2, "0")}</span>
              <div>
                <p>{project.category.join(" · ")}</p>
                <h3><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3>
              </div>
              <Link className="index-arrow" href={`/projects/${project.slug}`} aria-label={`Открыть кейс ${project.title}`}><ArrowUpRight aria-hidden="true" /></Link>
              <Link className="mobile-case-poster" href={`/projects/${project.slug}`} tabIndex={-1} aria-hidden="true"><CasePoster project={project} /></Link>
            </motion.article>
          ))}
        </div>
        <div className="project-poster-stage" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeProject.slug} initial={reduceMotion ? false : { opacity: 0, x: 28, rotate: 1.2 }} animate={{ opacity: 1, x: 0, rotate: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -20, rotate: -1 }} transition={{ duration: .42, ease: [0.22, 1, 0.36, 1] }}>
              <Link href={`/projects/${activeProject.slug}`} aria-label={`Открыть кейс ${activeProject.title}`}><CasePoster project={activeProject} /></Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <Link className="project-index-all" href="/projects">Все проекты <ArrowUpRight aria-hidden="true" /></Link>
    </section>
  );
}
