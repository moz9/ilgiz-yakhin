import { expect, test } from "@playwright/test";

test("keyboard focus keeps the pinned project and selector in sync", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mobile uses the vertical project list.");
  await page.goto("/");
  const wrap = page.locator(".redesign-pin-wrap");
  await expect.poll(() => wrap.evaluate((element: HTMLElement) => element.style.height)).not.toBe("");
  await wrap.evaluate((element) => window.scrollTo({ top: scrollY + element.getBoundingClientRect().top, behavior: "instant" }));
  const cards = page.locator(".redesign-project-card");
  const selectors = page.locator(".project-jump-controls button");
  await cards.first().focus();

  for (let index = 1; index < await cards.count(); index += 1) {
    await page.keyboard.press("Tab");
    await expect(cards.nth(index)).toBeFocused();
    await expect(selectors.nth(index)).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => cards.nth(index).evaluate((card) => {
      const rect = card.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= innerWidth + 1;
    })).toBe(true);
    expect(await page.locator(".redesign-pin").evaluate((element) => element.scrollLeft)).toBe(0);
  }

  await page.keyboard.press("Shift+Tab");
  await expect(cards.nth(4)).toBeFocused();
  await expect(selectors.nth(4)).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects\/content-platform$/);
});

test("vertical project lists retain native focus scrolling", async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: isMobile ? "no-preference" : "reduce" });
  await page.goto("/");
  await expect(page.locator(".project-jump-controls")).toBeHidden();
  const cards = page.locator(".redesign-project-card");
  for (const card of await cards.all()) {
    await card.focus();
    await expect(card).toBeFocused();
    await expect(card).toBeInViewport();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
