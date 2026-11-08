import Link from "next/link";
import { ArrowUpRight, Download, FileText, Mail } from "lucide-react";
import { CaseNavigation } from "@/components/case-navigation";
import { RevealSection } from "@/components/reveal-section";
import { ContactBlock } from "@/components/contact-block";

const experience = [
  {
    period: "Сентябрь 2023 — сейчас",
    company: "Коммерческая организация",
    role: "Специалист по ИТ",
    summary: "Поддержка инфраструктуры и бизнес-систем, автоматизация повторяющихся операций, разработка внутренних инструментов и web-продуктов.",
    points: [
      "Windows Server, Active Directory, 1С, рабочие станции и резервное копирование",
      "MikroTik/OpenWrt, VPN, маршрутизация, диагностика и контролируемые изменения",
      "Python, PowerShell и PHP для отчетности, интеграций, API и обработки данных",
    ],
  },
  {
    period: "Апрель — сентябрь 2023",
    company: "АО «ГК Северавтодор», филиал №4",
    role: "Инженер по радионавигации, радиолокации и связи II категории",
    summary: "Эксплуатация систем ГЛОНАСС, локальной сети, рабочих мест, серверов Windows/FreeBSD и сетевого оборудования.",
    points: [
      "Диагностика аппаратных и программных неисправностей",
      "Администрирование рабочих мест, серверов и интернет-доступа",
      "Сопровождение сетевого оборудования и систем видеонаблюдения",
    ],
  },
];

const capabilities = [
  { title: "Web / Backend", description: "Интерфейсы, API, формы, роли, аутентификация, административные сценарии и интеграции.", stack: ["Next.js", "React", "TypeScript", "PHP/CMS", "Python", "FastAPI", "REST API"] },
  { title: "Data / Desktop", description: "Хранение и обработка данных, локальные Windows-инструменты, импорт, сверка и отчетность.", stack: ["PostgreSQL", "Supabase", "MySQL/MariaDB", "SQLite/SQLCipher", "Electron", "Windows EXE"] },
  { title: "Infrastructure / Delivery", description: "Запуск, наблюдаемость и восстановление: от серверов и сетей до воспроизводимого релиза.", stack: ["Windows Server", "Active Directory", "Linux", "Nginx", "systemd", "Docker", "GitHub Actions"] },
  { title: "Mobile / AI workflow", description: "Android и Android TV, а также AI-assisted разработка с обязательными review и проверкой результата.", stack: ["Kotlin", "Jetpack Compose", "Android TV", "Codex", "Codex CLI", "Cursor", "Gemini CLI"] },
];

const practice = [
  { label: "Коммерческий сайт", title: "Сайт от интерфейса до production", text: "Next.js, заявки, Supabase PostgreSQL с RLS, Telegram/PDF, SEO, VDS, health checks и rollback.", href: "/projects/chessrise" },
  { label: "Автоматизация", title: "От выгрузки к проверяемому отчету", text: "React/TypeScript и FastAPI: импорт данных, строгие контракты, вычисления, Excel-экспорт и Windows EXE.", href: "/projects/worktime-reporting" },
  { label: "Защищённый desktop", title: "Инструмент учета инфраструктуры", text: "Electron, typed IPC, зашифрованная SQLite, роли, синтетическое демо, desktop E2E и NSIS-пакет.", href: "/projects/infrastructure-inventory" },
  { label: "Full-stack платформа", title: "Контент и редакторский workflow", text: "PostgreSQL, роли, audit log, optimistic locking, CI, миграции, backup и synthetic restore drill.", href: "/projects/revalib" },
];

const approach = [
  ["Диагностика", "Фиксирую исходное состояние и отделяю симптом от причины."],
  ["Изменение", "Работаю небольшими шагами с резервной копией и планом отката."],
  ["Проверка", "Использую типизацию, тесты, браузерные сценарии и production smoke."],
  ["Документация", "Оставляю инструкции, evidence и воспроизводимую процедуру сопровождения."],
];

const navSections = [
  { id: "profile", label: "Профиль" },
  { id: "experience", label: "Опыт" },
  { id: "skills", label: "Компетенции" },
  { id: "practice", label: "Практика" },
  { id: "method", label: "Подход" },
];

