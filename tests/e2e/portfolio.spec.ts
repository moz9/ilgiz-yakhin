import { expect, test } from "@playwright/test";

const leak = /revelation|tianyu|tower.?spirits|vk.?play|192\.168\./i;
const streamingLeak = /animego|shikimori|kodik|anixart|dorama|192\.168|\.vc|\.biz/i;

test("home presents the name, the selected work and every other case", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ильгиз Яхин", exact: true })).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og-v2\.jpg$/);
  const socialPreview = await request.get("/og-v2.jpg");
  expect(socialPreview.headers()["content-type"]).toContain("image/jpeg");
  await expect(page.locator(".chapter")).toHaveCount(8);
  await expect(page.locator(".chapter h3 a").first()).toHaveAttribute("href", "/projects/chessrise");
  await expect(page.locator(".chapter h3 a").nth(1)).toHaveAttribute("href", "/projects/liquid-glass-kit");
  await expect(page.locator(".more-row")).toHaveCount(8);
  await expect(page.getByRole("navigation", { name: "Основная навигация" })).toBeVisible();
  await expect(page.locator(".hero")).not.toContainText("Барнаул");
});

test("selected work stays reachable without motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".chapter")).toHaveCount(8);
  await page.locator(".chapter").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".chapter").last()).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("catalogue filters cases and opens a technical breakdown", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Работы", exact: true })).toBeVisible();
  await expect(page.locator(".project-card")).toHaveCount(16);
  await page.getByRole("tab", { name: /Desktop/ }).click();
  await expect(page.locator(".project-card")).toHaveCount(6);
  await page.getByRole("heading", { name: "Система подготовки отчетности рабочего времени" }).click();
  await expect(page).toHaveURL(/worktime-reporting/);
  await expect(page.getByRole("heading", { name: "Ключевые решения" })).toBeVisible();
  await expect(page.getByText("Честные границы")).toBeVisible();
});

