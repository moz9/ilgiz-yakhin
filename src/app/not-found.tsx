import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const routes = [
  ["/projects", "Работы"],
  ["/resume", "Резюме"],
  ["/about", "Обо мне"],
  ["/how-built", "Как устроен сайт"],
];

export default function NotFound() {
  return <main className="page not-found">
    <header className="page-head">
      <div className="page-lights" aria-hidden="true"><i /><i /></div>
      <p className="not-found-code" aria-hidden="true">404</p>
      <h1>Такой страницы нет</h1>
      <p>Адрес не совпал ни с одним разделом. Проверьте ссылку или откройте один из разделов ниже.</p>
      <div className="not-found-links">
        <Link className="button button-primary" href="/" data-lg="button" data-lg-variant="prominent">На главную</Link>
        {routes.map(([href, label]) => <Link key={href} className="button" href={href} data-lg="button">{label}<ArrowUpRight aria-hidden="true" /></Link>)}
      </div>
    </header>
  </main>;
}
