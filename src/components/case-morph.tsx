import { ViewTransition, type ReactNode } from "react";

/**
 * Marks the screen that stands for a case. Every page that shows a case's screen
 * (a home chapter, a catalogue card, the "next case" card, the case cover) wraps it
 * in the same name, so opening a case morphs that very screen into the cover instead
 * of swapping pages. Only one element per case is named on any page.
 */
export function CaseMorph({ slug, children }: { slug: string; children: ReactNode }) {
  return <ViewTransition name={`case-${slug}`} share="case-morph" default="none">{children}</ViewTransition>;
}
