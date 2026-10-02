"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Home, Grid2X2, UserRound, FileText, Mail, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { GlassLayer } from "@/components/glass-layer";
import { DEFAULT_GLASS_DENSITY, normalizeGlassDensity } from "@/lib/glass-optics";

const links = [
  { label: "Главная", href: "/", icon: Home },
  { label: "Проекты", href: "/projects", icon: Grid2X2 },
  { label: "Обо мне", href: "/about", icon: UserRound },
  { label: "Резюме", href: "/resume", icon: FileText },
  { label: "Контакт", href: "mailto:im@angelius.ru", icon: Mail },
];

export function RedesignDock() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [density, setDensity] = useState(DEFAULT_GLASS_DENSITY);
  const [opaque, setOpaque] = useState(false);
  const [systemOpaque, setSystemOpaque] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("portfolio-appearance") || "{}");
        setDensity(normalizeGlassDensity(saved?.density));
        setOpaque(saved?.opaque === true);
      } catch { /* Storage may be disabled. The calibrated defaults still work. */ }
      setReady(true);
    });
    const queries = [matchMedia("(forced-colors: active)"), matchMedia("(prefers-reduced-transparency: reduce)")];
    const sync = () => setSystemOpaque(queries.some((query) => query.matches));
    const initial = requestAnimationFrame(sync);
    queries.forEach((query) => query.addEventListener("change", sync));
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(initial); queries.forEach((query) => query.removeEventListener("change", sync)); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.style.setProperty("--glass-tint", String(.12 + density / 100 * .73));
    document.documentElement.dataset.opaqueGlass = String(opaque);
    const timer = setTimeout(() => {
      try { localStorage.setItem("portfolio-appearance", JSON.stringify({ density, opaque })); } catch { /* Optional preference storage. */ }
    }, 180);
    return () => clearTimeout(timer);
  }, [density, opaque, ready]);
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
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  return <>
    <nav className={`redesign-dock liquid-surface${hidden && !settingsOpen ? " is-hidden" : ""}`} aria-label="Быстрая навигация">
      <GlassLayer />
      {links.map(({ href, label, icon: Icon }) =>
        href.startsWith("mailto:") ? <a key={href} href={href} aria-label={label} title={label}><Icon aria-hidden="true" /><span>{label}</span></a> :
          <Link key={href} href={href} aria-label={label} title={label} aria-current={active(href) ? "page" : undefined}>
            {active(href) && <motion.i className="dock-selection" layoutId="dock-selection" transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 440, damping: 34 }} />}
            <Icon aria-hidden="true" /><span>{label}</span>
          </Link>)}
      <button className="dock-settings" type="button" popoverTarget="appearance-settings" aria-label="Внешний вид" title="Внешний вид" aria-expanded={settingsOpen}><SlidersHorizontal aria-hidden="true" /></button>
    </nav>
    <div id="appearance-settings" className="appearance-settings" popover="auto" role="dialog" aria-labelledby="appearance-title" onToggle={(event) => setSettingsOpen(event.newState === "open")}>
      <header><h2 id="appearance-title">Внешний вид</h2><button type="button" popoverTarget="appearance-settings" popoverTargetAction="hide" aria-label="Закрыть настройки" title="Закрыть настройки"><X /></button></header>
      <div className="glass-preview"><div className="glass-preview-lines" aria-hidden="true"><span>ILGIZ</span><span>YAKHIN</span></div><div className="glass-preview-control liquid-surface"><GlassLayer /><span>Liquid Glass</span><SlidersHorizontal aria-hidden="true" /></div></div>
      <label className="density-label" htmlFor="glass-density">Liquid Glass <output>{Math.round(density)}%</output></label>
      <input id="glass-density" type="range" min="0" max="100" value={density} disabled={opaque || systemOpaque} aria-valuetext={`${Math.round(density)}% плотности`} onChange={(event) => setDensity(Number(event.target.value))} />
      <div className="density-scale"><span>Прозрачный</span><span>Плотный</span></div>
      <label className="transparency-setting"><span>Уменьшить прозрачность</span><input type="checkbox" checked={opaque || systemOpaque} disabled={systemOpaque} onChange={(event) => setOpaque(event.target.checked)} /></label>
      {systemOpaque && <p className="appearance-note">Прозрачность отключена настройками системы.</p>}
      <button className="appearance-reset" type="button" onClick={() => { setDensity(DEFAULT_GLASS_DENSITY); setOpaque(false); }}><RotateCcw aria-hidden="true" />По умолчанию</button>
    </div>
  </>;
}
