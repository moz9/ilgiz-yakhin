export const projectCategories = ["Все", "Web", "Desktop", "Automation", "Infrastructure"] as const;

export type ProjectCategory = Exclude<(typeof projectCategories)[number], "Все">;

export type Evidence = {
  label: string;
  value: string;
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  shortTitle: string;
  category: ProjectCategory[];
  status: string;
  role: string;
  summary: string;
  task: string;
  stack: string[];
  decisions: { title: string; text: string }[];
  results: string[];
  evidence: Evidence[];
  limitations: string[];
  links?: { label: string; href: string }[];
  access: "public" | "mixed" | "private";
  accent: "teal" | "red" | "graphite";
};

export const projects: Project[] = [
  {
    slug: "lunafantasy",
    index: "01",
    title: "LunaFantasy",
    shortTitle: "Full-stack platform",
    category: ["Web", "Infrastructure"],
    status: "Production / private repository",
    role: "Full-stack разработка, архитектура и эксплуатация",
    summary: "Контентная web-платформа с собственным backend-контуром, ролевой моделью и проверяемым процессом выпуска.",
    task: "Собрать поддерживаемый продукт вокруг большого каталога: дать пользователю быстрый поиск и навигацию, редактору — безопасное управление, а релизу — воспроизводимость и откат.",
    stack: ["Next.js 16", "React 19", "TypeScript", "PostgreSQL 16", "Docker Compose", "Nginx", "GitHub Actions", "Playwright"],
    decisions: [
      { title: "Серверные границы", text: "Авторизация, роли и изменение данных выполняются на сервере; входные данные проходят строгую проверку." },
      { title: "Воспроизводимый релиз", text: "Immutable releases, health/readiness checks, smoke-тест и rollback вместо ручного изменения работающей версии." },
      { title: "Доказательства", text: "Единые команды качества объединяют типизацию, тесты, production build и deployment-проверки." },
    ],
    results: ["31 Node-тест и 9 deployment-тестов", "Production build на 488 страниц", "Проверенные auth/RBAC, CSRF и security headers", "Green CI с PostgreSQL и миграциями"],
    evidence: [
      { label: "QA", value: "40 automated checks" },
      { label: "Build", value: "488 routes" },
      { label: "Security", value: "Auth / RBAC / CSRF" },
    ],
    limitations: ["Репозиторий закрыт: в портфолио публикуются архитектура и безопасные фрагменты.", "Предметные данные и редакторский доступ не раскрываются."],
    access: "mixed",
    accent: "teal",
  },
  {
    slug: "revalib",
    index: "02",
    title: "RevaLib",
    shortTitle: "Content operations",
    category: ["Web", "Automation", "Infrastructure"],
    status: "Production",
    role: "Full-stack разработка и production hardening",
    summary: "Публичная библиотека с ingestion-пайплайнами, поиском и human-in-the-loop модерацией предложений.",
    task: "Перевести контентный процесс из набора файлов в надежный редакторский workflow с версиями, конкурирующими изменениями и контролируемой публикацией.",
    stack: ["Next.js 16", "React 19", "TypeScript", "PostgreSQL 16", "Zod", "Nginx", "GitHub Actions", "Playwright"],
    decisions: [
      { title: "Модерация без автопубликации", text: "Роли admin/editor/contributor и очередь ручных решений сохраняют контроль человека над изменениями." },
      { title: "Конкурентные изменения", text: "UUID, версии, idempotency hashes и optimistic locking защищают от дублей и потери обновлений." },
      { title: "Восстановление", text: "Backup и synthetic restore drill проверяют не наличие архива, а фактическое восстановление данных и состояний." },
    ],
    results: ["PostgreSQL 16 и миграционный контур", "41 локальный тест", "CI с provisioning и rollback/up migrations", "Проверенный synthetic restore drill"],
    evidence: [
      { label: "Tests", value: "41 passed" },
      { label: "Data", value: "PostgreSQL 16" },
      { label: "Workflow", value: "RBAC + audit log" },
    ],
    limitations: ["Публично не показываются production-конфигурация, учетные записи и резервные копии.", "AI-публикация намеренно не используется без human review."],
    links: [{ label: "Открыть RevaLib", href: "https://revalib.ru" }],
    access: "mixed",
    accent: "red",
  },
  {
    slug: "worktime-reporting",
    index: "03",
    title: "Система подготовки отчетности рабочего времени",
    shortTitle: "Internal reporting tool",
    category: ["Desktop", "Automation"],
    status: "Windows application / anonymized demo",
    role: "Проектирование продукта и full-stack реализация",
    summary: "Локальное приложение превращает выгрузку системы контроля доступа в проверяемый Excel-отчет без ручной перекладки данных.",
    task: "Сохранить привычный бизнес-расчет, но убрать повторяющуюся ручную работу и сделать импорт, проверку и экспорт понятными для обычного сотрудника.",
    stack: ["React", "TypeScript", "FastAPI", "Pydantic", "Zod", "Python", "Excel", "Playwright", "Windows EXE"],
    decisions: [
      { title: "Контракты на двух сторонах", text: "Pydantic и Zod фиксируют формат входных данных и ошибок между интерфейсом и локальным API." },
      { title: "Неизменяемый источник", text: "Приложение читает исходную выгрузку без записи; SHA-256 подтверждает, что файл остается неизменным." },
      { title: "Проверка готового приложения", text: "E2E запускаются с реальным локальным API в нескольких профилях масштабирования Windows." },
    ],
    results: ["8 backend/API тестов", "3 browser-профиля: 100/125/150%", "Проверенный Windows EXE", "Структурный baseline Excel-результата"],
    evidence: [
      { label: "Input", value: "Source hash preserved" },
      { label: "E2E", value: "3 display profiles" },
      { label: "Delivery", value: "Windows EXE" },
    ],
    limitations: ["Название работодателя, реальные выгрузки и персональные данные не публикуются.", "Демонстрация использует полностью синтетический набор сотрудников."],
    access: "private",
    accent: "graphite",
  },
  {
    slug: "chessrise",
    index: "04",
    title: "ChessRise",
    shortTitle: "Commercial web launch",
    category: ["Web", "Infrastructure"],
    status: "Accepted and paid production project",
    role: "Разработка, запуск и передача заказчику",
    summary: "Сайт шахматной школы с интерактивной задачей, заявками и надежным production-контуром.",
    task: "Представить школу, провести родителя от первого знакомства до заявки и дать заказчику готовый работающий продукт, а не только макет.",
    stack: ["Next.js", "React", "TypeScript", "Supabase", "PostgreSQL", "RLS", "Nginx", "systemd"],
    decisions: [
      { title: "Надежная заявка", text: "Серверная валидация, запись в БД, Telegram-уведомление и PDF формируют контролируемый бизнес-сценарий." },
      { title: "Доступ к данным", text: "Миграции, индексы и Row Level Security ограничивают операции на уровне PostgreSQL." },
      { title: "Передаваемый production", text: "Health-check, versioned releases и rollback позволяют сопровождать сайт после сдачи." },
    ],
    results: ["Проект принят и оплачен заказчиком", "Полный цикл заявки", "SEO и Schema.org", "Versioned deployment и rollback"],
    evidence: [
      { label: "Outcome", value: "Accepted by client" },
      { label: "Data", value: "PostgreSQL + RLS" },
      { label: "Release", value: "Health + rollback" },
    ],
    limitations: ["Проект не изменяется без нового запроса заказчика.", "SMTP был подготовлен, но не подключен на момент передачи."],
    links: [{ label: "Открыть ChessRise", href: "https://chessrise.ru" }],
    access: "public",
    accent: "teal",
  },
  {
    slug: "pioner",
    index: "05",
    title: "Сайт ТРЦ «Пионер»",
    shortTitle: "Business platform",
    category: ["Web"],
    status: "Public preview / in development",
    role: "Продуктовая разработка нового сайта",
    summary: "Новый цифровой вход в торговый центр: арендаторы, события, карта этажей и основные посетительские сценарии.",
    task: "Заменить устаревший сайт современным, быстрым и удобным сервисом, который работает с реальным брендом, контентом и внутренним заказчиком.",
    stack: ["Next.js", "React", "TypeScript", "Vercel", "Responsive UI"],
    decisions: [
      { title: "Навигация от задачи", text: "Магазины, рестораны, развлечения, услуги и карта разделены по реальным намерениям посетителя." },
      { title: "Настоящий контент", text: "Интерфейс строится вокруг бренда, фотографий объекта, арендаторов, афиши, новостей и акций." },
      { title: "Честная граница", text: "До аудита исходников кейс не заявляет неподтвержденные CMS, базу, RBAC или CI." },
    ],
    results: ["Публичный Vercel preview", "Каталоги и страницы арендаторов", "Карта этажей, поиск и афиша", "Полноценная mobile-навигация"],
    evidence: [
      { label: "Context", value: "Real business" },
      { label: "Surface", value: "Public preview" },
      { label: "Routes", value: "Stores / map / events" },
    ],
    limitations: ["Проект еще развивается на отдельном рабочем компьютере.", "Технический раздел будет расширен после отдельного аудита исходников."],
    links: [{ label: "Открыть preview", href: "https://pioner-site.vercel.app/" }],
    access: "public",
    accent: "red",
  },
  {
    slug: "infrastructure-inventory",
    index: "06",
    title: "Система учета ИТ-инфраструктуры",
    shortTitle: "Secure desktop tooling",
    category: ["Desktop", "Automation", "Infrastructure"],
    status: "Anonymized Windows demo",
    role: "Desktop-разработка, безопасность и QA",
    summary: "Корпоративный desktop-инструмент для инвентаризации, сверки и администрирования оборудования без раскрытия рабочей сети.",
    task: "Собрать единое рабочее место для учета инфраструктуры и одновременно подготовить безопасную демонстрационную версию, полностью отделенную от рабочих данных.",
    stack: ["Electron", "React", "TypeScript", "SQLite", "Zod", "IPC", "Vitest", "NSIS"],
    decisions: [
      { title: "Изоляция renderer", text: "contextIsolation, отключенный nodeIntegration и узкий typed IPC ограничивают поверхность Electron-приложения." },
      { title: "Отдельная демо-версия", text: "Публичная сборка использует синтетические данные и не содержит рабочих скриптов, ключей или подключения к сети." },
      { title: "Desktop QA", text: "Проверяются первый запуск, ошибки входа, поиск, повторный запуск, минимальное окно и упакованный EXE." },
    ],
    results: ["8 unit и 17 integration тестов", "4 Electron E2E", "Проверенный NSIS installer", "Safety scan публичной сборки"],
    evidence: [
      { label: "Tests", value: "25 unit/integration" },
      { label: "E2E", value: "4 desktop flows" },
      { label: "Package", value: "NSIS demo" },
    ],
    limitations: ["Рабочая база, документы, адреса и сведения о сети исключены.", "Нет code signing, auto-update и crash reporting."],
    access: "private",
    accent: "graphite",
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function filterProjects(category: (typeof projectCategories)[number]) {
  return category === "Все" ? projects : projects.filter((project) => project.category.includes(category));
}
