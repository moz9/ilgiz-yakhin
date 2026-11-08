"use client";

import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const media = matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/**
 * Reduced motion that hydrates cleanly: the server and the first client render both
 * assume motion, then the real preference applies. Reading matchMedia during the first
 * render makes the client markup differ from the server's.
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches, () => false);
}
