import { describe, expect, it } from "vitest";
import { filterProjects, getProject, projectCategories, projects } from "./projects";

describe("project catalog", () => {
  it("publishes exactly six unique cases", () => {
    expect(projects).toHaveLength(6);
    expect(new Set(projects.map(({ slug }) => slug)).size).toBe(6);
    expect(new Set(projects.map(({ index }) => index)).size).toBe(6);
  });

  it("keeps every case evidence-driven", () => {
    for (const project of projects) {
      expect(project.stack.length).toBeGreaterThanOrEqual(5);
      expect(project.decisions).toHaveLength(3);
      expect(project.evidence).toHaveLength(3);
      expect(project.limitations.length).toBeGreaterThan(0);
      expect(getProject(project.slug)).toEqual(project);
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
});
