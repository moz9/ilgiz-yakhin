"use client";

import { ArrowUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/demos/")) return null;

  return (
    <footer className="portfolio-footer">
      <div className="footer-topline"><span><i aria-hidden="true" />Открыт к удалённой работе</span><a href="#" className="footer-top" aria-label="Наверх" title="Наверх"><ArrowUp aria-hidden="true" /></a></div>
      <div className="footer-conversation">
        <h2>На связи<span>.</span></h2>
        <a className="footer-email" href="mailto:im@angelius.ru"><span>im@angelius.ru</span><ArrowUpRight aria-hidden="true" /></a>
      </div>
      <nav className="footer-navigation" aria-label="Нижняя навигация">
        <Link href="/projects">Проекты<ArrowUpRight aria-hidden="true" /></Link>
        <Link href="/about">Обо мне<ArrowUpRight aria-hidden="true" /></Link>
        <Link href="/resume">Резюме<ArrowUpRight aria-hidden="true" /></Link>
        <Link href="/how-built">Как создан сайт<ArrowUpRight aria-hidden="true" /></Link>
      </nav>
      <Link className="footer-signature" href="/" aria-label="ILGIZ YAKHIN — главная"><span>ILGIZ</span><span>YAKHIN<ArrowUpRight aria-hidden="true" /></span></Link>
      <div className="footer-baseline"><span>Full-stack / AI-разработчик</span><span>Web · Desktop · Automation</span></div>
    </footer>
  );
}
