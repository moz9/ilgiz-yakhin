import Image from "next/image";
import type { Project } from "@/lib/projects";
import { caseHueStyle } from "@/lib/case-hues";

type Props = { project: Project; priority?: boolean; compact?: boolean; sizes?: string };

/**
 * A lit stage for one case: the product's own colours glow behind a framed screen,
 * and a phone joins it when the product has a mobile view.
 */
export function ProjectStage({ project, priority = false, compact = false, sizes }: Props) {
  const phone = project.media?.flatMap((item) => [
    ...(item.presentation === "phone" ? [{ src: item.src, alt: item.alt }] : []),
    ...(item.frames ?? []).filter((frame) => typeof frame !== "string" && frame.presentation === "phone") as { src: string; alt: string }[],
  ])[0];
  const desktop = project.category.includes("Desktop") && !project.category.includes("Web");

  return <div className={`stage${compact ? " stage-compact" : ""}${phone ? " has-phone" : ""}`} style={caseHueStyle(project.slug)} data-project={project.slug}>
    <span className="stage-light" aria-hidden="true" />
    <div className={`stage-screen${desktop ? " is-app" : ""}`}>
      <span className="stage-chrome" aria-hidden="true"><i /><i /><i /></span>
      <Image src={project.cover} alt={project.coverAlt} width={1440} height={900} priority={priority} sizes={sizes ?? (compact ? "(max-width: 760px) 92vw, 760px" : "(max-width: 900px) 94vw, 1200px")} />
    </div>
    {phone && <div className="stage-phone"><Image src={phone.src} alt={phone.alt} width={390} height={844} sizes="(max-width: 760px) 26vw, 220px" /></div>}
  </div>;
}
