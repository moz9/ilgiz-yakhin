import { expect, test, type Page } from "@playwright/test";

// The Liquid Glass contract on this site (vendored kit: src/lib/liquid-glass).
// Pixel-level optics are audited with the skill's lg-audit.mjs; these tests pin the
// behaviour that a refactor could silently break.

const ready = (page: Page) => expect(page.locator("html")).toHaveAttribute("data-lgk-renderer", /lens|frosted|solid/);

test("Chromium renders real lenses, including the tab lenses React mounts early", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "SVG refraction inside backdrop-filter is Chromium-only");
  await page.goto("/projects");
  await ready(page);
  await expect(page.locator("html")).toHaveAttribute("data-lgk-renderer", "lens");
  // A tab lens created before the renderer was known would stay on the frosted path.
  await page.getByRole("tab", { name: /Web/ }).click();
  await expect.poll(() => page.locator(".filter-tabs .lgk-lens").getAttribute("data-renderer")).toBe("lens");
  await expect.poll(() => page.locator(".filter-tabs .lgk-lens__glass").evaluate((element) => getComputedStyle(element).backdropFilter)).toContain("url(");
  await expect(page.locator(".site-nav-bar")).toHaveClass(/\blg\b/);
});

test("the appearance setting drives every glass, persists and can be reset", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const trigger = page.getByRole("button", { name: "Внешний вид" });
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "Внешний вид" });
  await expect(panel).toBeVisible();
  // The panel takes the focus when it opens.
  await expect.poll(() => panel.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  const slider = page.locator("#glass-density");
  await slider.evaluate((element: HTMLInputElement) => { element.value = "85"; element.dispatchEvent(new Event("input", { bubbles: true })); element.dispatchEvent(new Event("change", { bubbles: true })); });
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--lg-density").trim())).toBe("0.850");
  await page.reload();
  await ready(page);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--lg-density").trim())).toBe("0.850");
  await page.getByRole("button", { name: "Внешний вид" }).click();
  await page.getByRole("button", { name: "Вернуть по умолчанию" }).click();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--lg-density").trim())).toBe("0.300");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(page.getByRole("button", { name: "Внешний вид" })).toBeFocused();
});

test("reduce transparency makes the glass opaque, from the site and from the system", async ({ page, browser }) => {
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Внешний вид" }).click();
  await page.getByRole("switch").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-lg-tier", "0");
  await expect(page.locator("#glass-density")).toBeDisabled();
  await page.reload();
  await ready(page);
  await expect(page.locator("html")).toHaveAttribute("data-lg-tier", "0");

  const context = await browser.newContext({ reducedMotion: "reduce", forcedColors: "none" });
  const system = await context.newPage();
  await system.emulateMedia({ reducedMotion: "reduce" });
  await system.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => query.includes("prefers-reduced-transparency")
      ? ({ matches: true, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } as MediaQueryList)
      : original(query);
  });
  await system.goto(page.url());
  await expect(system.locator("html")).toHaveAttribute("data-lgk-renderer", "solid");
  await context.close();
});

test("the hero lens and the reel move without shifting the layout", async ({ page, isMobile }) => {
  await page.goto("/");
  await ready(page);
  await expect(page.locator(".hero .lgk-lens")).toHaveCount(1);
  const shift = await page.evaluate(() => new Promise<number>((resolve) => {
    let total = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[] & { value: number; hadRecentInput: boolean }[]) if (!entry.hadRecentInput) total += entry.value;
    }).observe({ type: "layout-shift", buffered: false });
    setTimeout(() => resolve(total), 2500);
  }));
  expect(shift).toBeLessThan(0.02);
  if (!isMobile) {
    const before = await page.locator(".hero .lgk-lens").evaluate((element) => element.style.transform);
    await page.mouse.move(300, 300);
    await page.mouse.move(700, 420, { steps: 8 });
    await expect.poll(() => page.locator(".hero .lgk-lens").evaluate((element) => element.style.transform)).not.toBe(before);
  }
});

test("navigation lens follows the current section", async ({ page, isMobile }) => {
  await page.goto("/experience");
  await ready(page);
  await expect(page.locator('.site-nav-tabs a[aria-current="page"]')).toHaveText(/Опыт/);
  await expect(page.locator(".site-nav-tabs a[data-lg-selected]")).toHaveText(/Опыт/);
  await page.locator(".site-nav-tabs a").filter({ hasText: "Резюме" }).click();
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.locator(".site-nav-tabs a[data-lg-selected]")).toHaveText(/Резюме/);
  if (!isMobile) {
    await page.locator("#skills").scrollIntoViewIfNeeded();
    await expect(page.locator(".case-nav-tabs a[aria-current='location']")).toHaveText("Компетенции");
  }
});

