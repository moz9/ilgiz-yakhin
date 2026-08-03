import Link from "next/link";
export default function NotFound() { return <main className="not-found"><span>404</span><h1>Такой комнаты нет</h1><p>Вернитесь к карте портфолио или откройте каталог проектов.</p><Link className="button button-primary" href="/">На главную</Link></main>; }