test("resume files and email are reachable and the resume has no portrait", async ({ page, request }) => {
  await page.goto("/resume");
  await expect(page.getByRole("heading", { name: "Full-stack и AI-разработчик" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("img")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Коммерческая практика" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "PDF-версии" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: /im@angelius.ru/ }).first()).toHaveAttribute("href", "mailto:im@angelius.ru");
  await expect(page.locator(".resume-docs a")).toHaveCount(2);
  for (const file of ["/resume/ilgiz-yakhin-compact.pdf", "/resume/ilgiz-yakhin-extended.pdf"]) {
    const response = await request.get(file);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  }
});

test("resume remains complete with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/resume");
  await expect(page.getByRole("main")).toContainText("Казанский государственный энергетический университет");
});

test("launcher case exposes the reconstructed interface and a safe interactive demo", async ({ page }) => {
  await page.goto("/projects/launcher");
  await expect(page.getByRole("heading", { name: "Launcher", exact: true })).toBeVisible();
  await expect(page.locator(".case-stack")).toContainText("WinUI 3");
  await expect(page.getByRole("heading", { name: "Что умеет продукт" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Старт и поведение" })).toBeVisible();
  await expect(page.locator(".gallery figure")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Открыть интерактивное демо" })).toHaveAttribute("href", "/demos/launcher");
  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(leak);
  expect(visibleText).toMatch(/реконструкц/i);

  await page.goto("/demos/launcher");
  await expect(page).toHaveTitle(/лаунчера/i);
  await expect(page.getByRole("button", { name: "Настройки игры", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Основная навигация" })).toHaveCount(0);
  expect(await page.locator("body").innerText()).not.toMatch(leak);
});

test("streaming web case exposes product functions and a safe interactive demo", async ({ page }) => {
  await page.goto("/projects/streaming-web-platform");
  await expect(page.getByRole("heading", { name: "Стриминговая web-платформа", exact: true })).toBeVisible();
  await expect(page.locator(".case-capabilities article")).toHaveCount(6);
  await expect(page.locator(".gallery figure")).toHaveCount(8);
  await expect(page.locator(".case-stack")).toContainText("DLE CMS");
  await expect(page.getByRole("link", { name: "Открыть интерактивное демо" })).toHaveAttribute("href", "/demos/content-platform");

  await page.goto("/demos/content-platform");
  await expect(page.getByRole("heading", { name: "Фильмы и сериалы онлайн в хорошем качестве" })).toBeVisible();
  await page.getByLabel("Разделы демонстрации").getByRole("button", { name: "Мои списки", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Мои списки" })).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(streamingLeak);
});

test("Android case demonstrates phone and D-pad TV flows", async ({ page }) => {
  await page.goto("/projects/streaming-android-tv");
  await expect(page.getByRole("heading", { name: "Android-приложение для смартфона и TV", exact: true })).toBeVisible();
  await expect(page.locator(".case-evidence")).toContainText("922 tests");
  await expect(page.locator(".case-capabilities article")).toHaveCount(6);
  await expect(page.locator(".gallery figure")).toHaveCount(6);

  await page.goto("/demos/mobile-tv");
  await expect(page.getByRole("heading", { name: "Один продукт. Два способа взаимодействия." })).toBeVisible();
  await page.getByRole("button", { name: "Android TV" }).click();
  await expect(page.locator('[class*="tvRail"] button')).toHaveCount(6);
  expect(await page.locator("body").innerText()).not.toMatch(streamingLeak);
});

test("remaining cases include product stories and purposeful media frames", async ({ page }) => {
  const cases = [
    { route: "/projects/chessrise", groups: 4, media: 3, presentation: "collage" },
    { route: "/projects/pioner", groups: 4, media: 1, presentation: "collage" },
    { route: "/projects/worktime-reporting", groups: 4, media: 2, presentation: "strip" },
    { route: "/projects/visitor-flow-reporting", groups: 4, media: 2, presentation: "strip" },
    { route: "/projects/infrastructure-inventory", groups: 4, media: 2, presentation: "strip" },
    { route: "/projects/backup-lifecycle-automation", groups: 4, media: 1, presentation: "diagram" },
  ];
  for (const item of cases) {
    await page.goto(item.route);
    await expect(page.getByRole("heading", { name: "Что умеет продукт" })).toBeVisible();
    await expect(page.locator(".case-capabilities article")).toHaveCount(item.groups);
    await expect(page.locator(".gallery figure")).toHaveCount(item.media);
    await expect(page.locator(`[data-presentation="${item.presentation}"]`).first()).toBeAttached();
  }
});

test("pages do not overflow horizontally", async ({ page }) => {
  for (const route of ["/", "/projects", "/projects/revalib", "/projects/launcher", "/projects/streaming-android-tv", "/demos/launcher", "/demos/content-platform", "/demos/mobile-tv", "/about", "/experience", "/resume", "/how-built", "/missing-page"]) {
    await page.goto(route);
    // The dev server compiles a route on first request: read until two measurements agree.
    const measure = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const readings: number[] = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await page.waitForTimeout(350);
      readings.push(await measure());
      if (readings.length >= 2 && readings.at(-1) === readings.at(-2)) break;
    }
    const overflow = readings.at(-1)!;
    const offenders = overflow > 1 ? await page.evaluate(() => Array.from(document.querySelectorAll("body *"))
      .map((element) => { const rect = element.getBoundingClientRect(); return { tag: element.tagName, className: element.className?.toString().slice(0, 100), right: Math.round(rect.right) }; })
      .filter((rect) => rect.right > window.innerWidth + 1).slice(0, 8)) : [];
    expect(overflow, `${route}\n${JSON.stringify(offenders, null, 2)}`).toBeLessThanOrEqual(1);
  }
});

test("pages hydrate without a server/client mismatch", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text()); });
  page.on("pageerror", (error) => { if (/hydrat/i.test(error.message)) errors.push(error.message); });
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion });
    for (const route of ["/", "/projects", "/projects/chessrise", "/resume"]) {
      await page.goto(route);
      await page.waitForTimeout(600);
    }
  }
  expect(errors).toEqual([]);
});
