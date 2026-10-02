import Image from "next/image";
import type { Project } from "@/lib/projects";

type Props = { project: Project; priority?: boolean; compact?: boolean };

export function ProjectStage({ project, priority = false, compact = false }: Props) {
  const phone = project.media?.find((item) => item.presentation === "phone");
  const detail = project.media?.find((item) => item.src !== project.cover && item.presentation !== "phone");
  const kind = project.category.includes("Mobile") ? "tv" : project.category.includes("Desktop") ? "desktop" : "web";
  const schematic = project.cover.endsWith(".svg") || project.media?.[0]?.presentation === "diagram";

  return <div className={`project-stage stage-${kind}${compact ? " stage-compact" : ""}${schematic ? " stage-schematic" : ""}`} data-project={project.slug}>
    <div className="stage-grid" aria-hidden="true" />
    <div className="stage-heading" aria-hidden="true"><span>{project.shortTitle}</span><span>{schematic ? "ARCHITECTURE" : kind === "desktop" ? "DESKTOP APPLICATION" : kind === "tv" ? "ANDROID / TV" : "WEB EXPERIENCE"}</span></div>
    <div className={`stage-main-device${phone ? " has-phone" : ""}`}>
      <div className="stage-window-bar" aria-hidden="true"><i /><i /><i /><span>{project.title}</span></div>
      <Image src={project.cover} alt={project.coverAlt} width={1440} height={900} priority={priority} sizes={compact ? "(max-width: 700px) 88vw, 720px" : "(max-width: 900px) 90vw, 1100px"} />
      {kind === "tv" && <span className="stage-tv-foot" aria-hidden="true" />}
    </div>
    {phone ? <div className="stage-phone"><Image src={phone.src} alt={phone.alt} width={390} height={844} sizes="(max-width: 700px) 20vw, 230px" /><span aria-hidden="true" /></div> : detail && !compact && !schematic ?
      <div className="stage-detail"><div className="stage-window-bar" aria-hidden="true"><span>{detail.label}</span></div><Image src={detail.src} alt={detail.alt} width={1440} height={900} sizes="(max-width: 700px) 34vw, 450px" /></div> : null}
    <div className="stage-caption" aria-hidden="true"><span>{project.stack.slice(0, 2).join(" / ")}</span><span>{project.index} / IY</span></div>
  </div>;
}