test("the site opens dark, switches to light and remembers it before the first paint", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  if (isMobile) {
    // On a phone the quick switch gives its place to "home"; the panel still has the choice.
    await ready(page);
    await page.getByRole("button", { name: "Внешний вид" }).click();
    await page.getByRole("tab", { name: "Светлая" }).click();
    await page.keyboard.press("Escape");
  } else await page.getByRole("button", { name: "Включить светлую тему" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  // The inline script applies the saved choice before React hydrates.
  await page.reload({ waitUntil: "commit" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await ready(page);
  await page.getByRole("button", { name: "Внешний вид" }).click();
  await page.getByRole("tab", { name: "Как в системе" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-pref", "system");
});

test("case contents jump straight to the chosen section and keep it selected", async ({ page, isMobile }) => {
  test.skip(isMobile, "The phone layout scrolls the same way; one run is enough");
  await page.goto("/projects/routerdesk");
  await ready(page);
  const tabs = page.locator(".case-nav-tabs a");
  const seen = new Set<string>();
  await page.exposeFunction("seeTab", (name: string) => { seen.add(name); });
  await page.evaluate(() => setInterval(() => {
    const name = document.querySelector(".case-nav-tabs a[data-lg-selected]")?.textContent;
    if (name) (window as unknown as { seeTab: (n: string) => void }).seeTab(name);
  }, 40));
  await tabs.filter({ hasText: "Решения" }).click();
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("decisions")!.getBoundingClientRect().top)), { timeout: 8_000 }).toBeLessThan(220);
  await expect(page.locator(".case-nav-tabs a[aria-current='location']")).toHaveText("Решения");
  // The sections passed on the way never take the selection.
  seen.delete("Коротко");
  expect([...seen]).toEqual(["Решения"]);
  // The last section cannot reach the top, and still stays the one selected.
  await tabs.filter({ hasText: "Результаты" }).click();
  await page.waitForTimeout(1800);
  await expect(page.locator(".case-nav-tabs a[aria-current='location']")).toHaveText("Результаты");
});

test("every page has a way back home, on a phone too", async ({ page }) => {
  await page.goto("/projects/routerdesk");
  const home = page.getByRole("link", { name: "Ильгиз Яхин — на главную" });
  await expect(home).toBeVisible();
  await expect(home).toBeInViewport();
  await home.click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("the kit case lets the reader move and reshape a real lens", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/liquid-glass-kit");
  await ready(page);
  const stage = page.locator(".playground-stage");
  await stage.scrollIntoViewIfNeeded();
  const lens = page.locator(".playground-lens");
  await expect(lens).toBeVisible();
  const before = await lens.boundingBox();
  // Arrow keys move the lens, so the scene is usable without a pointer.
  await stage.focus();
  await page.keyboard.press("Shift+ArrowRight");
  await expect.poll(async () => (await lens.boundingBox())!.x).toBeGreaterThan(before!.x + 40);
  // The shape tabs change the lens itself, not only the selected tab.
  await page.getByRole("tablist", { name: "Форма линзы" }).getByRole("tab", { name: "Панель" }).click();
  await expect.poll(async () => (await lens.boundingBox())!.width).toBeGreaterThan(before!.width * 1.2);
  // The density control is the site-wide setting.
  await page.locator(".playground-density input").fill("70");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("portfolio-glass-density"))).toBe("70");
});

test("the GlassRates widget flows between sizes and refreshes on its right half", async ({ page, request }) => {
  // The site answers with CBR rates (live, or the saved ones when no source is reachable).
  const rates = await (await request.get("/api/rates")).json();
  expect(rates.rates.map((rate: { code: string }) => rate.code)).toEqual(["USD", "EUR"]);
  expect(rates.rates.every((rate: { value: number; previous: number }) => rate.value > 0 && rate.previous > 0)).toBe(true);
  await page.goto("/projects/glassrates");
  await ready(page);
  const widget = page.locator(".ws-widget");
  await widget.scrollIntoViewIfNeeded();
  const sizes = page.getByRole("tablist", { name: "Размер" });
  await sizes.getByRole("tab", { name: "1 × 2" }).click();
  await expect.poll(async () => { const box = (await widget.boundingBox())!; return box.width / box.height; }).toBeGreaterThan(1.8);
  await sizes.getByRole("tab", { name: "2 × 4" }).click();
  await expect(widget).toHaveAttribute("data-size", "2 × 4");
  await expect.poll(async () => { const box = (await widget.boundingBox())!; return box.width / box.height; }, { timeout: 4_000 }).toBeGreaterThan(1.8);
  // The rolled digits land on the rate the endpoint returned.
  const usd = rates.rates[0].value.toFixed(2).replace(".", ",");
  await expect(widget.getByLabel(`${usd} ₽`)).toBeVisible();
  await expect.poll(() => widget.locator(".roll-strip").first().evaluate((el) => getComputedStyle(el).getPropertyValue("--roll").trim()), { timeout: 4_000 }).toMatch(new RegExp(`^${usd[0]}(\\.0+)?$`));
  await page.getByRole("button", { name: "Обновить курсы на виджете" }).click();
  await expect(widget.locator(".ws-foot")).not.toContainText("09.11 07:11", { timeout: 3_000 });
  await expect(widget).toHaveClass(/\blg\b/);
});
