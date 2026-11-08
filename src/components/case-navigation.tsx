"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGlassTabs } from "@/components/glass/glass-runtime";

type Section = { id: string; label: string };

/** Top of an element in the page, ignoring transforms (reveal animations shift the box). */
function pageTop(element: HTMLElement) {
  let y = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) y += node.offsetTop;
  return y;
}

/**
 * Sticky glass contents for a long page: the lens follows the section being read.
 *
 * A click scrolls to the section and holds the choice until that scroll has finished:
 * the sections it passes on the way do not take the selection, and a section that cannot
 * reach the top (the last ones on the page) stays selected instead of its neighbour.
 */
export function CaseNavigation({ sections, label = "Разделы кейса" }: { sections: Section[]; label?: string }) {
  const [active, setActive] = useState(0);
  const nav = useRef<HTMLElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const held = useRef<number | null>(null);
  const heldTop = useRef(0);
  const release = useRef(0);

  /** Where a section's top lands: just below the sticky contents bar. */
  const anchorLine = useCallback(() => {
    const bar = nav.current;
    if (!bar) return 120;
    const stickyTop = parseFloat(getComputedStyle(bar).top) || 0;
    return stickyTop + bar.offsetHeight + 24;
  }, []);

  const go = useCallback((index: number) => {
    const target = document.getElementById(sections[index]?.id ?? "");
    if (!target) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const max = document.documentElement.scrollHeight - innerHeight;
    const top = Math.max(0, Math.min(max, pageTop(target) - anchorLine()));
    held.current = index;
    heldTop.current = top;
    setActive(index);
    clearTimeout(release.current);
    if (Math.abs(top - scrollY) < 2) { held.current = null; return; }
    // Released when the scroll stops (scrollend, or no scroll events for a moment).
    release.current = window.setTimeout(() => { held.current = null; }, 1500);
    scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
  }, [sections, anchorLine]);
  useGlassTabs(tabs, active, go);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.current?.style.setProperty("--read", String(max > 0 ? scrollY / max : 0));
      let current = held.current;
      if (current === null) {
        const line = anchorLine() + 40;
        current = 0;
        sections.forEach((section, index) => {
          const element = document.getElementById(section.id);
          if (element && pageTop(element) - scrollY <= line) current = index;
        });
        // At the very bottom the last sections can never reach the line: take the last one in view.
        if (max > 0 && scrollY >= max - 2) {
          sections.forEach((section, index) => {
            const element = document.getElementById(section.id);
            if (element && pageTop(element) - scrollY < innerHeight * 0.6) current = Math.max(current ?? 0, index);
          });
        }
      }
      setActive(current);
      const link = tabs.current?.children[current] as HTMLElement | undefined;
      const row = tabs.current;
      if (row && link && row.scrollWidth > row.clientWidth) row.scrollTo({ left: link.offsetLeft - (row.clientWidth - link.offsetWidth) / 2 });
    };
    const onScroll = () => {
      if (held.current !== null) {
        clearTimeout(release.current);
        release.current = window.setTimeout(() => { held.current = null; }, 400);
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const onEnd = () => { clearTimeout(release.current); held.current = null; };
    // A scrollend left over from an earlier scroll can arrive after the click: only the end
    // of the scroll toward the chosen section releases the hold.
    const onScrollEnd = () => { if (held.current !== null && Math.abs(scrollY - heldTop.current) < 4) onEnd(); };
    // A wheel or touch from the reader cancels the hold at once: they took over the scroll.
    const onTakeOver = () => { if (held.current !== null) onEnd(); };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("scrollend", onScrollEnd);
    addEventListener("wheel", onTakeOver, { passive: true });
    addEventListener("touchstart", onTakeOver, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(release.current);
      removeEventListener("scroll", onScroll);
      removeEventListener("scrollend", onScrollEnd);
      removeEventListener("wheel", onTakeOver);
      removeEventListener("touchstart", onTakeOver);
    };
  }, [sections, anchorLine]);

  return <nav className="case-nav" ref={nav} data-lg="surface" aria-label={label}>
    <div className="case-nav-tabs" ref={tabs}>
      {sections.map(({ id, label: title }, index) =>
        <a key={id} href={`#${id}`} aria-current={active === index ? "location" : undefined} onClick={(event) => event.preventDefault()}>{title}</a>)}
    </div>
    <span className="case-nav-progress" ref={progress} aria-hidden="true"><i /></span>
  </nav>;
}
