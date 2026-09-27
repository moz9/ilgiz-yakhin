"use client";

import {
  ArrowDown,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Download,
  FileText,
  GraduationCap,
  Mail,
} from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function useHydratedReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
}

const experience = [
  {
    period: "СЕНТЯБРЬ 2023 — СЕЙЧАС",
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
    period: "АПРЕЛЬ — СЕНТЯБРЬ 2023",
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
  {
    index: "01",
    title: "Web / Backend",
    description: "Интерфейсы, API, формы, роли, аутентификация, административные сценарии и интеграции.",
    stack: ["Next.js", "React", "TypeScript", "PHP/CMS", "Python", "FastAPI", "REST API"],
  },
  {
    index: "02",
    title: "Data / Desktop",
    description: "Хранение и обработка данных, локальные Windows-инструменты, импорт, сверка и отчетность.",
    stack: ["PostgreSQL", "Supabase", "MySQL/MariaDB", "SQLite/SQLCipher", "Electron", "Windows EXE"],
  },
  {
    index: "03",
    title: "Infrastructure / Delivery",
    description: "Запуск, наблюдаемость и восстановление: от серверов и сетей до воспроизводимого релиза.",
    stack: ["Windows Server", "Active Directory", "Linux", "Nginx", "systemd", "Docker", "GitHub Actions"],
  },
  {
    index: "04",
    title: "Mobile / AI workflow",
    description: "Android и Android TV, а также AI-assisted разработка с обязательными review и проверкой результата.",
    stack: ["Kotlin", "Jetpack Compose", "Android TV", "Codex", "Codex CLI", "Cursor", "Gemini CLI"],
  },
];

const practice = [
  {
    label: "COMMERCIAL WEB",
    title: "Сайт от интерфейса до production",
    text: "Next.js, заявки, Supabase PostgreSQL с RLS, Telegram/PDF, SEO, VDS, health checks и rollback.",
    href: "/projects/chessrise",
  },
  {
    label: "AUTOMATION",
    title: "От выгрузки к проверяемому отчету",
    text: "React/TypeScript и FastAPI: импорт данных, строгие контракты, вычисления, Excel-экспорт и Windows EXE.",
    href: "/projects/worktime-reporting",
  },
  {
    label: "SECURE DESKTOP",
    title: "Инструмент учета инфраструктуры",
    text: "Electron, typed IPC, зашифрованная SQLite, роли, синтетическое демо, desktop E2E и NSIS-пакет.",
    href: "/projects/infrastructure-inventory",
  },
  {
    label: "FULL-STACK PLATFORM",
    title: "Контент и редакторский workflow",
    text: "PostgreSQL, роли, audit log, optimistic locking, CI, миграции, backup и synthetic restore drill.",
    href: "/projects/revalib",
  },
];

const approach = [
  ["01", "Диагностика", "Фиксирую исходное состояние и отделяю симптом от причины."],
  ["02", "Изменение", "Работаю небольшими шагами с резервной копией и планом отката."],
  ["03", "Проверка", "Использую типизацию, тесты, браузерные сценарии и production smoke."],
  ["04", "Документация", "Оставляю инструкции, evidence и воспроизводимую процедуру сопровождения."],
];

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduceMotion = useHydratedReducedMotion();

  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduceMotion ? undefined : { opacity: [0.45, 1], y: [28, 0] }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ResumeStory() {
  const reduceMotion = useHydratedReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 30, restDelta: 0.001 });

  return (
    <main className="resume-page">
      <motion.div className="resume-scroll-progress" style={{ scaleX: reduceMotion ? 1 : progress }} aria-hidden="true" />

      <section className="resume-cover" aria-labelledby="resume-title">
        <div className="resume-cover-grid" aria-hidden="true"><i /><i /><i /></div>
        <div className="resume-cover-top"><span>ONLINE RESUME / 2026</span><span>FULL-STACK · AUTOMATION · INFRASTRUCTURE</span></div>
        <motion.div
          className="resume-cover-copy"
          initial={false}
          animate={reduceMotion ? undefined : { opacity: [0.5, 1], y: [22, 0] }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="resume-overline">Ильгиз Раильевич Яхин</p>
          <h1 id="resume-title">Full-stack /<br /><span>AI-разработчик</span></h1>
          <p className="resume-cover-lead">ИТ-инженер с более чем тремя годами коммерческого опыта в инфраструктуре, автоматизации и разработке внутренних инструментов.</p>
          <div className="resume-cover-meta"><span>Web</span><span>Desktop</span><span>Automation</span><span>Infrastructure</span></div>
        </motion.div>
        <a className="resume-scroll-cue" href="#profile"><ArrowDown aria-hidden="true" /><span>Смотреть резюме</span></a>
      </section>

      <section className="section resume-profile" id="profile">
        <Reveal className="resume-section-heading">
          <span>01 / ПРОФИЛЬ</span>
          <h2>Разработка с опытом реальной эксплуатации</h2>
        </Reveal>
        <div className="resume-profile-grid">
          <Reveal className="resume-profile-lead">
            <p>Разрабатываю web-интерфейсы и API, автоматизирую обработку данных, создаю desktop-инструменты и сопровождаю системы после запуска.</p>
          </Reveal>
          <Reveal className="resume-profile-detail">
            <p>Практика администрирования научила меня смотреть на код как на часть работающей системы: с пользователями, данными, сбоями, обновлениями и ответственностью за результат.</p>
            <p>AI-инструменты использую для исследования, декомпозиции и реализации. Итог проверяю типизацией, тестами, браузерными сценариями, логами и production smoke.</p>
            <a href="mailto:im@angelius.ru"><Mail aria-hidden="true" /> im@angelius.ru</a>
          </Reveal>
        </div>
      </section>

      <section className="resume-band resume-experience" id="experience">
        <div className="section resume-band-inner">
          <Reveal className="resume-section-heading resume-section-heading-light">
            <span>02 / ОПЫТ</span>
            <h2>Коммерческая практика</h2>
          </Reveal>
          <div className="resume-timeline">
            {experience.map((item, index) => (
              <motion.article
                key={item.period}
                initial={false}
                whileInView={reduceMotion ? undefined : { opacity: [0.35, 1], x: [index % 2 === 0 ? 30 : -30, 0] }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="resume-timeline-marker"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
                <div className="resume-timeline-period">{item.period}</div>
                <div className="resume-timeline-content">
                  <p>{item.company}</p>
                  <h3>{item.role}</h3>
                  <p>{item.summary}</p>
                  <ul>{item.points.map((point) => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section resume-skills" id="skills">
        <Reveal className="resume-section-heading">
          <span>03 / КОМПЕТЕНЦИИ</span>
          <h2>Стек сгруппирован по рабочим задачам</h2>
        </Reveal>
        <div className="resume-capabilities">
          {capabilities.map((item, index) => (
            <motion.article
              key={item.title}
              initial={false}
              whileInView={reduceMotion ? undefined : { opacity: [0.4, 1], y: [24, 0] }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.62, delay: reduceMotion ? 0 : index * 0.06 }}
            >
              <span>{item.index}</span>
              <div><h3>{item.title}</h3><p>{item.description}</p></div>
              <ul>{item.stack.map((technology) => <li key={technology}>{technology}</li>)}</ul>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="resume-practice" id="practice">
        <div className="section resume-practice-inner">
          <Reveal className="resume-section-heading">
            <span>04 / ПРАКТИКА</span>
            <h2>Задачи, которые можно проверить</h2>
          </Reveal>
          <div className="resume-practice-list">
            {practice.map((item, index) => (
              <motion.article
                key={item.href}
                initial={false}
                whileInView={reduceMotion ? undefined : { opacity: [0.35, 1], y: [26, 0] }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.05 }}
              >
                <span>{item.label}</span>
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
                <Link href={item.href} aria-label={`Открыть кейс: ${item.title}`}><ArrowUpRight aria-hidden="true" /></Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="section resume-method" id="method">
        <Reveal className="resume-section-heading">
          <span>05 / ПОДХОД</span>
          <h2>Как довожу изменения до рабочего состояния</h2>
        </Reveal>
        <div className="resume-method-grid">
          {approach.map(([number, title, text], index) => (
            <motion.article
              key={number}
              initial={false}
              whileInView={reduceMotion ? undefined : { opacity: [0.35, 1], y: [32, 0] }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.08 }}
            >
              <span>{number}</span><h3>{title}</h3><p>{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="resume-education-band" id="education">
        <div className="section resume-education-grid">
          <Reveal className="resume-education-main">
            <GraduationCap aria-hidden="true" />
            <p>2026 · БАКАЛАВР</p>
            <h2>Казанский государственный энергетический университет</h2>
            <p>Автоматизация технологических процессов и производств (по отраслям), инженер.</p>
          </Reveal>
          <Reveal className="resume-education-side">
            <div><span>ЯЗЫКИ</span><strong>Русский — родной<br />Английский — A2 / Pre-Intermediate</strong></div>
            <div><span>ДОПОЛНИТЕЛЬНОЕ ОБУЧЕНИЕ</span><strong>Сетевое администрирование, 72 ч.<br />Веб-дизайн и мультимедиа</strong></div>
            <div><span>AI / IDE</span><strong>Codex · Codex CLI · Cursor · Gemini CLI · VS Code · Antigravity · OpenClaw</strong></div>
          </Reveal>
        </div>
      </section>

      <section className="section resume-contact-panel">
        <Reveal className="resume-contact-copy">
          <p>КОНТАКТ</p><h2>Обсудить работу</h2><a href="mailto:im@angelius.ru">im@angelius.ru <ArrowUpRight aria-hidden="true" /></a>
        </Reveal>
        <BriefcaseBusiness aria-hidden="true" />
      </section>

      <section className="section resume-documents" aria-labelledby="documents-title">
        <Reveal className="resume-section-heading resume-documents-heading">
          <span>ДОКУМЕНТЫ</span>
          <div><h2 id="documents-title">PDF-версии</h2><p>Для отправки и печати. Основное содержание уже представлено выше.</p></div>
        </Reveal>
        <div className="resume-document-list">
          <article><FileText aria-hidden="true" /><div><span>01 · 1 СТРАНИЦА</span><h3>Компактное резюме</h3></div><a href="/resume/ilgiz-yakhin-compact.pdf" download><Download aria-hidden="true" /><span>Скачать PDF</span></a></article>
          <article><FileText aria-hidden="true" /><div><span>02 · 2 СТРАНИЦЫ</span><h3>Расширенное резюме</h3></div><a href="/resume/ilgiz-yakhin-extended.pdf" download><Download aria-hidden="true" /><span>Скачать PDF</span></a></article>
        </div>
      </section>
    </main>
  );
}
