"use client";

import { useEffect, useRef, useState } from "react";
import { useGlassTabs } from "@/components/glass/glass-runtime";

type Section = { id: string; label: string };

/** Sticky glass contents for a long page: the lens follows the section being read. */
export function CaseNavigation({ sections, label = "Разделы кейса" }: { sections: Section[]; label?: string }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  useGlassTabs(tabs, active, (index) => {
    const target = document.getElementById(sections[index].id);
    target?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      let current = 0;
      sections.forEach((section, index) => {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= 200) current = index;
      });
      setActive(current);
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.current?.style.setProperty("--read", String(max > 0 ? scrollY / max : 0));
      const link = tabs.current?.children[current] as HTMLElement | undefined;
      const row = tabs.current;
      if (row && link && row.scrollWidth > row.clientWidth) row.scrollTo({ left: link.offsetLeft - (row.clientWidth - link.offsetWidth) / 2 });
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { cancelAnimationFrame(frame); removeEventListener("scroll", onScroll); };
  }, [sections]);

  return <nav className="case-nav" data-lg="surface" aria-label={label}>
    <div className="case-nav-tabs" ref={tabs}>
      {sections.map(({ id, label: title }, index) =>
        <a key={id} href={`#${id}`} aria-current={active === index ? "location" : undefined} onClick={(event) => event.preventDefault()}>{title}</a>)}
    </div>
    <span className="case-nav-progress" ref={progress} aria-hidden="true"><i /></span>
  </nav>;
}
