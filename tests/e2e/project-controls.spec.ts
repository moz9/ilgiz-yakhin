import { expect, test } from "@playwright/test";

test("original hero keeps its animated wall, lens and calls to action", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.locator(".redesign-wall-tile")).toHaveCount(36);
  await expect(page.locator(".hero-exhibit")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Смотреть проекты", exact: true })).toHaveAttribute("href", "#work");
  await expect(page.locator(".redesign-hero").getByRole("link", { name: "Резюме", exact: true })).toHaveAttribute("href", "/resume");
  await expect(page.locator(".redesign-hero-copy h1 span").nth(1)).toHaveCSS("color", "rgb(255, 178, 63)");
  if (!isMobile) await expect(page.locator(".redesign-lens")).toBeVisible();
  const images = await page.locator(".redesign-wall-base .redesign-wall-tile").evaluateAll(async (tiles) => {
    const sources = [...new Set(tiles.map((tile) => getComputedStyle(tile).backgroundImage.slice(5, -2)))];
    return Promise.all(sources.map(async (src) => { const image = new Image(); image.src = src; await image.decode(); return image.naturalWidth; }));
  });
  expect(images).toHaveLength(4);
  expect(images.every((width) => width > 0)).toBeTruthy();
});

test("featured selector scrolls directly to the chosen project", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mobile shows the complete vertical project list.");
  await page.goto("/");
  await page.locator(".redesign-pin-wrap").evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY, behavior: "instant" }));
  const selector = page.getByRole("group", { name: "Быстрый выбор проекта" });
  await selector.getByRole("button", { name: "RevaLib", exact: true }).click();
  await expect(selector.getByRole("button", { name: "RevaLib", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.locator('.redesign-project-card[href="/projects/revalib"]').evaluate((element) => Math.abs(element.getBoundingClientRect().right - innerWidth))).toBeLessThan(150);
});
