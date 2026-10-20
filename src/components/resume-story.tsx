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
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { CaseNavigation } from "@/components/case-navigation";
import { GlassLayer } from "@/components/glass-layer";

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

const headline = ["Full-stack /", "AI-разработчик"];

const stats = [
  { value: "3+", label: "года коммерческой практики" },
  { value: "14", label: "кейсов в портфолио" },
  { value: "6", label: "направлений: web, desktop, mobile, automation, infra, AI" },
];

const navSections = [
  { id: "profile", label: "Профиль" },
  { id: "experience", label: "Опыт" },
  { id: "skills", label: "Компетенции" },
  { id: "practice", label: "Практика" },
  { id: "method", label: "Подход" },
];

/** Nearest entry to the viewport centre — the travelling focus of the timeline. */
function useFocusIndex(selector: string) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const items = Array.from(document.querySelectorAll<HTMLElement>(selector));
      if (!items.length) return;
      const middle = window.innerHeight / 2;
      let best = 0;
      let distance = Infinity;
      items.forEach((item, position) => {
        const rect = item.getBoundingClientRect();
        const gap = Math.abs(rect.top + rect.height / 2 - middle);
        if (gap < distance) { distance = gap; best = position; }
      });
      setIndex(best);
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, [selector]);
  return index;
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useHydratedReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduceMotion ? undefined : { opacity: [0.45, 1], y: [28, 0] }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function ResumeStory() {
  const reduceMotion = useHydratedReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const focusIndex = useFocusIndex("[data-rg-timeline]");
  const methodIndex = useFocusIndex("[data-rg-method]");

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 30, restDelta: 0.001 });

  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const { scrollYProgress: timelineProgress } = useScroll({ target: timelineRef, offset: ["start 78%", "end 65%"] });
  const heroCopyY = useTransform(heroProgress, [0, 1], [0, 140]);
  const heroCardY = useTransform(heroProgress, [0, 1], [0, -90]);
  const heroFade = useTransform(heroProgress, [0, 0.8], [1, 0]);

  // Pointer light for the glass card: a restrained specular response, not a lens.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(50);
  const springTiltX = useSpring(tiltX, { stiffness: 140, damping: 22, mass: 0.6 });
  const springTiltY = useSpring(tiltY, { stiffness: 140, damping: 22, mass: 0.6 });

  const handleCardMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    tiltY.set((x - 0.5) * 8);
    tiltX.set((0.5 - y) * 8);
    sheenX.set(x * 100);
    sheenY.set(y * 100);
  }, [reduceMotion, tiltX, tiltY, sheenX, sheenY]);

  const handleCardLeave = useCallback(() => {
    tiltX.set(0);
    tiltY.set(0);
    sheenX.set(50);
    sheenY.set(50);
  }, [tiltX, tiltY, sheenX, sheenY]);

  const handleSkillsMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--rg-spot-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--rg-spot-y", `${event.clientY - rect.top}px`);
  }, []);

  return (
    <main className="resume-page rg-page">
      <motion.div className="resume-scroll-progress" style={{ scaleX: reduceMotion ? 1 : progress }} aria-hidden="true" />

      <section className="rg-hero" ref={heroRef} aria-labelledby="resume-title">
        <div className="rg-aurora" aria-hidden="true">
          <i /><i /><i /><i />
          <span className="rg-aurora-grid" />
          <span className="rg-aurora-vignette" />
        </div>

        <motion.div className="rg-hero-inner" style={reduceMotion ? undefined : { y: heroCopyY }}>
          <div className="rg-hero-copy">
            <motion.div className="rg-hero-lead" style={reduceMotion ? undefined : { opacity: heroFade }}>
            <p className="rg-overline"><Sparkles aria-hidden="true" /> Ильгиз Раильевич Яхин</p>
            <h1 id="resume-title">
              {headline.map((line) => (
                <span className="rg-line" key={line}>
                  <motion.span
                    initial={reduceMotion ? false : { y: "112%" }}
                    animate={reduceMotion ? undefined : { y: "0%" }}
                    transition={{ duration: 0.95, delay: 0.12 + headline.indexOf(line) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <p className="rg-lead">ИТ-инженер с более чем тремя годами коммерческого опыта в инфраструктуре, автоматизации и разработке внутренних инструментов.</p>
            </motion.div>
            <div className="rg-hero-actions">
              <a className="rg-action rg-action-primary" href="mailto:im@angelius.ru"><Mail aria-hidden="true" /> Написать</a>
              <a className="rg-action liquid-surface" href="/resume/ilgiz-yakhin-compact.pdf" download><GlassLayer /><Download aria-hidden="true" /><span>Скачать PDF</span></a>
            </div>
          </div>

          <motion.aside
            className="rg-card liquid-surface"
            style={reduceMotion ? undefined : { y: heroCardY, rotateX: springTiltX, rotateY: springTiltY, transformPerspective: 1200 }}
            onPointerMove={handleCardMove}
            onPointerLeave={handleCardLeave}
          >
            <GlassLayer />
            <span className="rg-card-sheen" aria-hidden="true" style={{ "--rg-sheen-x": `${sheenX.get()}%`, "--rg-sheen-y": `${sheenY.get()}%` } as CSSProperties} />
            <div className="rg-card-mark">
              <span className="rg-card-monogram" aria-hidden="true">IY</span>
              <span className="rg-card-status"><i aria-hidden="true" />Открыт к удалённой работе</span>
            </div>
            <div className="rg-card-body">
              <p className="rg-card-kicker">RESUME / 2026</p>
              <h2>Ильгиз Яхин</h2>
              <p className="rg-card-role">Специалист по ИТ · full-stack / AI-разработчик</p>
              <ul className="rg-card-rows">
                <li><MapPin aria-hidden="true" /><span>Локация</span><strong>Барнаул</strong></li>
                <li><BriefcaseBusiness aria-hidden="true" /><span>Опыт</span><strong>с 2023</strong></li>
                <li><Check aria-hidden="true" /><span>Формат</span><strong>Удалённо</strong></li>
              </ul>
            </div>
          </motion.aside>
        </motion.div>

        <motion.div className="rg-hero-stats" style={reduceMotion ? undefined : { y: heroCardY }} aria-label="Ключевые факты">
          {stats.map((item) => (
            <div className="rg-stat liquid-surface" key={item.label}>
              <GlassLayer />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
          <a className="rg-scroll-cue liquid-surface" href="#profile">
            <GlassLayer />
            <ArrowDown aria-hidden="true" /><span>Смотреть резюме</span>
          </a>
        </motion.div>
      </section>

      <CaseNavigation sections={navSections} label="Разделы резюме" />

      <section className="rg-section rg-profile" id="profile">
        <Reveal className="rg-section-heading">
          <span>01 / ПРОФИЛЬ</span>
          <h2>Разработка с опытом реальной эксплуатации</h2>
        </Reveal>
        <div className="rg-profile-grid">
          <Reveal className="rg-profile-lead">
            <p>Разрабатываю web-интерфейсы и API, автоматизирую обработку данных, создаю desktop-инструменты и сопровождаю системы после запуска.</p>
          </Reveal>
          <Reveal className="rg-profile-detail" delay={0.08}>
            <p>Практика администрирования научила меня смотреть на код как на часть работающей системы: с пользователями, данными, сбоями, обновлениями и ответственностью за результат.</p>
            <p>AI-инструменты использую для исследования, декомпозиции и реализации. Итог проверяю типизацией, тестами, браузерными сценариями, логами и production smoke.</p>
            <a href="mailto:im@angelius.ru"><Mail aria-hidden="true" /> im@angelius.ru</a>
          </Reveal>
        </div>
      </section>

      <section className="rg-band rg-experience" id="experience">
        <div className="rg-section rg-band-inner">
          <Reveal className="rg-section-heading rg-heading-light">
            <span>02 / ОПЫТ</span>
            <h2>Коммерческая практика</h2>
          </Reveal>
          <div className="rg-timeline" ref={timelineRef}>
            <span className="rg-timeline-rail" aria-hidden="true"><motion.i style={reduceMotion ? undefined : { scaleY: timelineProgress }} /></span>
            {experience.map((item, index) => (
              <motion.article
                className="rg-timeline-item"
                data-rg-timeline
                key={item.period}
                initial={false}
                whileInView={reduceMotion ? undefined : { opacity: [0.35, 1], x: [index % 2 === 0 ? 30 : -30, 0] }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rg-timeline-marker">
                  <span className="rg-timeline-node">
                    {focusIndex === index && !reduceMotion && <motion.i layoutId="rg-timeline-focus" transition={{ type: "spring", stiffness: 320, damping: 28 }} />}
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="rg-timeline-period">{item.period}</div>
                <div className="rg-timeline-content">
                  <p className="rg-timeline-company">{item.company}</p>
                  <h3>{item.role}</h3>
                  <p>{item.summary}</p>
                  <ul>{item.points.map((point) => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="rg-section rg-skills" id="skills">
        <Reveal className="rg-section-heading">
          <span>03 / КОМПЕТЕНЦИИ</span>
          <h2>Стек сгруппирован по рабочим задачам</h2>
        </Reveal>
        <div className="rg-capabilities" ref={skillsRef} onPointerMove={handleSkillsMove}>
          {capabilities.map((item, index) => (
            <motion.article
              className="rg-capability"
              key={item.title}
              initial={false}
              whileInView={reduceMotion ? undefined : { opacity: [0.4, 1], y: [24, 0] }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.62, delay: reduceMotion ? 0 : index * 0.06 }}
            >
              <span className="rg-capability-index">{item.index}</span>
              <div className="rg-capability-copy">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <ul>{item.stack.map((technology) => <li key={technology}>{technology}</li>)}</ul>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="rg-practice" id="practice">
        <div className="rg-section rg-practice-inner">
          <Reveal className="rg-section-heading">
            <span>04 / ПРАКТИКА</span>
            <h2>Задачи, которые можно проверить</h2>
          </Reveal>
          <div className="rg-practice-list">
            {practice.map((item, index) => (
              <motion.article
                className="rg-practice-item"
                key={item.href}
                initial={false}
                whileInView={reduceMotion ? undefined : { opacity: [0.35, 1], y: [26, 0] }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.05 }}
              >
                <span className="rg-practice-label">{item.label}</span>
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
                <Link href={item.href} aria-label={`Открыть кейс: ${item.title}`}><ArrowUpRight aria-hidden="true" /></Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="rg-section rg-method" id="method">
        <Reveal className="rg-section-heading">
          <span>05 / ПОДХОД</span>
          <h2>Как довожу изменения до рабочего состояния</h2>
        </Reveal>
        <div className="rg-method-grid">
          {approach.map(([number, title, text], index) => (
            <motion.article
              className="rg-method-step"
              data-rg-method
              key={number}
              initial={false}
              whileInView={reduceMotion ? undefined : { opacity: [0.35, 1], y: [32, 0] }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.08 }}
            >
              <span className="rg-method-node">
                {methodIndex === index && !reduceMotion && <motion.i layoutId="rg-method-focus" transition={{ type: "spring", stiffness: 300, damping: 26 }} />}
                {number}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="rg-education" id="education">
        <div className="rg-section rg-education-grid">
          <Reveal className="rg-education-main">
            <GraduationCap aria-hidden="true" />
            <p>2026 · БАКАЛАВР</p>
            <h2>Казанский государственный энергетический университет</h2>
            <p>Автоматизация технологических процессов и производств (по отраслям), инженер.</p>
          </Reveal>
          <Reveal className="rg-education-side" delay={0.08}>
            <div><span>ЯЗЫКИ</span><strong>Русский — родной<br />Английский — A2 / Pre-Intermediate</strong></div>
            <div><span>ДОПОЛНИТЕЛЬНОЕ ОБУЧЕНИЕ</span><strong>Сетевое администрирование, 72 ч.<br />Веб-дизайн и мультимедиа</strong></div>
            <div><span>AI / IDE</span><strong>Codex · Codex CLI · Cursor · Gemini CLI · VS Code · Antigravity · OpenClaw</strong></div>
          </Reveal>
        </div>
      </section>

      <section className="rg-contact">
        <div className="rg-aurora rg-aurora-contact" aria-hidden="true">
          <i /><i /><i />
          <span className="rg-aurora-vignette" />
        </div>
        <div className="rg-section rg-contact-panel liquid-surface">
          <GlassLayer />
          <div className="rg-contact-copy">
            <p>КОНТАКТ</p>
            <h2>Обсудить работу</h2>
            <a href="mailto:im@angelius.ru">im@angelius.ru <ArrowUpRight aria-hidden="true" /></a>
          </div>
          <div className="rg-contact-actions">
            <a className="rg-action rg-action-primary" href="mailto:im@angelius.ru"><Mail aria-hidden="true" /> Написать</a>
            <a className="rg-action liquid-surface" href="/resume/ilgiz-yakhin-extended.pdf" download><GlassLayer /><Download aria-hidden="true" /><span>Расширенное PDF</span></a>
          </div>
        </div>
      </section>

      <section className="rg-section rg-documents" aria-labelledby="documents-title">
        <Reveal className="rg-section-heading rg-documents-heading">
          <span>ДОКУМЕНТЫ</span>
          <div><h2 id="documents-title">PDF-версии</h2><p>Для отправки и печати. Основное содержание уже представлено выше.</p></div>
        </Reveal>
        <div className="rg-document-list">
          <article><FileText aria-hidden="true" /><div><span>01 · 1 СТРАНИЦА</span><h3>Компактное резюме</h3></div><a href="/resume/ilgiz-yakhin-compact.pdf" download><Download aria-hidden="true" /><span>Скачать PDF</span></a></article>
          <article><FileText aria-hidden="true" /><div><span>02 · 2 СТРАНИЦЫ</span><h3>Расширенное резюме</h3></div><a href="/resume/ilgiz-yakhin-extended.pdf" download><Download aria-hidden="true" /><span>Скачать PDF</span></a></article>
        </div>
      </section>
    </main>
  );
}
