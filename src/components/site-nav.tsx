"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, FileText, House, LayoutGrid, Mail, Moon, RotateCcw, SlidersHorizontal, Sun, UserRound } from "lucide-react";
import { applyTheme, readThemePref, THEME_EVENT, watchSystemTheme, type ThemePref } from "@/lib/theme";
import { DEFAULT_GLASS_DENSITY, GLASS_DENSITY_KEY, GLASS_OPAQUE_KEY, loadGlassKit, useGlassTabs } from "@/components/glass/glass-runtime";

const links = [
  { label: "Работы", href: "/projects", icon: LayoutGrid },
  { label: "Опыт", href: "/experience", icon: BriefcaseBusiness },
  { label: "Обо мне", href: "/about", icon: UserRound },
  { label: "Резюме", href: "/resume", icon: FileText },
];

const themeOptions: { value: ThemePref; label: string }[] = [
  { value: "dark", label: "Тёмная" },
  { value: "light", label: "Светлая" },
  { value: "system", label: "Как в системе" },
];

/** The saved theme choice and the theme actually shown, kept in step with every switch on the page. */
function useTheme() {
  const [pref, setPref] = useState<ThemePref>("dark");
  const [shown, setShown] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const sync = () => { setPref(readThemePref()); setShown(document.documentElement.dataset.theme === "light" ? "light" : "dark"); };
    sync();
    addEventListener(THEME_EVENT, sync);
    const unwatch = watchSystemTheme();
    return () => { removeEventListener(THEME_EVENT, sync); unwatch(); };
  }, []);
  return { pref, shown };
}

function ThemeChoice() {
  const { pref } = useTheme();
  const row = useRef<HTMLDivElement>(null);
  const index = themeOptions.findIndex((option) => option.value === pref);
  useGlassTabs(row, index, (next) => applyTheme(themeOptions[next].value));
  return <div className="appearance-theme" data-lg="surface">
    <div className="appearance-theme-tabs" ref={row} role="tablist" aria-label="Тема">
      {themeOptions.map((option, n) => <button key={option.value} type="button" role="tab" aria-selected={n === index} tabIndex={n === index ? 0 : -1} onClick={() => applyTheme(option.value)}>{option.label}</button>)}
    </div>
  </div>;
}

