import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { RevealSection } from "@/components/reveal-section";
import { FieldBackdrop } from "@/components/field-backdrop";

export const metadata: Metadata = { title: "Как создан сайт" };

const architecture = [
  ["Content", "Типизированный каталог проектов отделяет подтвержденные данные от визуального представления."],
  ["Interface", "Server Components отвечают за контент, клиентские — за фильтры, движение ленты и быструю навигацию."],
  ["Motion", "Стена проектов движется слоями, линза — по автономной траектории; reduced motion показывает статичный вариант."],
  ["Delivery", "Static generation, типизация, unit- и browser E2E; production проверяется отдельно после публикации."],
];

const gates = [
  "TypeScript strict и статическая генерация",
  "Клавиатурная навигация и видимый focus",
  "Reduced motion и семантический fallback",
  "Unit, browser E2E и production smoke",
  "Проверка публичного контента на секреты и внутренние адреса",
];

const pipeline = [
  ["$", "npm run lint", "ESLint, strict, без предупреждений в изменённых файлах"],
  ["$", "npm run typecheck", "tsc --noEmit, strict: true"],
  ["$", "npm run test", "14 unit-тестов на каталог и публичный контент"],
  ["$", "npm run build", "статическая генерация всех 14 кейсов"],
  ["$", "npm run test:e2e", "50 browser-сценариев, десктоп и мобилка"],
  ["$", "git push origin main", "сборка и деплой через Git-интеграцию"],
];

export default function HowBuiltPage() {
  return (
    <main className="inner-page how-built-page">
      <FieldBackdrop tone="violet" />
      <section className="page-hero">
        <div className="eyebrow"><span>META CASE</span><span>Portfolio</span></div>
        <h1>Как создан<br />этот сайт</h1>
        <p>Next.js, типизированный каталог, адаптивная композиция и автоматические проверки.</p>
      </section>
      <RevealSection>
        <section className="section architecture-grid">
          {architecture.map(([title, text], index) => (
            <article key={title} data-spotlight>
              <span>0{index + 1}</span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>
      </RevealSection>
      <RevealSection>
        <section className="section pipeline-terminal">
          <div className="term-window">
            <div className="term-bar"><i /><i /><i /><span>pipeline</span></div>
            <ol className="term-lines">
              {pipeline.map(([prompt, command, note]) => (
                <li key={command}>
                  <s>{prompt}</s> <b>{command}</b> <em>{note}</em>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </RevealSection>
      <RevealSection>
        <section className="section system-section">
          <p className="kicker">Design system</p>
          <h2>Ink / Amber / Status</h2>
          <div className="color-system">
            <span className="swatch swatch-paper">Text<small>#eef1f4</small></span>
            <span className="swatch swatch-ink">Ink<small>#0d1015</small></span>
            <span className="swatch swatch-teal">Amber<small>#b8e4cf</small></span>
            <span className="swatch swatch-red">Status<small>#5bd68a</small></span>
          </div>
        </section>
      </RevealSection>
      <RevealSection>
        <section className="section quality-section">
          <div><p className="kicker">Quality gates</p><h2>Проверки качества</h2></div>
          <ul>{gates.map((item) => <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>)}</ul>
        </section>
      </RevealSection>
    </main>
  );
}
