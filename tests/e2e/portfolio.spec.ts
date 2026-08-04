import { expect, test } from "@playwright/test";

test("home offers the fast HR path and animated project index", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /ILGIZ YAKHIN/i })).toBeVisible();
  const heroImages = page.locator(".liquid-cover img");
  await expect(heroImages).toHaveCount(4);
  await expect.poll(async () => heroImages.evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator('.cover-fragment-pioner img[src*="pioner-mobile"]')).toBeVisible();
  const menuButton = page.getByRole("button", { name: "Открыть меню" });
  if (await menuButton.isVisible()) await menuButton.click();
  await expect(page.getByRole("link", { name: "Проекты", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Избранные проекты", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "LunaFantasy" })).toBeVisible();
});

test("catalog filters cases and opens a technical breakdown", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Проекты", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Desktop/ }).click();
  await expect(page.getByRole("heading", { name: "Система подготовки отчетности рабочего времени" })).toBeVisible();
  await page.getByRole("link", { name: "Система подготовки отчетности рабочего времени", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ключевые решения" })).toBeVisible();
  await expect(page.getByText("Честные границы")).toBeVisible();
});

test("resume files and email are reachable", async ({ page, request }) => {
  await page.goto("/resume");
  await expect(page.getByRole("heading", { name: "Full-stack / AI-разработчик" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Коммерческая практика" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "PDF-версии" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: /im@angelius.ru/ }).first()).toHaveAttribute("href", "mailto:im@angelius.ru");
  await expect(page.getByRole("link", { name: "Скачать PDF" })).toHaveCount(2);
  for (const file of ["/resume/ilgiz-yakhin-compact.pdf", "/resume/ilgiz-yakhin-extended.pdf"]) {
    const response = await request.get(file);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("application/pdf");
  }
});

test("resume remains complete with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/resume");
  await expect(page.getByRole("main")).toContainText("Казанский государственный энергетический университет");
  await expect(page.locator(".resume-scroll-progress")).toBeHidden();
});

test("pages do not overflow horizontally", async ({ page }) => {
  for (const route of ["/", "/projects", "/projects/revalib", "/about", "/resume", "/how-built"]) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
});
