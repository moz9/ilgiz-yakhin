import { ArrowDown, ArrowRight, CheckCircle2, Download, Mail } from "lucide-react";
import Link from "next/link";
import { HouseScene } from "@/components/house-scene";
import { projects } from "@/lib/projects";

export default function Home() {
  return (
    <>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span>01 / PORTFOLIO</span><span>Барнаул · удаленно</span></div>
            <h1 id="hero-title">ILGIZ<br /><span>YAKHIN</span></h1>
            <p className="hero-role">Full-stack / AI-разработчик</p>
            <p className="hero-summary">Проектирую, разрабатываю и довожу до production web-, desktop- и automation-решения. AI ускоряет цикл, инженерная проверка отвечает за результат.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/projects">Смотреть проекты <ArrowRight aria-hidden="true" /></Link>
              <a className="button button-ghost" href="/resume/ilgiz-yakhin-compact.pdf" download>Резюме <Download aria-hidden="true" /></a>
            </div>
          </div>
          <HouseScene />
          <a className="scroll-cue" href="#selected"><ArrowDown aria-hidden="true" /> Основные кейсы</a>
        </section>

        <section className="section selected-projects" id="selected">
          <header className="section-heading">
            <div><span className="section-number">02</span><p className="kicker">Selected work</p></div>
            <h2>Не набор технологий.<br />Работающие системы.</h2>
            <p>Каждый кейс показывает задачу, решения, ограничения и то, чем подтвержден результат.</p>
          </header>
          <div className="featured-grid">
            {projects.slice(0, 4).map((project) => (
              <article className={`featured-project accent-${project.accent}`} key={project.slug}>
                <div className="featured-visual" aria-hidden="true">
                  <span>{project.index}</span>
                  <div className="visual-window"><i /><i /><i /><div>{project.evidence.map((item) => <b key={item.label}>{item.value}</b>)}</div></div>
                </div>
                <div className="featured-copy">
                  <div className="project-meta"><span>{project.shortTitle}</span><span>{project.category.join(" / ")}</span></div>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <Link href={`/projects/${project.slug}`}>Разобрать кейс <ArrowRight aria-hidden="true" /></Link>
                </div>
              </article>
            ))}
          </div>
          <Link className="text-link" href="/projects">Все 6 проектов <ArrowRight aria-hidden="true" /></Link>
        </section>

        <section className="section approach-section">
          <header className="section-heading compact-heading">
            <div><span className="section-number">03</span><p className="kicker">Engineering approach</p></div>
            <h2>AI-assisted.<br />Human-verified.</h2>
          </header>
          <div className="approach-grid">
            {[
              ["01", "Контекст", "Сначала восстанавливаю ограничения, данные и реальный пользовательский сценарий."],
              ["02", "Реализация", "Использую Codex, Cursor и CLI-инструменты для декомпозиции, кода и анализа."],
              ["03", "Проверка", "Review diff, типизация, тесты, browser/E2E и production smoke обязательны."],
              ["04", "Эксплуатация", "Health checks, наблюдаемость, backup и rollback проектируются вместе с релизом."],
            ].map(([index, title, text]) => (
              <article key={index}><span>{index}</span><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </section>

        <section className="section proof-section">
          <div className="proof-copy">
            <p className="kicker">Current focus</p>
            <h2>Продукт, код и инфраструктура — один контур ответственности.</h2>
            <p>Сильнее всего работаю на стыке интерфейсов, интеграций, внутренних инструментов и production-поддержки.</p>
            <ul className="check-list">
              <li><CheckCircle2 aria-hidden="true" /> Next.js / React / TypeScript</li>
              <li><CheckCircle2 aria-hidden="true" /> Python / FastAPI / PHP</li>
              <li><CheckCircle2 aria-hidden="true" /> PostgreSQL / Supabase / SQLite</li>
              <li><CheckCircle2 aria-hidden="true" /> Git / CI / Docker / Linux / Vercel</li>
            </ul>
          </div>
          <div className="contact-panel">
            <span>OPEN TO REMOTE WORK</span>
            <h2>Есть задача, где нужно не только написать код, но и довести результат?</h2>
            <a href="mailto:im@angelius.ru"><Mail aria-hidden="true" /> im@angelius.ru</a>
          </div>
        </section>
      </main>
    </>
  );
}
