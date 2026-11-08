"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/demos/")) return null;

  return <footer className="site-footer">
    <div className="site-footer-grid">
      <div className="site-footer-name">
        <strong>Ильгиз Яхин</strong>
        <span>Full-stack и AI-разработчик. Барнаул, работаю удалённо.</span>
      </div>
      <nav aria-label="Нижняя навигация">
        <Link href="/projects">Работы</Link>
        <Link href="/experience">Опыт</Link>
        <Link href="/about">Обо мне</Link>
        <Link href="/resume">Резюме</Link>
        <Link href="/how-built">Как устроен сайт</Link>
      </nav>
      <div className="site-footer-contact">
        <a href="mailto:im@angelius.ru">im@angelius.ru</a>
        <a className="site-footer-top" href="#top" aria-label="Наверх" title="Наверх" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}><ArrowUp aria-hidden="true" /></a>
      </div>
    </div>
    <p className="site-footer-word" aria-hidden="true">Яхин</p>
  </footer>;
}
