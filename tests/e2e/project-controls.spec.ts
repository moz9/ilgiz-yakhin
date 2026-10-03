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

test("project panels show real media and compact glass case actions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".project-caption .glass-layer")).toHaveCount(6);
  const first = page.locator(".redesign-project-card").first();
  await first.scrollIntoViewIfNeeded();
  await expect(first.locator(".project-caption-open")).toContainText("Кейс");
  await expect.poll(() => first.locator(".stage-main-device img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator(".other-project-thumb")).toHaveCount(7);
  await expect(page.locator(".delivery-step")).toHaveCount(6);
  await expect(page.locator(".delivery-step[data-complete=true]")).toHaveCount(6);
});

test("delivery progress follows scroll and scenario glass stays inside the viewer", async ({ page }) => {
  await page.goto("/");
  const steps = page.locator(".delivery-step");
  await steps.first().scrollIntoViewIfNeeded();
  const before = await page.locator(".delivery-progress i").evaluate((element) => getComputedStyle(element).transform);
  await steps.last().scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator(".delivery-progress i").evaluate((element) => getComputedStyle(element).transform)).not.toBe(before);
  const showcase = page.locator(".workbench");
  await showcase.locator(".workbench-modes").scrollIntoViewIfNeeded();
  await expect(showcase.locator(".scenario-deck > .workbench-modes .glass-layer")).toBeVisible();
  await showcase.getByRole("button", { name: "Стриминг", exact: true }).click();
  await expect(showcase.getByRole("button", { name: "Стриминг", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(showcase.locator(".workbench-frame img")).toBeVisible();
});

test("a failed scenario image shows a recovery link instead of an empty screen", async ({ page }) => {
  await page.route("**/worktime-source.webp", (route) => route.abort());
  await page.goto("/");
  const screen = page.locator(".workbench-frame");
  await screen.scrollIntoViewIfNeeded();
  await expect(screen.getByRole("status", { name: "Не удалось загрузить экран" })).toBeVisible();
  await expect(screen.getByRole("link", { name: "Открыть изображение" })).toHaveAttribute("href", /raw\.githubusercontent\.com.*worktime-source\.webp/);
  await expect(screen).toHaveAttribute("aria-busy", "false");
});

test("reduced transparency makes every new home glass opaque", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Внешний вид", exact: true }).click();
  await page.getByRole("checkbox", { name: "Уменьшить прозрачность" }).check();
  await expect.poll(() => page.locator(".redesign-home .glass-layer").evaluateAll((layers) => layers.every((layer) => {
    const style = getComputedStyle(layer);
    return style.backgroundColor === "rgb(32, 40, 51)" && style.backdropFilter === "none";
  }))).toBeTruthy();
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
