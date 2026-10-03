import { expect, test } from "@playwright/test";

test("hero switches real project screens and their case links", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const selector = page.getByRole("group", { name: "Проект на первом экране" });
  for (const [label, slug] of [["Пионер", "pioner"], ["RevaLib", "revalib"], ["ChessRise", "chessrise"]]) {
    await selector.getByRole("button", { name: label, exact: true }).click();
    await expect(selector.getByRole("button", { name: label, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: `Смотреть кейс ${label}` })).toHaveAttribute("href", `/projects/${slug}`);
    const image = page.locator('.hero-screen[data-active="true"] img');
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBeTruthy();
  }
  await selector.getByRole("button", { name: "Предыдущий проект" }).click();
  await expect(selector.getByRole("button", { name: "RevaLib", exact: true })).toHaveAttribute("aria-pressed", "true");
  await selector.getByRole("button", { name: "Следующий проект" }).focus();
  await page.keyboard.press("Enter");
  await expect(selector.getByRole("button", { name: "ChessRise", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("reduced motion keeps the hero interactive without camera motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("group", { name: "Проект на первом экране" }).getByRole("button", { name: "Пионер", exact: true }).click();
  await expect(page.getByRole("link", { name: "Смотреть кейс Пионер" })).toBeVisible();
  await expect.poll(() => page.locator(".hero-exhibit-camera").evaluate((element) => getComputedStyle(element).transform)).toBe("none");
});

test("touch swipe changes the featured hero project", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch gesture is exercised in the mobile profile.");
  await page.goto("/");
  const box = await page.locator(".hero-exhibit").boundingBox();
  expect(box).not.toBeNull();
  const client = await page.context().newCDPSession(page);
  const y = box!.y + 90;
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 280, y }] });
  for (let x = 260; x >= 120; x -= 20) {
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByRole("group", { name: "Проект на первом экране" }).getByRole("button", { name: "Пионер", exact: true })).toHaveAttribute("aria-pressed", "true");
  await client.detach();
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
