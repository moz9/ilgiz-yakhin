import { expect, test } from "@playwright/test";
import { projects } from "../../src/lib/projects";

test("all case images render when Vercel image delivery fails", async ({ page }) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(/\/(_next\/image|cases\/)/, async (route) => {
    if (new URL(route.request().url()).hostname === "raw.githubusercontent.com") await route.continue();
    else await route.abort("connectionreset");
  });
  for (const project of projects) {
    await page.goto(`/projects/${project.slug}`);
    for (const image of await page.locator("main img:not(dialog img)").all()) {
      await image.scrollIntoViewIfNeeded({ timeout: 5_000 });
      await expect(image).toHaveAttribute("src", /^https:\/\/raw\.githubusercontent\.com\//);
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth), { timeout: 15_000 }).toBeGreaterThan(0);
    }
  }
});

test("the chapter picker scrolls straight to the chosen case", async ({ page, isMobile }) => {
  test.skip(isMobile, "On a phone the cases are a plain vertical list");
  await page.goto("/");
  await page.locator("#work").scrollIntoViewIfNeeded();
  const picker = page.getByRole("tablist", { name: "Быстрый переход к проекту" });
  await picker.getByRole("tab", { name: "Учёт ИТ" }).click();
  await expect.poll(() => picker.getByRole("tab", { name: "Учёт ИТ" }).getAttribute("aria-selected"), { timeout: 8_000 }).toBe("true");
  // The page scrolls smoothly: wait for the chosen chapter to be pinned and opened up.
  const chapter = page.locator(".chapter").nth(3);
  await expect.poll(async () => (await chapter.boundingBox())?.y ?? Infinity, { timeout: 8_000 }).toBeLessThanOrEqual(0);
  await expect(chapter.getByRole("heading", { level: 3 })).toBeInViewport();
});

test("scenarios switch products and steps with real screenshots", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const scenes = page.locator(".scenes");
  await scenes.scrollIntoViewIfNeeded();
  await expect(scenes.getByRole("heading", { name: "От выгрузки до готового Excel" })).toBeVisible();
  await scenes.getByRole("tab", { name: "База знаний" }).click();
  await expect(scenes.getByRole("heading", { name: "Библиотека и связанные материалы" })).toBeVisible();
  await scenes.getByRole("tab", { name: /Гайд/ }).click();
  await expect(scenes.getByRole("tab", { name: /Гайд/ })).toHaveAttribute("aria-selected", "true");
  const front = scenes.locator(".scenes-card:not([aria-hidden='true']) img");
  await expect.poll(() => front.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await scenes.getByRole("button", { name: "Следующий этап" }).click();
  await expect(scenes.getByRole("tab", { name: /Телефон/ })).toHaveAttribute("aria-selected", "true");
});

test("the list of other cases links every case and the footer reaches all sections", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator(".more-row");
  await expect(rows).toHaveCount(8);
  for (const row of await rows.all()) await expect(row).toHaveAttribute("href", /^\/projects\/[a-z-]+$/);
  const footer = page.locator(".site-footer");
  await expect(footer.getByRole("link", { name: "im@angelius.ru" })).toHaveAttribute("href", "mailto:im@angelius.ru");
  await footer.getByRole("link", { name: "Как устроен сайт" }).click();
  await expect(page).toHaveURL(/\/how-built$/);
  await expect(page.getByRole("heading", { name: "Как устроен этот сайт" })).toBeVisible();
});

test("gallery supports full-size viewing, keyboard navigation and focus restoration", async ({ page }) => {
  await page.goto("/projects/revalib");
  const first = page.getByRole("button", { name: "Рассмотреть: 01 / БИБЛИОТЕКА И ГАЙД" });
  await first.click();
  const dialog = page.getByRole("dialog", { name: "Просмотр интерфейса" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator("img")).toHaveAttribute("src", "https://raw.githubusercontent.com/moz9/ilgiz-yakhin/main/public/cases/revalib-update.webp");
  await dialog.getByRole("button", { name: "Увеличить изображение" }).click();
  await expect(dialog.locator(".lightbox-image")).toHaveClass(/is-zoomed/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(first).toBeFocused();
});

test("anonymous case and historical links do not expose the original brand", async ({ page, request }) => {
  await page.goto("/projects/lunafantasy");
  await expect(page).toHaveURL(/\/projects\/content-platform$/);
  await expect(page.getByRole("heading", { name: "Контентная платформа", exact: true })).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/luna.?fantasy/i);
  await expect(page.locator(".gallery figure")).toHaveCount(2);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/projects\/content-platform$/);
  expect((await request.get("/cases/lunafantasy.webp")).status()).toBe(404);
  expect((await request.get("/og.jpg")).url()).toMatch(/\/og-v2\.jpg$/);
});

test("stages keep decoded images with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/projects", "/projects/content-platform", "/projects/chessrise"]) {
    await page.goto(route);
    // Home shows its cases as chapters; the other pages as lit stages.
    const stage = page.locator(route === "/" ? ".chapter-stack" : ".stage").first();
    await stage.scrollIntoViewIfNeeded();
    const image = stage.locator(route === "/" ? ".chapter-layer-main img" : ".stage-screen img");
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
