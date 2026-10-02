import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("appearance controls update every glass, persist and respect accessibility", async ({ page }) => {
  await page.goto("/resume");
  const settings = page.getByRole("button", { name: "Внешний вид", exact: true });
  await settings.click();
  const dialog = page.getByRole("dialog", { name: "Внешний вид", exact: true });
  const slider = dialog.getByRole("slider", { name: "Liquid Glass" });
  await slider.fill("85");
  await expect.poll(() => page.locator(".redesign-dock .glass-layer").evaluate(el => getComputedStyle(el).backgroundColor)).toContain("0.74");
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
