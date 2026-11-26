#!/usr/bin/env node
// Smoke check of a running portfolio: routes, build assets, fonts, case videos,
// 3D models, API and redirects. Read-only GET/HEAD requests.
//   node deploy/vps/smoke.mjs https://ilgiz-yakhin.vercel.app
//   node deploy/vps/smoke.mjs http://31.77.222.201 --browser   # also load pages in Chromium
// Exit code 1 if any check fails.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const withBrowser = args.includes("--browser");
const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const results = [];
const record = (ok, name, detail = "") => results.push({ ok, name, detail });

async function get(path, init = {}) {
  const started = performance.now();
  const res = await fetch(base + path, { redirect: "manual", ...init, signal: AbortSignal.timeout(30_000) });
  return { res, ms: Math.round(performance.now() - started) };
}

async function check(name, fn) {
  try {
    const detail = await fn();
    record(true, name, detail ?? "");
  } catch (error) {
    record(false, name, error instanceof Error ? error.message : String(error));
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

// Case slugs with live demos, read from the registry so the list never goes stale.
const registry = readFileSync(join(repo, "src/components/showcases/registry.tsx"), "utf8");
const liveSlugs = [...registry.matchAll(/^\s*"?([a-z0-9-]+)"?:\s*dynamic\(/gm)].map((m) => m[1]);
const videos = readdirSync(join(repo, "public/cases")).filter((f) => f.endsWith(".mp4"));
const models = readdirSync(join(repo, "public/cases")).filter((f) => f.endsWith(".glb"));

// 1. Home page, its build assets and fonts.
let homeHtml = "";
await check("GET / (html, compressed)", async () => {
  const { res, ms } = await get("/", { headers: { "accept-encoding": "br, gzip, zstd" } });
  expect(res.status === 200, `status ${res.status}`);
  expect((res.headers.get("content-type") ?? "").includes("text/html"), "not html");
  homeHtml = await res.text();
  expect(/<title>[^<]+<\/title>/.test(homeHtml), "no <title>");
  const enc = res.headers.get("content-encoding");
  return `${ms} ms, ${enc ?? "no content-encoding (fetch may decode)"}`;
});

const assetPaths = [...new Set([...homeHtml.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+)/g)].map((m) => m[1]))];
await check(`build assets referenced by / (${assetPaths.length})`, async () => {
  expect(assetPaths.length > 0, "no /_next/static references in html");
  const bad = [];
  for (const path of assetPaths) {
    const { res } = await get(path, { method: "HEAD" });
    const cache = res.headers.get("cache-control") ?? "";
    if (res.status !== 200) bad.push(`${path} ${res.status}`);
    else if (!cache.includes("immutable")) bad.push(`${path} cache-control "${cache}"`);
  }
  expect(bad.length === 0, bad.slice(0, 5).join("; "));
  return "200, immutable";
});

const fontPaths = [...new Set([...homeHtml.matchAll(/href="(\/fonts\/[^"]+\.woff2)"/g)].map((m) => m[1]))];
await check(`preloaded fonts (${fontPaths.length})`, async () => {
  expect(fontPaths.length > 0, "no font preload in html");
  for (const path of fontPaths) {
    const { res } = await get(path, { method: "HEAD" });
    expect(res.status === 200, `${path} ${res.status}`);
    expect((res.headers.get("content-type") ?? "").includes("font/woff2"), `${path} type ${res.headers.get("content-type")}`);
  }
});

// 2. Every page in the sitemap, re-pointed at the host under test.
let pages = [];
await check("GET /sitemap.xml", async () => {
  const { res } = await get("/sitemap.xml");
  expect(res.status === 200, `status ${res.status}`);
  pages = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(pages.length > 5, `only ${pages.length} urls`);
  return `${pages.length} urls`;
});

const fixedPages = ["/demos/content-platform", "/demos/launcher", "/demos/mobile-tv", ...liveSlugs.map((s) => `/demos/lab/${s}`)];
await check(`pages: sitemap + demos (${pages.length + fixedPages.length})`, async () => {
  const bad = [];
  let slowest = { path: "", ms: 0 };
  for (const path of [...pages, ...fixedPages]) {
    const { res, ms } = await get(path);
    if (ms > slowest.ms) slowest = { path, ms };
    if (res.status !== 200) bad.push(`${path} ${res.status}`);
    else if (!/<title>/.test(await res.text())) bad.push(`${path} no title`);
  }
  expect(bad.length === 0, bad.slice(0, 8).join("; "));
  return `all 200; slowest ${slowest.path} ${slowest.ms} ms`;
});

// 3. Case videos: byte ranges and faststart (moov before mdat).
async function atoms(path) {
  const seen = [];
  let offset = 0;
  for (let i = 0; i < 6; i++) {
    const { res } = await get(path, { headers: { range: `bytes=${offset}-${offset + 15}` } });
    expect(res.status === 206, `${path} range status ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    let size = buf.readUInt32BE(0);
    const type = buf.toString("latin1", 4, 8);
    if (size === 1) size = Number(buf.readBigUInt64BE(8));
    seen.push(type);
    if (type === "moov" || type === "mdat" || size < 8) break;
    offset += size;
  }
  return seen;
}

await check(`case videos (${videos.length}): 206 ranges, video/mp4, faststart`, async () => {
  const bad = [];
  for (const file of videos) {
    const path = `/cases/${file}`;
    const { res } = await get(path, { method: "HEAD" });
    const type = res.headers.get("content-type") ?? "";
    if (res.status !== 200 || !type.includes("video/mp4")) { bad.push(`${file} ${res.status} ${type}`); continue; }
    const order = await atoms(path);
    if (order.at(-1) !== "moov") bad.push(`${file} atoms ${order.join(">")}`);
  }
  expect(bad.length === 0, bad.join("; "));
});

// 4. 3D models for the PCStudio scene.
await check(`3D models (${models.length}): glTF 2 binary`, async () => {
  for (const file of models) {
    const { res } = await get(`/cases/${file}`, { headers: { range: "bytes=0-11" } });
    expect(res.status === 206 || res.status === 200, `${file} status ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.toString("latin1", 0, 4) === "glTF" && buf.readUInt32LE(4) === 2, `${file} is not glTF 2`);
  }
  return models.join(", ");
});

// 5. API, downloads, redirects, 404.
await check("GET /api/rates (json)", async () => {
  const { res } = await get("/api/rates");
  expect(res.status === 200, `status ${res.status}`);
  const body = await res.json();
  expect(body && typeof body === "object", "not json");
  return Object.keys(body).slice(0, 4).join(", ");
});
await check("GET /resume/ilgiz-yakhin-compact.pdf", async () => {
  const { res } = await get("/resume/ilgiz-yakhin-compact.pdf");
  expect(res.status === 200, `status ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  expect(buf.toString("latin1", 0, 5) === "%PDF-", "not a pdf");
  return `${Math.round(buf.length / 1024)} KB`;
});
await check("redirect /og.jpg -> /og-v2.jpg", async () => {
  const { res } = await get("/og.jpg");
  expect([301, 308].includes(res.status), `status ${res.status}`);
  expect((res.headers.get("location") ?? "").endsWith("/og-v2.jpg"), `location ${res.headers.get("location")}`);
});
await check("GET /robots.txt", async () => {
  const { res } = await get("/robots.txt");
  expect(res.status === 200, `status ${res.status}`);
  const line = (await res.text()).split("\n").find((l) => l.startsWith("Sitemap:"));
  const robotsTag = res.headers.get("x-robots-tag");
  return `${line ?? "no Sitemap line"}${robotsTag ? `; x-robots-tag: ${robotsTag}` : ""}`;
});
await check("unknown page -> 404", async () => {
  const { res } = await get("/projects/no-such-case-smoke");
  expect(res.status === 404, `status ${res.status}`);
});

// 6. Optional: real Chromium — page errors, failed requests, WebGL canvas, video playback.
if (withBrowser) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on("pageerror", (e) => problems.push(`pageerror ${e.message.slice(0, 120)}`));
  page.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`${r.status()} ${new URL(r.url()).pathname}`); });

  const visit = async (path, probe, name) =>
    check(`browser ${name ?? path}`, async () => {
      problems.length = 0;
      await page.goto(base + path, { waitUntil: "load", timeout: 60_000 });
      await page.waitForTimeout(2500);
      const detail = probe ? await probe() : "";
      expect(problems.length === 0, problems.slice(0, 4).join("; "));
      return detail;
    });

  await visit("/", async () => `canvas: ${await page.locator("canvas").count()}`);
  await visit("/demos/lab/pcstudio", async () => {
    await page.waitForFunction(() => [...document.querySelectorAll("canvas")].some((c) => c.width > 300), null, { timeout: 30_000 });
    return "WebGL canvas drawn";
  }, "3D: /demos/lab/pcstudio");
  await visit("/demos/lab/globe-routes", async () => {
    await page.waitForFunction(() => [...document.querySelectorAll("canvas")].some((c) => c.width > 300), null, { timeout: 30_000 });
    return "globe canvas drawn";
  }, "3D: /demos/lab/globe-routes");
  await visit("/projects/infrastructure-inventory", async () => {
    const video = page.locator("video").first();
    await video.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const v = document.querySelector("video"); return !!v && v.readyState >= 2; }, null, { timeout: 30_000 });
    return `video ready: ${await video.evaluate((v) => v.currentSrc.split("/").pop())}`;
  }, "video: Sysinvent case");
  await browser.close();
}

// Report.
const width = Math.max(...results.map((r) => r.name.length));
console.log(`\nSmoke check ${base}\n`);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(width)}  ${r.detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