export function ResumeStory() {
  return <main className="page resume">
    <header className="page-head resume-head">
      <div className="page-lights" aria-hidden="true"><i /><i /></div>
      <div className="resume-head-copy">
        <p className="hero-status"><i aria-hidden="true" />Ильгиз Раильевич Яхин, открыт к удалённой работе</p>
        <h1 id="resume-title">Full-stack и AI-разработчик</h1>
        <p>ИТ-инженер с более чем тремя годами коммерческого опыта в инфраструктуре, автоматизации и разработке внутренних инструментов.</p>
        <div className="resume-actions">
          <a className="button button-primary" href="mailto:im@angelius.ru" data-lg="button" data-lg-variant="prominent"><Mail aria-hidden="true" /><span>Написать</span></a>
          <a className="button" href="/resume/ilgiz-yakhin-compact.pdf" download data-lg="button"><Download aria-hidden="true" /><span>Скачать PDF</span></a>
        </div>
      </div>
      <aside className="resume-card" data-lg="surface" aria-label="Коротко">
        <dl>
          <div><dt>Локация</dt><dd>Барнаул</dd></div>
          <div><dt>Формат</dt><dd>Удалённо</dd></div>
          <div><dt>В ИТ</dt><dd>с 2023 года</dd></div>
          <div><dt>Кейсов</dt><dd>14</dd></div>
        </dl>
      </aside>
    </header>

    <CaseNavigation sections={navSections} label="Разделы резюме" />

    <RevealSection>
      <section className="page-section resume-profile" id="profile">
        <h2 className="page-section-title">Разработка с опытом реальной эксплуатации</h2>
        <div className="about-columns">
          <p className="statement">Разрабатываю web-интерфейсы и API, автоматизирую обработку данных, создаю desktop-инструменты и сопровождаю системы после запуска.</p>
          <div className="resume-profile-detail">
            <p>Практика администрирования научила меня смотреть на код как на часть работающей системы: с пользователями, данными, сбоями, обновлениями и ответственностью за результат.</p>
            <p>AI-инструменты использую для исследования, декомпозиции и реализации. Итог проверяю типизацией, тестами, браузерными сценариями, логами и production smoke.</p>
            <a className="text-link" href="mailto:im@angelius.ru">im@angelius.ru <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </div>
      </section>
    </RevealSection>

    <RevealSection>
      <section className="page-section" id="experience">
        <h2 className="page-section-title">Коммерческая практика</h2>
        <ol className="timeline">
          {experience.map((item) => <li key={item.period}>
            <span className="timeline-period">{item.period}</span>
            <div className="timeline-body">
              <p className="timeline-company">{item.company}</p>
              <h3>{item.role}</h3>
              <p>{item.summary}</p>
              <ul>{item.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </div>
          </li>)}
        </ol>
      </section>
    </RevealSection>

    <RevealSection>
      <section className="page-section" id="skills">
        <h2 className="page-section-title">Стек по рабочим задачам</h2>
        <div className="skill-grid">
          {capabilities.map((item) => <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <ul className="chips">{item.stack.map((technology) => <li key={technology}>{technology}</li>)}</ul>
          </article>)}
        </div>
      </section>
    </RevealSection>

    <RevealSection>
      <section className="page-section" id="practice">
        <h2 className="page-section-title">Задачи, которые можно проверить</h2>
        <div className="resume-practice">
          {practice.map((item) => <Link key={item.href} href={item.href} className="resume-practice-item">
            <span>{item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <ArrowUpRight aria-hidden="true" />
          </Link>)}
        </div>
      </section>
    </RevealSection>

    <RevealSection>
      <section className="page-section" id="method">
        <h2 className="page-section-title">Как довожу изменения до рабочего состояния</h2>
        <ol className="resume-method">
          {approach.map(([title, text], index) => <li key={title}><span aria-hidden="true">{index + 1}</span><h3>{title}</h3><p>{text}</p></li>)}
        </ol>
      </section>
    </RevealSection>

    <RevealSection>
      <section className="page-section resume-education" id="education">
        <div>
          <span>2026, бакалавр</span>
          <h2>Казанский государственный энергетический университет</h2>
          <p>Автоматизация технологических процессов и производств (по отраслям), инженер.</p>
        </div>
        <dl>
          <div><dt>Языки</dt><dd>Русский — родной<br />Английский — A2 / Pre-Intermediate</dd></div>
          <div><dt>Дополнительное обучение</dt><dd>Сетевое администрирование, 72 ч.<br />Веб-дизайн и мультимедиа</dd></div>
          <div><dt>AI и IDE</dt><dd>Codex, Codex CLI, Cursor, Gemini CLI, VS Code, Antigravity, OpenClaw</dd></div>
        </dl>
      </section>
    </RevealSection>

    <RevealSection>
      <section className="page-section" aria-labelledby="documents-title">
        <h2 className="page-section-title" id="documents-title">PDF-версии</h2>
        <div className="resume-docs">
          <a href="/resume/ilgiz-yakhin-compact.pdf" download><FileText aria-hidden="true" /><span><strong>Компактное резюме</strong><small>1 страница</small></span><Download aria-hidden="true" /></a>
          <a href="/resume/ilgiz-yakhin-extended.pdf" download><FileText aria-hidden="true" /><span><strong>Расширенное резюме</strong><small>2 страницы</small></span><Download aria-hidden="true" /></a>
        </div>
      </section>
    </RevealSection>
    <ContactBlock title="Обсудим работу?" />
  </main>;
}
