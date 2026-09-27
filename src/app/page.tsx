import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { AnimatedProjectList } from "@/components/animated-project-list";
import { HeroReel } from "@/components/hero-reel";

const pipeline = [
  ["Интерфейс", "Сценарии, адаптивность, доступность", "Next.js · React · Electron"],
  ["API", "Контракты и валидация входных данных", "Zod · Pydantic · FastAPI"],
  ["Данные", "Миграции, модели и права доступа", "PostgreSQL · SQLite"],
  ["Проверки", "Unit, интеграционные и браузерные тесты", "Vitest · Playwright"],
  ["Релиз", "Сборка, health-check и smoke", "Docker · GitHub Actions"],
  ["Поддержка", "Бэкапы и возврат к прошлой версии", "Restore · Rollback"],
];

export default function Home() {
  return <main className="redesign-home">
    <HeroReel />
    <AnimatedProjectList />
    <section className="redesign-pipeline" id="approach" aria-labelledby="pipeline-title">
      <div className="redesign-pipeline-heading">
        <h2 id="pipeline-title">До production<br />и дальше</h2>
        <p>Разработка не заканчивается на интерфейсе: важны данные, проверки, запуск и возможность восстановить работу.</p>
      </div>
      <div className="redesign-pipeline-rail">
        {pipeline.map(([title, description, tools], index) =>
          <div className="redesign-pipeline-node" key={title}>
            <span className="redesign-mono">0{index + 1}</span>
            <h3>{title}</h3><p>{description}</p><small>{tools}</small>
          </div>)}
      </div>
    </section>
    <section className="redesign-experience" aria-labelledby="experience-title">
      <h2 id="experience-title">Опыт</h2>
      <div>
        <p><span>2023 — сейчас</span><strong>Специалист по ИТ</strong><em>Инфраструктура, автоматизация, внутренние инструменты и web-продукты.</em></p>
        <p><span>2023</span><strong>Инженер по радионавигации и связи</strong><em>Системы связи, локальная сеть и серверы.</em></p>
        <Link href="/experience">Подробнее об опыте <ArrowUpRight aria-hidden="true" /></Link>
      </div>
    </section>
    <section className="redesign-contact" id="contact" aria-labelledby="contact-title">
      <h2 id="contact-title">Обсудим<br /><span>проект?</span></h2>
      <div><a href="mailto:im@angelius.ru">im@angelius.ru <ArrowUpRight aria-hidden="true" /></a></div>
    </section>
  </main>;
}
