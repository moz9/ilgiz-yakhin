import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><span>404</span><h1>Страница не найдена</h1><p>Проверьте адрес или вернитесь на главную.</p><Link className="button button-primary" href="/">На главную</Link></main>;
}
