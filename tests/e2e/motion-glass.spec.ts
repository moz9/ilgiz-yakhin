import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("appearance controls update every glass, persist and respect accessibility", async ({ page }) => {
  await page.goto("/resume");
  const settings = page.getByRole("button", { name: "Внешний вид", exact: true });
  await settings.click();
  const dialog = page.getByRole("dialog", { name: "Внешний вид", exact: true });
  const slider = dialog.getByRole("slider", { name: "Liquid Glass" });
  await slider.fill("85");
  // Calibrated density curve: tint = .18 + density/100 * .67, blur = 3px + density/100 * 12px.
  await expect.poll(() => page.locator(".redesign-dock .glass-layer").evaluate(el => getComputedStyle(el).backgroundColor)).toContain("0.75");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("portfolio-appearance") || "{}").density)).toBe(85);
  await page.reload();
  await settings.click();
  await expect(slider).toHaveValue("85");
  await dialog.getByRole("checkbox", { name: "Уменьшить прозрачность" }).check();
  await expect(slider).toBeDisabled();
  const material = page.locator(".redesign-dock .glass-layer");
  await expect(material).toHaveCSS("backdrop-filter", "none");
  await expect(material).toHaveCSS("background-color", "rgb(32, 40, 51)");
  await dialog.getByRole("button", { name: "По умолчанию" }).click();
  await expect(slider).toBeEnabled();
  await expect(slider).toHaveValue("12");
  await page.emulateMedia({ forcedColors: "active" });
  await expect(slider).toBeDisabled();
  await expect(material).toHaveCSS("backdrop-filter", "none");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("case navigation tracks sections, and motion keeps a real screenshot active", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/chessrise");
  const nav = page.getByRole("navigation", { name: "Разделы кейса" });
  await nav.getByRole("link", { name: "Решения", exact: true }).click();
  await expect(page).toHaveURL(/#decisions$/);
  await expect(nav.getByRole("link", { name: "Решения", exact: true })).toHaveAttribute("aria-current", "location");
  await page.goto("/");
  const bench = page.locator(".workbench");
  await bench.getByRole("button", { name: "Следующий этап" }).click();
  await expect(bench.locator(".workbench-frame")).toHaveCount(1);
  await expect(bench.locator(".workbench-frame")).toHaveAttribute("aria-hidden", "false");
  await expect(bench.locator(".scenario-peek").first()).toHaveCSS("opacity", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("Chromium actually refracts the backdrop independently of blur", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/resume");
  await page.getByRole("button", { name: "Внешний вид", exact: true }).click();
  const layer = page.locator(".glass-preview-control .glass-layer");
  await expect(layer).toHaveAttribute("data-optics", "refraction");
  await expect(page.locator(".redesign-dock")).toHaveCSS("backdrop-filter", "none");
  const preview = page.locator(".glass-preview");
  const on = await preview.screenshot();
  await layer.evaluate(el => el.style.setProperty("--glass-refraction", ""));
  const off = await preview.screenshot();
  await layer.evaluate(el => el.style.setProperty("--glass-blur", "0px"));
  const clear = await preview.screenshot();
  const changed = async (a: Buffer, b: Buffer) => {
    const aa = await sharp(a).removeAlpha().raw().toBuffer();
    const bb = await sharp(b).removeAlpha().raw().toBuffer();
    return aa.reduce((count, value, index) => count + (Math.abs(value - bb[index]) > 8 ? 1 : 0), 0);
  };
  expect(await changed(on, off)).toBeGreaterThan(1000);
  expect(await changed(off, clear)).toBeGreaterThan(1000);
});

test("the lens bends the backdrop at the rim and leaves the centre calm", async ({ page }, testInfo) => {
  // The preview sample is a pill a few hundred pixels wide; on a phone it is too narrow
  // to carry a measurable pattern, so the optics proof runs on the desktop viewport.
  test.skip(testInfo.project.name === "mobile", "the lens sample is too narrow to measure on a phone");
  const period = 48;
  await page.goto("/");
  await page.getByRole("button", { name: "Внешний вид", exact: true }).click();
  // A coarse pattern survives the blur, so its phase can be measured.
  await page.evaluate(() => {
    const preview = document.querySelector(".glass-preview") as HTMLElement;
    preview.style.background = "repeating-linear-gradient(90deg,#ffffff 0 24px,#0d0d0d 24px 48px)";
    preview.querySelectorAll(".glass-preview-lines").forEach(node => node.remove());
  });
  await page.waitForTimeout(400);

  const control = await page.locator(".glass-preview-control").boundingBox();
  const clip = { x: Math.round(control!.x), y: Math.round(control!.y), width: Math.round(control!.width), height: Math.round(control!.height) };

  const columns = async () => {
    const buffer = await page.screenshot({ clip });
    const { data, info } = await sharp(buffer).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
    const out: number[] = [];
    for (let x = 0; x < info.width; x += 1) {
      let sum = 0;
      for (let y = 0; y < info.height; y += 1) sum += data[y * info.width + x];
      out.push(sum / info.height);
    }
    return out;
  };

  /** Phase of the pattern inside one column window, in pixels. */
  const phaseOf = (values: number[], from: number, to: number) => {
    const slice = values.slice(from, to);
    const mean = slice.reduce((sum, value) => sum + value, 0) / slice.length;
    let best = 0, bestScore = -Infinity;
    for (let shift = 0; shift < period; shift += 0.5) {
      let score = 0;
      for (let index = 0; index < slice.length; index += 1) score += (slice[index] - mean) * Math.cos((2 * Math.PI * (index + shift)) / period);
      if (score > bestScore) { bestScore = score; best = shift; }
    }
    return best;
  };

  const on = await columns();
  await page.locator(".glass-preview-control .glass-layer").evaluate(el => el.style.setProperty("--glass-refraction", "none"));
  await page.waitForTimeout(400);
  const off = await columns();

  const window = 28;
  const profile: { x: number; change: number }[] = [];
  for (let from = 2; from + window < on.length - 2; from += 8) {
    let change = phaseOf(on, from, from + window) - phaseOf(off, from, from + window);
    while (change > period / 2) change -= period;
    while (change < -period / 2) change += period;
    profile.push({ x: from, change });
  }
  const magnitude = (list: { change: number }[]) => list.reduce((sum, item) => sum + Math.abs(item.change), 0) / list.length;
  const rim = magnitude(profile.slice(0, 3).concat(profile.slice(-3)));
  const middle = magnitude(profile.slice(Math.floor(profile.length / 2) - 2, Math.floor(profile.length / 2) + 3));

  // The rim bends the pattern, the middle keeps it: that is what separates a lens from a blur.
  expect(rim).toBeGreaterThan(middle * 2);
  expect(rim).toBeGreaterThan(0.8);
});

test("the material samples live content and survives a system accessibility switch", async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await page.goto("/");
  await page.waitForTimeout(900);

  // The glass must read the content that is under it right now, not a frozen frame.
  const dock = await page.locator(".redesign-dock").boundingBox();
  const clip = { x: Math.round(dock!.x), y: Math.round(dock!.y), width: Math.round(dock!.width), height: Math.round(dock!.height) };
  const before = await page.screenshot({ clip });
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(700);
  const after = await page.screenshot({ clip });
  const a = await sharp(before).removeAlpha().raw().toBuffer();
  const b = await sharp(after).removeAlpha().raw().toBuffer();
  const moved = a.reduce((count, value, index) => count + (Math.abs(value - b[index]) > 8 ? 1 : 0), 0);
  expect(moved).toBeGreaterThan(500);

  // A user choice must survive the system accessibility switch, and the system must win while it is on.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Внешний вид", exact: true }).click();
  await page.getByRole("slider", { name: "Liquid Glass" }).fill("85");
  await page.waitForTimeout(300);
  await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "reduce" }] });
  await page.waitForTimeout(400);
  const opaque = await page.locator(".redesign-dock .glass-layer").evaluate(el => {
    const style = getComputedStyle(el);
    const alpha = style.backgroundColor.match(/rgba?\(([^)]+)\)/)?.[1].split(/[,\s/]+/).filter(Boolean).map(Number)[3];
    return { alpha: alpha ?? 1, backdrop: style.backdropFilter || (style as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter || "none" };
  });
  expect(opaque.alpha).toBe(1);
  expect(opaque.backdrop).toBe("none");

  await client.send("Emulation.setEmulatedMedia", { features: [] });
  await page.waitForTimeout(400);
  const restored = await page.locator(".redesign-dock .glass-layer").evaluate(el => getComputedStyle(el).backgroundColor);
  expect(restored).toContain("0.75");
});

