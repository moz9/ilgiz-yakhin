"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

/**
 * One place that registers GSAP for the site. Scroll scenes (hero, chapters, skill band)
 * scrub a plain progress value and write CSS variables from it, so CSS keeps owning the
 * transforms and the glass rule (transform only on glass ancestors) still holds.
 */
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
// The phone address bar shows and hides while scrolling; re-measuring on it makes pinned
// scenes jump.
ScrollTrigger.config({ ignoreMobileResize: true });

export const MOTION = "(prefers-reduced-motion: no-preference)";
export const STILL = "(prefers-reduced-motion: reduce)";

/** Smoothing of scroll-scrubbed scenes, in seconds of catch-up. */
export const SCRUB = 0.7;

export { gsap, ScrollTrigger, SplitText, useGSAP };
