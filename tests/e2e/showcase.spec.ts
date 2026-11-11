import { expect, test } from "@playwright/test";
import { projects } from "../../src/lib/projects";
import { featured, otherProjects } from "../../src/lib/featured";

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
  await picker.getByRole("tab", { name: "Отчётность" }).click();
  await expect.poll(() => picker.getByRole("tab", { name: "Отчётность" }).getAttribute("aria-selected"), { timeout: 8_000 }).toBe("true");
  // The page scrolls smoothly: wait for the chosen chapter to be pinned and opened up.
  const chapter = page.locator(".chapter").nth(featured.findIndex(({ slug }) => slug === "worktime-reporting"));
  await expect.poll(async () => (await chapter.boundingBox())?.y ?? Infinity, { timeout: 8_000 }).toBeLessThanOrEqual(0);
  await expect(chapter.getByRole("heading", { level: 3 })).toBeInViewport();
});

test("scenarios switch products and steps with real screenshots", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const scenes = page.locator(".scenes");
  await scenes.scrollIntoViewIfNeeded();
  await expect(scenes.getByRole("heading", { name: "От выгрузки до готового Excel" })).toBeVisible();
  await scenes.getByRole("tab", { name: "Курсы валют" }).click();
  await expect(scenes.getByRole("heading", { name: "Курс ЦБ на рабочем столе" })).toBeVisible();
  await scenes.getByRole("tab", { name: /График/ }).click();
  await expect(scenes.getByRole("tab", { name: /График/ })).toHaveAttribute("aria-selected", "true");
  const front = scenes.locator(".scenes-card:not([aria-hidden='true']) img");
  await expect.poll(() => front.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await scenes.getByRole("button", { name: "Следующий этап" }).click();
  await expect(scenes.getByRole("tab", { name: /Валюты/ })).toHaveAttribute("aria-selected", "true");
});

test("the list of other cases links every case and the footer reaches all sections", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator(".more-row");
  await expect(rows).toHaveCount(otherProjects.length);
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

test("every live demo runs on its case page and on its own full screen", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // What proves each demo is alive: a drawing surface, physics-placed tags or split letters.
  const alive: Record<string, string> = { "gradient-studio": ".gs-canvas", "globe-routes": ".gr canvas", "gravity-tags": ".gt-tag", "kinetic-type": ".kt-word", "shader-gallery": ".sg-canvas", "micro-ui": ".mu-magnet", "particle-type": ".pt-canvas", "scroll-story": ".ss-map", "analytics-dashboard": ".ad-kpis", "kanban-board": ".kb-card", "booking-flow": ".bk-option", "drum-machine": ".dm-step", pcstudio: ".px-stage canvas", "document-factory": ".df-stats", chessrise: ".ch-board", "worktime-reporting": ".wt-kpis" };
  for (const project of projects.filter(({ live }) => live)) {
    await page.goto(`/projects/${project.slug}`);
    const live = page.locator("#live");
    await live.scrollIntoViewIfNeeded();
    await expect(live.locator(alive[project.slug]).first()).toBeVisible({ timeout: 15_000 });
    await page.goto(`/demos/lab/${project.slug}`);
    await expect(page.locator(".showcase-full " + alive[project.slug]).first()).toBeVisible({ timeout: 15_000 });
    expect((await page.locator(".showcase-full").boundingBox())!.height).toBeGreaterThan(300);
  }
  expect(errors).toEqual([]);
});

test("the product showcases do their job end to end", async ({ page }) => {
  // Booking: service → master → day → slot → contacts → ticket.
  await page.goto("/demos/lab/booking-flow");
  await page.getByRole("button", { name: /Мужская стрижка/ }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await page.getByRole("button", { name: /Илья/ }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await page.locator(".bk-grid button[data-load]:not([disabled])").first().click();
  await page.locator(".bk-slots button:not([disabled])").first().click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await page.getByRole("button", { name: "Записаться" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await page.locator(".bk-form input").first().fill("Ильгиз");
  await page.locator(".bk-form input").nth(1).fill("9001234567");
  await expect(page.locator(".bk-form input").nth(1)).toHaveValue("+7 (900) 123-45-67");
  await page.getByRole("button", { name: "Записаться" }).click();
  await expect(page.getByRole("heading", { name: "Вы записаны" })).toBeVisible();

  // Kanban: a card moved by its button changes column and survives a reload.
  await page.goto("/demos/lab/kanban-board");
  await page.evaluate(() => localStorage.removeItem("showcase-kanban-v1"));
  await page.reload();
  const card = page.locator(".kb-card", { hasText: "Письмо о доставке" });
  await card.focus();
  await card.getByRole("button", { name: "В следующую колонку" }).click();
  await expect(page.locator('[data-column="doing"]')).toContainText("Письмо о доставке");
  // Three of three is the limit, not over it; a fourth card turns the warning on.
  await expect(page.locator('[data-column="doing"] h4')).toContainText("3 / 3");
  await expect(page.locator('[data-column="doing"]')).not.toHaveAttribute("data-over", "true");
  const second = page.locator(".kb-card", { hasText: "Макет карточки товара" });
  await second.focus();
  await second.getByRole("button", { name: "В следующую колонку" }).click();
  await expect(page.locator('[data-column="doing"]')).toHaveAttribute("data-over", "true");
  await page.reload();
  await expect(page.locator('[data-column="doing"]')).toContainText("Письмо о доставке");

  // Flights: two airports from the search make a route with a real great-circle distance.
  await page.goto("/demos/lab/globe-routes");
  // The demo opens with Moscow as the origin; pressing "Откуда" starts the route over.
  await page.getByRole("button", { name: /^Откуда/ }).click();
  await page.locator(".gr-search input").fill("Токио");
  await page.locator(".gr-found button").first().click();
  await page.locator(".gr-search input").fill("JFK");
  await page.locator(".gr-found button").first().click();
  await expect(page.locator(".gr-big")).toHaveText(/10\s875 км/);
  await expect(page.locator(".gr-fact")).toContainText("длиннее");

  // Drum machine: the share link restores the beat it was made from.
  await page.goto("/demos/lab/drum-machine#b=802809490000ffff02000012-136-15");
  await expect(page.locator(".dm-transport label b").first()).toHaveText("136");
  await expect(page.getByRole("gridcell", { name: "Хэт, шаг 7" })).toHaveAttribute("aria-selected", "true");

  // Scroll story: the totals end at the repository's real numbers.
  await page.goto("/demos/lab/scroll-story");
  await page.locator(".ss").evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(page.locator(".ss-index")).toContainText("Глава 8 из 8");
  await expect(page.locator(".ss-totals dd").first()).toHaveText("78");

  // Dashboard: the period changes the numbers, the table view lists every day.
  await page.goto("/demos/lab/analytics-dashboard");
  await page.getByRole("tab", { name: "7 дней" }).click();
  await page.getByRole("button", { name: "Таблица" }).click();
  await expect(page.locator(".ad-table tbody tr")).toHaveCount(7);
});