test("the opaque mode reaches every glass surface, not only the dock", async ({ page }) => {
  await page.goto("/projects/launcher");
  await page.getByRole("button", { name: "Внешний вид", exact: true }).click();
  await page.locator('.transparency-setting input[type="checkbox"]').check();
  await page.waitForTimeout(400);
  const layers = await page.evaluate(() => Array.from(document.querySelectorAll(".glass-layer")).map(layer => {
    const style = getComputedStyle(layer);
    const parts = style.backgroundColor.match(/rgba?\(([^)]+)\)/)?.[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { alpha: parts?.[3] ?? 1, backdrop: style.backdropFilter || (style as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter || "none" };
  }));
  expect(layers.length).toBeGreaterThan(1);
  for (const layer of layers) {
    expect(layer.alpha).toBe(1);
    expect(layer.backdrop).toBe("none");
  }
});

test("the settings dialog keeps the focus inside", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Внешний вид", exact: true }).click();
  await page.waitForTimeout(400);
  for (let step = 0; step < 8; step += 1) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => {
      const panel = document.querySelector("#appearance-settings");
      return panel?.contains(document.activeElement) ?? false;
    });
    expect(inside).toBe(true);
  }
});

test("the hero lens moves without shifting the layout", async ({ page }) => {
  await page.addInitScript(() => {
    const store = window as unknown as { __shifts: number[] };
    store.__shifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number }>) {
        if (!entry.hadRecentInput) store.__shifts.push(entry.value);
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/");
  await page.waitForTimeout(2500);
  const shifts = await page.evaluate(() => (window as unknown as { __shifts: number[] }).__shifts);
  const total = shifts.reduce((sum, value) => sum + value, 0);
  // The lens glides over the wall: it must move by transform, not by left and top.
  expect(total).toBeLessThan(0.02);
});

test("the webfont landing does not shift the headline", async ({ page }) => {
  // With reduced motion the page transition does not run, so a font swap cannot hide behind it.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const store = window as unknown as { __shifts: number[] };
    store.__shifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number }>) {
        if (!entry.hadRecentInput) store.__shifts.push(entry.value);
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/");
  await page.waitForTimeout(3000);
  const shifts = await page.evaluate(() => (window as unknown as { __shifts: number[] }).__shifts);
  const total = shifts.reduce((sum, value) => sum + value, 0);
  // The metric compatible fallbacks keep the headline in place while the webfont arrives.
  expect(total).toBeLessThan(0.01);
});
