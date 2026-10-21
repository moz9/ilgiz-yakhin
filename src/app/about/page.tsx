import type { Metadata } from "next";
import Link from "next/link";
import { RevealSection } from "@/components/reveal-section";
import { FieldBackdrop } from "@/components/field-backdrop";

export const metadata: Metadata = { title: "Обо мне" };

const bands = [
  { kicker: "Web / Backend", items: ["Next.js", "React", "TypeScript", "PHP", "Python", "FastAPI", "REST API"] },
  { kicker: "Data / Desktop", items: ["PostgreSQL", "Supabase", "SQLite", "Electron", "Windows", "WinUI"] },
  { kicker: "Delivery / Infrastructure", items: ["Git", "GitHub Actions", "Docker", "Vercel", "Linux", "Nginx", "Backup / Rollback"] },
  { kicker: "AI workflow", items: ["Codex", "Codex CLI", "Cursor", "Gemini CLI", "VS Code", "review", "tests"] },
];

export default function AboutPage() {
  return (
    <main className="inner-page about-page">
      <FieldBackdrop tone="teal" />
      <section className="page-hero">
        <div className="eyebrow"><span>ABOUT</span><span>Ильгиз Яхин</span></div>
        <h1>Обо мне</h1>
        <p>ИТ-инженер и разработчик из Барнаула. Ищу удаленную команду, где важны самостоятельность, технический контроль и умение доводить работу до пользователей.</p>
      </section>
      <RevealSection>
        <section className="section about-grid">
          <aside className="portrait-placeholder" aria-label="Место для будущей фотографии"><span>IY</span></aside>
          <div className="about-story">
            <p className="kicker">Профиль</p>
            <h2>Full-stack разработка и инфраструктура</h2>
            <p className="large-copy">Практика администрирования научила меня смотреть на код как на часть работающей системы: с пользователями, данными, сбоями, обновлениями и ответственностью за результат.</p>
            <p>Разрабатываю интерфейсы и API, автоматизирую обработку данных, настраиваю хранение, тестирование и выпуск. AI-инструменты использую для исследования, декомпозиции и реализации с обязательными review и проверкой.</p>
            <div className="education"><span>2026 · Бакалавр</span><h3>Казанский государственный энергетический университет</h3><p>Автоматизация технологических процессов и производств (по отраслям), инженер.</p></div>
          </div>
        </section>
      </RevealSection>
      <RevealSection>
        <section className="section skill-bands">
          {bands.map((band) => (
            <div key={band.kicker} data-spotlight>
              <p className="kicker">{band.kicker}</p>
              <ul className="skill-chips">{band.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </section>
      </RevealSection>
      <RevealSection>
        <section className="section about-cta"><h2>Резюме</h2><div><Link className="button button-primary" href="/resume">Открыть</Link><Link className="button button-ghost" href="/projects">Проекты</Link></div></section>
      </RevealSection>
    </main>
  );
}
