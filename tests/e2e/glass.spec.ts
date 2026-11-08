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

test("the site opens dark, switches to light and remembers it before the first paint", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Включить светлую тему" }).click();
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
