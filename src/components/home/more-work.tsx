"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { Project } from "@/lib/projects";
import { caseHueStyle } from "@/lib/case-hues";
import { CaseMorph } from "@/components/case-morph";

/**
 * The rest of the catalogue as a quiet list. On a desktop a preview of the case floats
 * after the pointer, so the list stays readable and the screens are one glance away.
 */
export function MoreWork({ projects }: { projects: Project[] }) {
  const list = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.5 });
  const rotate = useSpring(0, { stiffness: 200, damping: 20 });

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    let lastX = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = element.getBoundingClientRect();
      x.set(event.clientX - box.left);
      y.set(event.clientY - box.top);
      rotate.set(Math.max(-8, Math.min(8, (event.clientX - lastX) * 0.6)));
      lastX = event.clientX;
    };
    element.addEventListener("pointermove", onMove);
    return () => element.removeEventListener("pointermove", onMove);
  }, [x, y, rotate]);

  const shown = projects.find((project) => project.slug === hover);

  return <section className="more" aria-labelledby="more-title">
    <div className="section-head">
      <h2 id="more-title">Ещё {projects.length} проектов</h2>
      <p>Desktop-утилиты, Android, автоматизация и инфраструктура: то, что обычно остаётся за кадром, но держит работу.</p>
    </div>
    <div className="more-list" ref={list} onPointerLeave={() => setHover(null)}>
      {projects.map((project) =>
        <Link key={project.slug} className="more-row" href={`/projects/${project.slug}`} style={caseHueStyle(project.slug)}
          onPointerEnter={(event) => { if (event.pointerType === "mouse") setHover(project.slug); }}
          onFocus={() => setHover(null)}>
          <CaseMorph slug={project.slug}><Image className="more-thumb" src={project.cover} alt="" width={240} height={150} sizes="96px" /></CaseMorph>
          <span className="more-title">{project.title}</span>
          <span className="more-kind">{project.category.join(", ")}</span>
          <span className="more-stack">{project.stack.slice(0, 3).join(", ")}</span>
          <ArrowUpRight className="more-arrow" aria-hidden="true" />
        </Link>)}
      {!reduced && <motion.div className="more-preview" aria-hidden="true" style={{ x: sx, y: sy, rotate }} data-visible={Boolean(shown)}>
        {projects.map((project) =>
          <span key={project.slug} className="more-preview-shot" data-active={project.slug === hover} style={caseHueStyle(project.slug)}>
            <Image src={project.cover} alt="" width={720} height={450} sizes="420px" />
          </span>)}
      </motion.div>}
    </div>
  </section>;
}
