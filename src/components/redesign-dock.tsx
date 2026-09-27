"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { label: "Главная", href: "/" },
  { label: "Проекты", href: "/projects" },
  { label: "Опыт", href: "/experience" },
  { label: "Резюме", href: "/resume" },
  { label: "Контакт", href: "mailto:im@angelius.ru" },
];

export function RedesignDock() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 5) return;
      setHidden(y > last && y > 200 && window.innerHeight + y < document.documentElement.scrollHeight - 40);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <nav className={`redesign-dock${hidden ? " is-hidden" : ""}`} aria-label="Быстрая навигация">
    {links.map(({ href, label }) =>
      href.startsWith("mailto:") ? <a key={href} href={href}>{label}</a> :
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
  </nav>;
}
