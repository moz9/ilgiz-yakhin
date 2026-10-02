import { existsSync } from "node:fs";
import path from "node:path";
import { getImageProps } from "next/image";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { filterProjects, getProject, projectCategories, projects } from "./projects";

describe("project catalog", () => {
  it("delivers case images without depending on the Vercel image endpoint", () => {
    for (const project of projects) {
      for (const src of [project.cover, ...(project.media ?? []).map((media) => media.src)]) {
        expect(src).toMatch(/^https:\/\/raw\.githubusercontent\.com\/moz9\/ilgiz-yakhin\/main\/public\/cases\//);
        const { props } = getImageProps({ src, alt: "Case", width: 1440, height: 900, unoptimized: nextConfig.images?.unoptimized });
        expect(props.src).toBe(src);
        expect(props.srcSet).toBeUndefined();
      }
    }
  });

  it("publishes thirteen unique cases", () => {
    expect(projects).toHaveLength(13);
    expect(new Set(projects.map(({ slug }) => slug)).size).toBe(13);
    expect(new Set(projects.map(({ index }) => index)).size).toBe(13);
  });

  it("puts neutral commercial cases first and sensitive content last", () => {
    expect(projects.map(({ slug }) => slug)).toEqual([
      "chessrise",
      "pioner",
      "streaming-web-platform",
      "streaming-android-tv",
      "worktime-reporting",
      "visitor-flow-reporting",
      "launcher",
      "infrastructure-inventory",
      "atlant-business-site",
      "revalib",
      "backup-lifecycle-automation",
      "ilgiz-portfolio",
      "content-platform",
    ]);
  });

  it("keeps every case evidence-driven", () => {
    for (const project of projects) {
      expect(project.stack.length).toBeGreaterThanOrEqual(5);
      expect(project.decisions).toHaveLength(3);
      expect(project.evidence.length).toBeGreaterThanOrEqual(3);
      expect(project.limitations.length).toBeGreaterThan(0);
      expect(project.cover).toMatch(/\/cases\/.+\.(webp|svg)$/);
      expect(existsSync(path.resolve("public/cases", path.basename(new URL(project.cover).pathname)))).toBe(true);
      expect(project.coverAlt.length).toBeGreaterThan(12);
      expect(getProject(project.slug)).toEqual(project);
      expect(project.capabilities?.length).toBeGreaterThanOrEqual(4);
      expect(project.capabilities?.every(({ items }) => items.length >= 3)).toBe(true);
      if (project.slug === "launcher") {
        expect(project.media).toEqual([]);
        expect(project.links).toBeUndefined();
        expect(project.stack).toContain("WinUI 3");
        expect(project.stack.join(" ")).not.toMatch(/Tauri|Rust|Vite/i);
      } else {
        expect(project.media?.length).toBeGreaterThanOrEqual(1);
      }
      for (const media of project.media ?? []) {
        expect(media.src).toMatch(/\/cases\/.+\.webp$/);
        expect(existsSync(path.resolve("public/cases", path.basename(new URL(media.src).pathname)))).toBe(true);
        expect(media.alt.length).toBeGreaterThan(20);
        expect(media.caption.length).toBeGreaterThan(30);
      }
    }
  });

  it("filters every public category", () => {
    for (const category of projectCategories) {
      expect(filterProjects(category).length).toBeGreaterThan(0);
    }
    expect(filterProjects("Все")).toEqual(projects);
  });

  it("does not expose links for private internal tools", () => {
    expect(projects.filter(({ access }) => access === "private").every(({ links }) => !links)).toBe(true);
  });

  it("keeps streaming demos free from source brands and private infrastructure", () => {
    const publicDemoCases = projects.filter(({ slug }) => slug.startsWith("streaming-"));
    expect(publicDemoCases).toHaveLength(2);
    expect(JSON.stringify(publicDemoCases)).not.toMatch(/animego|shikimori|kodik|anixart|dorama|192\.168|\.vc|\.biz/i);
  });

  it("anonymizes the content platform and removes the unsafe public images", () => {
    const project = getProject("content-platform")!;
    expect(project.title).toBe("Контентная платформа");
    expect(project.media).toHaveLength(3);
    expect(JSON.stringify(projects)).not.toMatch(/luna.?fantasy/i);
    expect(existsSync("public/cases/lunafantasy.webp")).toBe(false);
    expect(existsSync("public/og.jpg")).toBe(false);
  });
});
