import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FieldBackdrop } from "@/components/field-backdrop";

const routes = [
  ["/projects", "Проекты"],
  ["/resume", "Резюме"],
  ["/about", "Обо мне"],
  ["/how-built", "Как создан сайт"],
];

export default function NotFound() {
  return <main className="inner-page not-found-page">
    <FieldBackdrop tone="violet" />
    <section className="page-hero">
      <div className="eyebrow"><span>404</span><span>Маршрут не найден</span></div>
      <h1>Такой<br />страницы нет</h1>
      <p>Адрес не совпал ни с одним разделом. Ниже — основные точки входа.</p>
    </section>
    <section className="not-found-links">
      {routes.map(([href, label]) => <Link key={href} href={href} data-spotlight><span>{label}</span><ArrowUpRight aria-hidden="true" /></Link>)}
      <Link className="button button-primary" href="/">На главную</Link>
    </section>
  </main>;
}
