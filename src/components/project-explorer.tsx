"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { filterProjects, projectCategories, projects } from "@/lib/projects";

export function ProjectExplorer() {
  const [category, setCategory] = useState<(typeof projectCategories)[number]>("Все");
  const visible = filterProjects(category);

  return (
    <>
      <div className="filter-bar" role="group" aria-label="Фильтр проектов">
        {projectCategories.map((item) => (
          <button key={item} type="button" className={category === item ? "is-active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>
            {item}
            <span>{item === "Все" ? projects.length : filterProjects(item).length}</span>
          </button>
        ))}
      </div>
      <div className="project-list" aria-live="polite">
        {visible.map((project) => (
          <article className={`project-row accent-${project.accent}`} key={project.slug}>
            <div className="project-index">{project.index}</div>
            <div className="project-main">
              <div className="project-meta"><span>{project.shortTitle}</span><span>{project.status}</span></div>
              <h2><Link href={`/projects/${project.slug}`}>{project.title}</Link></h2>
              <p>{project.summary}</p>
              <ul className="tag-list" aria-label="Технологии">{project.stack.slice(0, 6).map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <Link className="project-arrow" href={`/projects/${project.slug}`} aria-label={`Открыть кейс ${project.title}`}><ArrowUpRight aria-hidden="true" /></Link>
          </article>
        ))}
      </div>
    </>
  );
}
