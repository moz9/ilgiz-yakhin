"use client";

import { usePathname } from "next/navigation";
import { gsap, MOTION, SplitText, useGSAP } from "@/lib/gsap";

/** Big section headings that rise word by word out of their own lines. */
const HEADINGS = [
  ".work-intro h2",
  ".section-head h2",
  ".case-section-head h2",
  ".page-section-title",
  ".process-head h2",
  ".track h2",
  ".contact h2",
].map((selector) => `main ${selector}`).join(", ");

/**
 * Splits the large headings of the current page into words behind line masks and lets
 * them rise as each heading scrolls into view. Only headings below the first screen are
 * split: the ones already visible on arrival would flash before the animation starts.
 * SplitText keeps the heading's text for screen readers (aria: "auto") and re-splits when
 * fonts load or the width changes. Runs again after every route change.
 */
export function TextReveal() {
  const pathname = usePathname();
  useGSAP(() => {
    if (pathname.startsWith("/demos/")) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>(HEADINGS))
        .filter((heading) => heading.getBoundingClientRect().top > innerHeight * 0.9);
      const splits = headings.map((heading) => SplitText.create(heading, {
        type: "words,lines",
        mask: "lines",
        aria: "auto",
        autoSplit: true,
        onSplit: (self) => gsap.from(self.words, {
          yPercent: 115,
          rotate: 4,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: heading, start: "top 88%", once: true },
        }),
      }));
      return () => splits.forEach((split) => split.revert());
    });
    return () => mm.revert();
  }, { dependencies: [pathname], revertOnUpdate: true });
  return null;
}
