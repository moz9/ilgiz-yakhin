import { projects, type Project } from "@/lib/projects";

export const featuredSlugs = ["chessrise", "liquid-glass-kit", "pioner", "worktime-reporting", "infrastructure-inventory", "content-platform", "revalib"];
export const featured = featuredSlugs.map((slug) => projects.find((project) => project.slug === slug)).filter((project): project is Project => Boolean(project));
export const otherProjects = projects.filter((project) => !featuredSlugs.includes(project.slug));