function ThemeToggle() {
  const { shown } = useTheme();
  const next = shown === "dark" ? "light" : "dark";
  return <button className="site-nav-theme" type="button" aria-label={next === "light" ? "Включить светлую тему" : "Включить тёмную тему"} title={next === "light" ? "Светлая тема" : "Тёмная тема"} onClick={() => applyTheme(next)}>
    {shown === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
  </button>;
}

function AppearancePanel() {
  const panel = useRef<HTMLDivElement>(null);
  const density = useRef<HTMLInputElement>(null);
  const reset = useRef<HTMLButtonElement>(null);
  const opaque = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(DEFAULT_GLASS_DENSITY);

  useEffect(() => {
    const input = density.current;
    const toggle = opaque.current;
    if (!input || !toggle) return;
    let cancelled = false;
    let destroy = () => {};
    Promise.all([loadGlassKit(), import("@/lib/liquid-glass/liquid-glass.js")]).then(([kit, core]) => {
      if (cancelled) return;
      const slider = kit.mountDensity(input, { storageKey: GLASS_DENSITY_KEY, defaultValue: DEFAULT_GLASS_DENSITY, reset: reset.current });
      try { toggle.checked = localStorage.getItem(GLASS_OPAQUE_KEY) === "1"; } catch { /* optional */ }
      const system = matchMedia("(prefers-reduced-transparency: reduce)").matches || matchMedia("(forced-colors: active)").matches;
      if (system) { toggle.checked = true; toggle.disabled = true; }
      const sw = kit.mountSwitch(toggle);
      const sync = () => setValue(Number(input.value));
      const onOpaque = () => {
        // The user's own choice is applied on top of the system: it can only make glass more opaque.
        core.setTier(toggle.checked ? 0 : core.detectTier());
        input.disabled = toggle.checked;
        kit.setDensity(Number(input.value) / 100);
        document.documentElement.dataset.lgkRenderer = kit.rendererKind();
        try { localStorage.setItem(GLASS_OPAQUE_KEY, toggle.checked ? "1" : "0"); } catch { /* optional */ }
      };
      input.disabled = toggle.checked;
      sync();
      input.addEventListener("input", sync);
      toggle.addEventListener("change", onOpaque);
      destroy = () => { input.removeEventListener("input", sync); toggle.removeEventListener("change", onOpaque); sw.destroy(); slider.destroy(); };
    });
    return () => { cancelled = true; destroy(); };
  }, []);

  return <div id="appearance-panel" ref={panel} className="appearance-panel" role="dialog" aria-labelledby="appearance-title" hidden>
    <div className="appearance-content">
      <h2 id="appearance-title">Внешний вид</h2>
      <ThemeChoice />
      <div className="appearance-preview" aria-hidden="true">
        <span className="appearance-preview-blob" />
        <span className="appearance-preview-blob" />
        <span className="appearance-preview-word">Яхин</span>
        <span className="appearance-preview-glass" data-lg="surface"><span>Liquid Glass</span></span>
      </div>
      <label className="appearance-row" htmlFor="glass-density"><span>Liquid Glass</span><output htmlFor="glass-density">{Math.round(value)}%</output></label>
      <input ref={density} id="glass-density" type="range" min="0" max="100" defaultValue={DEFAULT_GLASS_DENSITY} aria-label="Плотность стекла" />
      <div className="appearance-scale" aria-hidden="true"><span>Прозрачный</span><span>Плотный</span></div>
      <label className="appearance-row appearance-toggle"><span>Уменьшить прозрачность</span><input ref={opaque} type="checkbox" /></label>
      <button ref={reset} type="button" className="appearance-reset" data-lg-close><RotateCcw aria-hidden="true" />Вернуть по умолчанию</button>
    </div>
  </div>;
}

export function SiteNav() {
  const pathname = usePathname();
  const tabs = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const settings = useRef<HTMLButtonElement>(null);
  const [hidden, setHidden] = useState(false);
  const selected = links.findIndex(({ href }) => pathname.startsWith(href));
  useGlassTabs(tabs, selected < 0 ? 0 : selected);

  useEffect(() => {
    const trigger = settings.current;
    const surface = bar.current;
    const panel = document.getElementById("appearance-panel");
    if (!trigger || !surface || !panel) return;
    let cancelled = false;
    let destroy = () => {};
    // The bar becomes glass first, so the menu trigger is recognised as an item of it
    // and does not grow a second glass of its own.
    loadGlassKit().then((kit) => {
      if (cancelled) return;
      const glass = kit.mountSurface(surface);
      const menu = kit.mountMenu(trigger, panel);
      destroy = () => { menu.destroy(); glass.destroy(); };
    });
    return () => { cancelled = true; destroy(); };
  }, []);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 320);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Demos are standalone product surfaces: the site navigation would cover their own controls.
  if (pathname.startsWith("/demos/")) return null;
  return <>
    <header className={`site-nav${hidden ? " is-tucked" : ""}`}>
      <nav className="site-nav-bar" ref={bar} aria-label="Основная навигация">
        <Link className="site-nav-mark" href="/" aria-label="Ильгиз Яхин — на главную" aria-current={pathname === "/" ? "page" : undefined}><span className="site-nav-mark-text">IY</span><House aria-hidden="true" /><span className="site-nav-mark-label" aria-hidden="true">Главная</span></Link>
        <div className="site-nav-tabs" ref={tabs} data-selected={selected >= 0 ? "" : undefined}>
          {links.map(({ label, href, icon: Icon }) =>
            <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link>)}
        </div>
        <a className="site-nav-contact" href="mailto:im@angelius.ru"><Mail aria-hidden="true" /><span>Написать</span></a>
        <ThemeToggle />
        <button ref={settings} className="site-nav-settings" type="button" aria-label="Внешний вид" title="Внешний вид" data-lg-panel="#appearance-panel"><SlidersHorizontal aria-hidden="true" /></button>
      </nav>
    </header>
    <AppearancePanel />
  </>;
}
