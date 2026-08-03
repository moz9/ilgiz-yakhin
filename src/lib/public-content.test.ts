import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const target = path.join(directory, entry);
    return statSync(target).isDirectory() ? sourceFiles(target) : /\.(ts|tsx|md|mdx)$/.test(entry) && !entry.includes(".test.") ? [target] : [];
  });
}

describe("public content boundary", () => {
  const content = sourceFiles(path.resolve("src")).map((file) => readFileSync(file, "utf8")).join("\n");

  it("contains no internal IPv4 addresses", () => {
    const privateIp = /\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3})\b/g;
    expect(content.match(privateIp)).toBeNull();
  });

  it("contains no forbidden private project terms", () => {
    const forbidden = ["animego", "podkop", "ax3000t", "xray/3x-ui", "service_user"];
    for (const term of forbidden) expect(content.toLowerCase()).not.toContain(term);
  });
});
