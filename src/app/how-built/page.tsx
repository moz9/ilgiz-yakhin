import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { RevealSection } from "@/components/reveal-section";

export const metadata: Metadata = { title: "Как устроен сайт", description: "Next.js, типизированный каталог, Liquid Glass и автоматические проверки." };

const architecture = [
  ["Контент", "Типизированный каталог проектов отделяет подтверждённые данные от того, как они показаны."],
  ["Интерфейс", "Server Components отдают контент, клиентские компоненты отвечают за фильтры, ленту кейсов и навигацию."],
  ["Liquid Glass", "Навигация, вкладки и настройки сделаны из живого стекла: в Chromium линза преломляет страницу через SVG-фильтр внутри backdrop-filter, в остальных браузерах остаётся размытие."],
  ["Движение", "Лента кейсов привязана к скроллу, линза в первом экране следует за курсором. С системной настройкой «Уменьшить движение» всё стоит на месте."],
];

const gates = [
  "TypeScript strict и статическая генерация",
  "Клавиатурная навигация и видимый фокус",
  "Уменьшение движения и прозрачности",
  "Unit-тесты, браузерные сценарии и проверка после выкладки",
  "Проверка публичного контента на секреты и внутренние адреса",
];

const pipeline = [
  ["npm run lint", "ESLint без предупреждений"],
  ["npm run typecheck", "tsc --noEmit, strict"],
  ["npm run test", "unit-тесты каталога и публичного контента"],
  ["npm run build", "статическая генерация всех кейсов"],
  ["npm run test:e2e", "браузерные сценарии на десктопе и телефоне"],
  ["git push origin main", "сборка и выкладка через Vercel"],
];

const palette = [
  { name: "Фарфор", hex: "#EEF1F6" }, { name: "Чернила", hex: "#0E1220", dark: true }, { name: "Кобальт", hex: "#2F45FF", dark: true },
  { name: "Коралл", hex: "#FF6B8B" }, { name: "Аква", hex: "#21C6A4" }, { name: "Солнце", hex: "#FFC23D" },
];

export default function HowBuiltPage() {
  return <main className="page">
    <header className="page-head">
      <div className="page-lights" aria-hidden="true"><i /><i /></div>
      <h1>Как устроен этот сайт</h1>
      <p>Next.js 16, типизированный каталог кейсов, Liquid Glass для навигации и автоматические проверки перед каждой выкладкой.</p>
    </header>
    <RevealSection>
      <section className="page-section built-grid">
        {architecture.map(([title, text]) => <article key={title}><h2>{title}</h2><p>{text}</p></article>)}
      </section>
    </RevealSection>
    <RevealSection>
      <section className="page-section terminal" aria-label="Проверки перед выкладкой">
        <div className="terminal-bar" aria-hidden="true"><i /><i /><i /><span>pipeline</span></div>
        <ol>{pipeline.map(([command, note]) => <li key={command}><b>$ {command}</b><em>{note}</em></li>)}</ol>
      </section>
    </RevealSection>
    <RevealSection>
      <section className="page-section built-split">
        <div>
          <h2>Палитра</h2>
          <p>Светлый фарфор и чернила для текста, кобальт для действий. Насыщенные цвета живут только в пятнах света за экранами — их и преломляет стекло.</p>
          <ul className="palette">{palette.map((color) => <li key={color.hex} style={{ background: color.hex }} data-dark={color.dark ? "" : undefined}><span>{color.name}</span><small>{color.hex}</small></li>)}</ul>
        </div>
        <div>
          <h2>Проверки качества</h2>
          <ul className="gates">{gates.map((item) => <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>)}</ul>
        </div>
      </section>
    </RevealSection>
  </main>;
}
