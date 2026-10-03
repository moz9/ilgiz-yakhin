import { expect, test } from "@playwright/test";

test("home follows the approved visual direction and keeps all cases reachable", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ILGIZ YAKHIN", exact: true })).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og-v2\.jpg$/);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /\/og-v2\.jpg$/);
  const socialPreview = await request.get("/og-v2.jpg");
  expect(socialPreview.ok()).toBeTruthy();
  expect(socialPreview.headers()["content-type"]).toContain("image/jpeg");
  await expect(page.locator(".redesign-wall-tile")).toHaveCount(36);
  await expect(page.locator(".redesign-project-card")).toHaveCount(6);
  await expect(page.locator(".redesign-other a")).toHaveCount(7);
  await expect(page.locator(".redesign-project-card").first()).toHaveAttribute("href", "/projects/chessrise");
  await expect(page.locator(".redesign-project-card").nth(1)).toHaveAttribute("href", "/projects/pioner");
  await expect(page.getByRole("navigation", { name: "Быстрая навигация" })).toBeVisible();
  await expect(page.locator(".redesign-hero")).not.toContainText("Барнаул");
});

test("featured projects remain accessible without motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".redesign-project-card")).toHaveCount(6);
  await page.locator(".redesign-project-card").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".redesign-project-card").last()).toBeVisible();
  await expect(page.getByRole("group", { name: "Быстрый выбор проекта" })).toBeHidden();
  await expect(page.locator(".redesign-lens")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("catalog filters cases and opens a technical breakdown", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Проекты", exact: true })).toBeVisible();
  await expect(page.locator(".project-row")).toHaveCount(13);
  await page.getByRole("button", { name: /Desktop/ }).click();
  await expect(page.getByRole("heading", { name: "Система подготовки отчетности рабочего времени" })).toBeVisible();
  await page.getByRole("link", { name: "Система подготовки отчетности рабочего времени", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ключевые решения" })).toBeVisible();
  await expect(page.getByText("Честные границы")).toBeVisible();
});

test("resume files and email are reachable", async ({ page, request }) => {
  await page.goto("/resume");
  await expect(page.getByRole("heading", { name: "Full-stack / AI-разработчик" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("img", { name: "Ильгиз Яхин" })).toHaveCount(0);
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

test("launcher case describes the current WinUI build without obsolete screens", async ({ page }) => {
  await page.goto("/projects/launcher");
  await expect(page.getByRole("heading", { name: "Launcher", exact: true })).toBeVisible();
  await expect(page.locator(".redesign-case-stack")).toContainText("WinUI 3");
  await expect(page.getByRole("heading", { name: "Функциональные контуры" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Запуск и готовность" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Диагностика" }).first()).toBeVisible();
  await expect(page.locator(".redesign-case-winui")).toBeVisible();
  await expect(page.locator(".redesign-case-gallery figure")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Открыть интерактивное демо" })).toHaveCount(0);
  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(/revelation|tianyu|tower.?spirits|vk.?play|192\.168\./i);
});

test("streaming web case exposes product functions and a safe interactive demo", async ({ page }) => {
  await page.goto("/projects/streaming-web-platform");
  await expect(page.getByRole("heading", { name: "Стриминговая web-платформа", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Функциональные контуры" })).toBeVisible();
  await expect(page.locator(".redesign-case-flow-grid article")).toHaveCount(6);
  await expect(page.locator(".redesign-case-gallery figure")).toHaveCount(10);
  await expect(page.locator(".redesign-case-stack")).toContainText("DLE CMS");
  await expect(page.getByRole("link", { name: "Открыть интерактивное демо" })).toHaveAttribute("href", "/demos/content-platform");

  await page.goto("/demos/content-platform");
  await expect(page.getByRole("heading", { name: "Фильмы и сериалы онлайн в хорошем качестве" })).toBeVisible();
  await page.getByRole("button", { name: "AI-подбор", exact: true }).click();
  await page.getByRole("button", { name: "Подобрать" }).click();
  await expect(page.getByText(/Пользовательский smart search/)).toBeVisible();
  await page.getByRole("button", { name: "Контент", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Каталог и редакция" })).toBeVisible();
  await expect(page.getByText("OmniRoute", { exact: true })).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/animego|shikimori|kodik|anixart|dorama|192\.168|\.vc|\.biz/i);
});

test("Android case demonstrates phone and D-pad TV flows", async ({ page }) => {
  await page.goto("/projects/streaming-android-tv");
  await expect(page.getByRole("heading", { name: "Android-приложение для смартфона и TV", exact: true })).toBeVisible();
  await expect(page.locator(".redesign-case-evidence")).toContainText("922 tests");
  await expect(page.locator(".redesign-case-flow-grid article")).toHaveCount(6);
  await expect(page.locator(".redesign-case-gallery figure")).toHaveCount(6);

  await page.goto("/demos/mobile-tv");
  await expect(page.getByRole("heading", { name: "Один продукт. Два способа взаимодействия." })).toBeVisible();
  await page.locator('[class*="phoneCards"]').getByRole("button").first().click();
  await page.getByRole("button", { name: "Смотреть", exact: true }).click();
  await expect(page.getByRole("button", { name: "Пропустить заставку" })).toBeVisible();
  await page.getByRole("button", { name: "Android TV" }).click();
  await page.locator('[class*="tvRail"]').getByRole("button", { name: "Плеер" }).click();
  await expect(page.getByRole("button", { name: "Пропустить заставку" })).toBeVisible();
  await expect(page.getByText("1080p")).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/animego|shikimori|kodik|anixart|dorama|192\.168|\.vc|\.biz/i);
});

test("remaining cases include substantial product stories and purposeful media frames", async ({ page }) => {
  const cases = [
    { route: "/projects/chessrise", groups: 4, media: 3, presentation: "browser" },
    { route: "/projects/pioner", groups: 4, media: 2, presentation: "phone" },
    { route: "/projects/worktime-reporting", groups: 4, media: 3, presentation: "document" },
    { route: "/projects/visitor-flow-reporting", groups: 4, media: 3, presentation: "desktop" },
    { route: "/projects/infrastructure-inventory", groups: 4, media: 3, presentation: "desktop" },
    { route: "/projects/backup-lifecycle-automation", groups: 4, media: 1, presentation: "diagram" },
  ];

  for (const item of cases) {
    await page.goto(item.route);
    await expect(page.getByRole("heading", { name: "Функциональные контуры" })).toBeVisible();
    await expect(page.locator(".redesign-case-flow-grid article")).toHaveCount(item.groups);
    await expect(page.locator(".redesign-case-gallery figure")).toHaveCount(item.media);
    await expect(page.locator(`[data-presentation="${item.presentation}"]`).first()).toBeVisible();
  }
});

test("pages do not overflow horizontally", async ({ page }) => {
  for (const route of ["/", "/projects", "/projects/revalib", "/projects/launcher", "/projects/streaming-web-platform", "/projects/streaming-android-tv", "/demos/launcher/index.html", "/demos/content-platform", "/demos/mobile-tv", "/about", "/resume", "/how-built"]) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const offenders = overflow > 1 ? await page.evaluate(() => Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, className: element.className?.toString().slice(0, 100), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
      })
      .filter((rect) => rect.right > window.innerWidth + 1 || rect.left < -1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 8)) : [];
    expect(overflow, `${route}\n${JSON.stringify(offenders, null, 2)}`).toBeLessThanOrEqual(1);
  }
});
