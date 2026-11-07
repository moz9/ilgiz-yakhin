"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/lib/projects";

// Adapted from Elia Kuratli's MIT-licensed Expandable Card, listed on 21st.dev.
// See THIRD_PARTY_NOTICES.md for the source, license and adaptation details.
function ProjectDisclosure({ project, expanded, onToggle, onPreview, children }: {
  project: Project;
  expanded: boolean;
  onToggle: () => void;
  onPreview: () => void;
  children: ReactNode;
}) {
  const panelId = useId().replace(/:/g, "");
  const trigger = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const transition = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 32 };

  return <article className="archive-project" data-expanded={expanded} onFocus={onPreview} onPointerEnter={(event) => {
    if (event.pointerType === "mouse") onPreview();
  }} onKeyDown={(event) => {
    if (event.key !== "Escape" || !expanded) return;
    event.preventDefault();
    onToggle();
    trigger.current?.focus();
  }}>
    <div className="archive-project-header">
      <button ref={trigger} type="button" className="archive-trigger" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle}>
        <Image className="other-project-thumb" src={project.cover} alt="" width={160} height={100} sizes="80px" />
        <span className="archive-title"><strong>{project.title}</strong><span>{project.category.join(" / ")}</span></span>
        <motion.span className="archive-chevron" initial={false} animate={{ rotate: expanded ? 180 : 0 }} transition={transition}><ChevronDown aria-hidden="true" /></motion.span>
      </button>
      <Link className="archive-case-link" href={`/projects/${project.slug}`} aria-label={`Открыть кейс: ${project.title}`} title={`Открыть кейс: ${project.title}`}><ArrowUpRight aria-hidden="true" /></Link>
    </div>
    <motion.div id={panelId} className="archive-panel" inert={!expanded} initial={false} animate={{ height: expanded ? "auto" : 0 }} transition={transition}>
      <motion.div className="archive-panel-content" initial={false} animate={{ opacity: expanded ? 1 : 0 }} transition={reduced ? { duration: 0 } : { duration: .18 }}>
        {children}
      </motion.div>
    </motion.div>
  </article>;
}

export function ProjectArchive({ projects }: { projects: Project[] }) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(projects[0]?.slug ?? null);
  const [previewSlug, setPreviewSlug] = useState(projects[0]?.slug);
  const reduced = useReducedMotion();
  const preview = projects.find((project) => project.slug === previewSlug) ?? projects[0];
  if (!preview) return null;

  return <div className="redesign-other project-archive">
    <div className="archive-heading"><h3>Другие проекты</h3><span>{String(projects.length).padStart(2, "0")}</span></div>
    <div className="archive-preview">
      <motion.div className="other-preview-stage" key={preview.slug} initial={reduced ? false : { y: 12 }} animate={{ y: 0 }} transition={{ duration: reduced ? 0 : .35, ease: [.22, 1, .36, 1] }}>
        <div className="project-stage archive-shot" data-project={preview.slug}><Image src={preview.cover} alt={preview.coverAlt} width={1440} height={900} sizes="(max-width: 860px) 1px, 46vw" /></div>
      </motion.div>
      <div className="archive-preview-caption"><strong>{preview.shortTitle}</strong><span>{preview.stack.slice(0, 3).join(" · ")}</span></div>
    </div>
    <div className="project-archive-list">
      {projects.map((project) => {
        const expanded = expandedSlug === project.slug;
        return <ProjectDisclosure key={project.slug} project={project} expanded={expanded} onPreview={() => setPreviewSlug(project.slug)} onToggle={() => {
          setExpandedSlug(expanded ? null : project.slug);
          setPreviewSlug(project.slug);
        }}>
          {expanded && <div className="archive-inline-media"><Image src={project.cover} alt={project.coverAlt} width={1440} height={900} sizes="(max-width: 860px) 90vw, 1px" /></div>}
          <p>{project.summary}</p>
          <ul>{project.results.slice(0, 2).map((result) => <li key={result}>{result}</li>)}</ul>
          <span className="archive-stack">{project.stack.slice(0, 4).join(" · ")}</span>
        </ProjectDisclosure>;
      })}
    </div>
  </div>;
}
