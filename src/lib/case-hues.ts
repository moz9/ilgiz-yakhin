import type { CSSProperties } from "react";

/**
 * Each case gets its own light on the stage behind its screens. The colours come from
 * the products themselves, so the page around a case borrows that product's mood.
 */
const hues: Record<string, [string, string]> = {
  chessrise: ["#21c6a4", "#ffd257"],
  pioner: ["#ff6b8b", "#ffb36b"],
  pcstudio: ["#ff8a5c", "#5b7bff"],
  "liquid-glass-kit": ["#5b6cff", "#ff5fa2"],
  glassrates: ["#5b7bff", "#2fd3a0"],
  "gradient-studio": ["#2fd3a0", "#b46bff"],
  "globe-routes": ["#5b7bff", "#2fd3a0"],
  "gravity-tags": ["#ffc23d", "#5b7bff"],
  "kinetic-type": ["#ff2fd1", "#5b7bff"],
  "shader-gallery": ["#ff8a3d", "#5b7bff"],
  "micro-ui": ["#b46bff", "#2fd3a0"],
  "particle-type": ["#5b7bff", "#ff6b8b"],
  "scroll-story": ["#5b7bff", "#2fd3a0"],
  "analytics-dashboard": ["#3987e5", "#199e70"],
  "kanban-board": ["#d55181", "#3987e5"],
  "booking-flow": ["#d9893f", "#b46bff"],
  "drum-machine": ["#ff6b3d", "#b46bff"],
  "worktime-reporting": ["#3ba8ff", "#21c6a4"],
  "visitor-flow-reporting": ["#3ba8ff", "#8a6bff"],
  "infrastructure-inventory": ["#8a6bff", "#3ba8ff"],
  "content-platform": ["#ffc23d", "#ff6b8b"],
  revalib: ["#8a6bff", "#ff6b8b"],
  "streaming-web-platform": ["#ff6b8b", "#8a6bff"],
  "streaming-android-tv": ["#ff4f7b", "#ffc23d"],
  launcher: ["#3ba8ff", "#8a6bff"],
  "atlant-business-site": ["#21c6a4", "#3ba8ff"],
  "backup-lifecycle-automation": ["#21c6a4", "#8a6bff"],
  "ilgiz-portfolio": ["#2f45ff", "#ff6b8b"],
  routerdesk: ["#3ba8ff", "#21c6a4"],
};

export function caseHue(slug: string): [string, string] {
  return hues[slug] ?? ["#3ba8ff", "#8a6bff"];
}

export function caseHueStyle(slug: string) {
  const [a, b] = caseHue(slug);
  return { "--hue-a": a, "--hue-b": b } as CSSProperties;
}
