import { projects, type Project } from "@/lib/projects";

export const featuredSlugs = ["pcstudio", "document-factory", "liquid-glass-kit", "glassrates", "globe-routes", "gradient-studio", "chessrise", "pioner", "worktime-reporting", "gravity-tags"];
export const featured = featuredSlugs.map((slug) => projects.find((project) => project.slug === slug)).filter((project): project is Project => Boolean(project));
export const otherProjects = projects.filter((project) => !featuredSlugs.includes(project.slug));
