"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  ["Проекты", "/projects"],
  ["Опыт", "/experience"],
  ["Обо мне", "/about"],
  ["Резюме", "/resume"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        <span>IY</span>
        <strong>ILGIZ YAKHIN</strong>
      </Link>
      <nav id="main-navigation" className={open ? "main-nav is-open" : "main-nav"} aria-label="Основная навигация">
        {navigation.map(([label, href]) => (
          <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
        ))}
        <a className="nav-contact" href="mailto:im@angelius.ru">Написать</a>
      </nav>
      <div className="header-tools">
        <ThemeToggle />
        <button className="icon-button menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-navigation" aria-label={open ? "Закрыть меню" : "Открыть меню"}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
