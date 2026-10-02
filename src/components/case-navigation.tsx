"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { GlassLayer } from "@/components/glass-layer";

type Section = { id: string; label: string };
export function CaseNavigation({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0].id);
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  const linksRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const links = linksRef.current;
    const item = links?.querySelector<HTMLElement>('[aria-current="location"]');
    if (links && item) links.scrollTo({ left: item.offsetLeft - (links.clientWidth - item.offsetWidth) / 2, behavior: reduced ? "instant" : "smooth" });
  }, [active, reduced]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      let current = sections[0].id;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= 180) current = section.id;
      }
      setActive(current);
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, [sections]);
  return <nav className="case-navigation liquid-surface" aria-label="Разделы кейса">
    <GlassLayer />
    <div className="case-nav-links" ref={linksRef}>{sections.map(({ id, label }) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
      {active === id && <motion.i layoutId="case-nav-selection" transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} />}
      <span>{label}</span>
    </a>)}</div>
    <span className="case-reading-track" aria-hidden="true"><motion.i style={{ scaleX: scrollYProgress }} /></span>
  </nav>;
}
