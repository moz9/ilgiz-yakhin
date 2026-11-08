import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RevealSection } from "@/components/reveal-section";
import { ContactBlock } from "@/components/contact-block";

export const metadata: Metadata = { title: "Обо мне", description: "ИТ-инженер и разработчик из Барнаула: web, desktop, автоматизация и инфраструктура." };

const groups = [
  { title: "Web и backend", text: "Интерфейсы, API, роли, формы и интеграции.", items: ["Next.js", "React", "TypeScript", "PHP", "Python", "FastAPI", "REST API"] },
  { title: "Данные и desktop", text: "Хранение, импорт, сверка, отчётность и инструменты для Windows.", items: ["PostgreSQL", "Supabase", "SQLite", "Electron", "WinUI 3", "Windows"] },
  { title: "Запуск и инфраструктура", text: "Сборка, выкладка, наблюдаемость, бэкапы и откат.", items: ["Git", "GitHub Actions", "Docker", "Vercel", "Linux", "Nginx", "Backup и rollback"] },
  { title: "AI в работе", text: "Исследование, декомпозиция и реализация — всегда с review и проверкой.", items: ["Codex", "Codex CLI", "Cursor", "Gemini CLI", "VS Code", "Тесты"] },
];

export default function AboutPage() {
  return <main className="page">
    <header className="page-head">
      <div className="page-lights" aria-hidden="true"><i /><i /></div>
      <h1>Обо мне</h1>
      <p>ИТ-инженер и разработчик из Барнаула. Ищу удалённую команду, где ценят самостоятельность, технический контроль и умение доводить работу до пользователей.</p>
    </header>
    <RevealSection>
      <section className="page-section about-story">
        <p className="statement">Администрирование научило меня смотреть на код как на часть работающей системы: с людьми, данными, сбоями, обновлениями и ответственностью за результат.</p>
        <div className="about-columns">
          <p>Разрабатываю интерфейсы и API, автоматизирую обработку данных, настраиваю хранение, тестирование и выпуск. Мне важно, чтобы продукт не только запустился, но и пережил первое обновление, сбой и смену человека, который его поддерживает.</p>
          <p>AI-инструменты использую для исследования, декомпозиции и реализации. Результат всегда проверяю сам: типизация, тесты, браузерные сценарии, логи и проверка после выкладки.</p>
        </div>
        <div className="about-education">
          <span>2026, бакалавр</span>
          <h2>Казанский государственный энергетический университет</h2>
          <p>Автоматизация технологических процессов и производств, инженер.</p>
        </div>
      </section>
    </RevealSection>
    <RevealSection>
      <section className="page-section" aria-labelledby="skills-title">
        <h2 className="page-section-title" id="skills-title">С чем работаю</h2>
        <div className="skill-grid">
          {groups.map((group) => <article key={group.title}>
            <h3>{group.title}</h3>
            <p>{group.text}</p>
            <ul className="chips">{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>)}
        </div>
        <div className="page-links">
          <Link className="text-link" href="/resume">Резюме <ArrowUpRight aria-hidden="true" /></Link>
          <Link className="text-link" href="/projects">Работы <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </section>
    </RevealSection>
    <ContactBlock />
  </main>;
}
