import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = ["", "/projects", "/experience", "/about", "/resume", "/how-built"];
  return [...routes.map((route) => ({ url: `${base}${route}`, changeFrequency: "monthly" as const, priority: route === "" ? 1 : 0.8 })), ...projects.map((project) => ({ url: `${base}/projects/${project.slug}`, changeFrequency: "monthly" as const, priority: 0.7 }))];
}
