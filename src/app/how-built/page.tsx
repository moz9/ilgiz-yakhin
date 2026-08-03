import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Как создан сайт" };

const architecture = [
  ["Content", "Типизированный каталог проектов отделяет доказанные утверждения от визуального представления."],
  ["Interface", "Server Components для контента, клиентские границы только для темы, фильтров и интерактивной сцены."],
  ["Motion", "Оригинальная архитектурная иллюстрация, CSS depth и Motion с обязательным reduced-motion режимом."],
  ["Delivery", "Static generation, Vercel previews, автоматические проверки и production smoke."],
];

export default function HowBuiltPage() {
  return <main className="inner-page"><section className="page-hero"><div className="eyebrow"><span>META CASE</span><span>Portfolio as a product</span></div><h1>Как создан<br />этот сайт</h1><p>Портфолио само является кейсом: выразительный интерфейс не должен мешать скорости, доступности и проверяемости содержания.</p></section><section className="section architecture-grid">{architecture.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>)}</section><section className="section system-section"><p className="kicker">Design system</p><h2>Precision Editorial / Technical Luxury</h2><div className="color-system"><span className="swatch swatch-paper">Paper</span><span className="swatch swatch-ink">Ink</span><span className="swatch swatch-teal">Signal</span><span className="swatch swatch-red">Marker</span></div></section><section className="section quality-section"><div><p className="kicker">Quality gates</p><h2>Эффект не считается готовым, если он мешает содержанию.</h2></div><ul>{["TypeScript strict и статическая генерация", "Клавиатурная навигация и видимый focus", "Reduced motion и семантический fallback", "Unit, browser E2E и production smoke", "Проверка публичного контента на секреты и внутренние адреса"].map((item) => <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>)}</ul></section></main>;
}
