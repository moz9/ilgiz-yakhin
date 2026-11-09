"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/** Props every live demo takes: it fills its parent; "full" is the standalone /demos/lab page. */
export type ShowcaseProps = { mode: "embed" | "full" };

const loading = () => <div className="showcase-loading" aria-hidden="true" />;

/**
 * Live demos by case slug. Each loads only on its own pages, never in the home bundle,
 * and only on the client: they draw with WebGL, canvas or a physics engine.
 */
export const showcases: Record<string, ComponentType<ShowcaseProps>> = {
  "gradient-studio": dynamic(() => import("./gradient-studio"), { ssr: false, loading }),
  "gravity-tags": dynamic(() => import("./gravity-tags"), { ssr: false, loading }),
  "globe-routes": dynamic(() => import("./globe-routes"), { ssr: false, loading }),
  "kinetic-type": dynamic(() => import("./kinetic-type"), { ssr: false, loading }),
  "shader-gallery": dynamic(() => import("./shader-gallery"), { ssr: false, loading }),
  "micro-ui": dynamic(() => import("./micro-ui"), { ssr: false, loading }),
  "particle-type": dynamic(() => import("./particle-type"), { ssr: false, loading }),
  "scroll-story": dynamic(() => import("./scroll-story"), { ssr: false, loading }),
};

export function ShowcaseHost({ slug, mode }: { slug: string; mode: ShowcaseProps["mode"] }) {
  const Showcase = showcases[slug];
  return Showcase ? <Showcase mode={mode} /> : null;
}
