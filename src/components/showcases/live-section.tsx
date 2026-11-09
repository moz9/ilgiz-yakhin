import Link from "next/link";
import { Maximize2 } from "lucide-react";
import type { Project } from "@/lib/projects";
import { ShowcaseHost } from "@/components/showcases/registry";

/** The live demo of a case, right on its page, with a way to open it on the whole screen. */
export function LiveSection({ project }: { project: Project }) {
  if (!project.live) return null;
  return <section id="live" className="case-section live" aria-labelledby="live-title">
    <div className="case-section-head">
      <h2 id="live-title">{project.live.title}</h2>
      <p>{project.live.text}</p>
    </div>
    <div className="live-stage">
      <ShowcaseHost slug={project.slug} mode="embed" />
    </div>
    <Link className="text-link live-full" href={`/demos/lab/${project.slug}`}>Открыть на весь экран <Maximize2 aria-hidden="true" /></Link>
  </section>;
}
