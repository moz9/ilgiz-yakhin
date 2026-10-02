import { expect, test } from "@playwright/test";

test("real scenario showcase switches projects and steps", async ({ page }) => {
  await page.goto("/");
  const showcase = page.locator(".workbench");
  await showcase.scrollIntoViewIfNeeded();
  await showcase.getByRole("button", { name: "02 Проверка", exact: true }).click();
  await expect(showcase.locator(".workbench-frame img")).toHaveAttribute("alt", /Таблица проверки/);
  await showcase.getByRole("button", { name: "База знаний", exact: true }).click();
  await showcase.getByRole("button", { name: /03.*Телефон/ }).click();
  await expect(showcase.locator(".workbench-frame")).toHaveClass(/is-phone/);
  await expect(showcase.getByRole("link", { name: "Весь кейс" })).toHaveAttribute("href", "/projects/revalib");
  await showcase.getByRole("button", { name: "Стриминг", exact: true }).click();
  await showcase.getByRole("button", { name: /03.*AI-подбор/ }).click();
  await expect(showcase.locator(".workbench-frame img")).toHaveAttribute("alt", /AI-подбора/);
});

test("secondary case previews follow keyboard focus without following the cursor", async ({ page, isMobile }) => {
  test.skip(isMobile, "The mobile catalog uses direct links instead of hover previews");
  await page.goto("/");
  const section = page.locator(".redesign-other");
  await section.getByRole("link", { name: /Android-приложение/ }).focus();
  await expect(section.locator(".other-preview-stage .project-stage")).toHaveAttribute("data-project", "streaming-android-tv");
  await expect(section.getByRole("link", { name: /Android-приложение/ })).toHaveAttribute("href", "/projects/streaming-android-tv");
});

test("gallery supports full-size viewing, keyboard navigation and focus restoration", async ({ page }) => {
  await page.goto("/projects/worktime-reporting");
  const first = page.getByRole("button", { name: "Рассмотреть: 01 / IMPORT" });
  await first.click();
  const dialog = page.getByRole("dialog", { name: "Просмотр интерфейса" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator("img")).toHaveAttribute("src", "/cases/worktime.webp");
  await dialog.getByRole("button", { name: "Увеличить изображение" }).click();
  await expect(dialog.locator(".lightbox-image")).toHaveClass(/is-zoomed/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(first).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("anonymous case and historical links do not expose the original brand", async ({ page, request }) => {
  await page.goto("/projects/lunafantasy");
  await expect(page).toHaveURL(/\/projects\/content-platform$/);
  await expect(page.getByRole("heading", { name: "Контентная платформа", exact: true })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/luna.?fantasy/i);
  await expect(page.locator(".redesign-case-gallery figure")).toHaveCount(3);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/projects\/content-platform$/);
  expect((await request.get("/cases/lunafantasy.webp")).status()).toBe(404);
  expect((await request.get("/og.jpg")).url()).toMatch(/\/og-v2\.jpg$/);
});

test("new layouts preserve images and work with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/projects", "/projects/content-platform", "/projects/chessrise"]) {
    await page.goto(route);
    await page.locator(".project-stage").first().scrollIntoViewIfNeeded();
    const stageImage = page.locator(".stage-main-device img").first();
    await expect(stageImage).toBeVisible();
    await expect(stageImage).toHaveJSProperty("complete", true);
    expect(await stageImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
