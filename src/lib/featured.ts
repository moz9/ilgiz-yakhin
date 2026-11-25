import { projects, type Project } from "@/lib/projects";

export const featuredSlugs = ["pcstudio", "chess-platform", "infrastructure-inventory", "document-factory", "podpisoon", "routerdesk", "liquid-glass-kit", "glassrates", "globe-routes", "gradient-studio", "chessrise", "worktime-reporting"];
export const featured = featuredSlugs.map((slug) => projects.find((project) => project.slug === slug)).filter((project): project is Project => Boolean(project));
export const otherProjects = projects.filter((project) => !featuredSlugs.includes(project.slug));
