"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { loadGlassKit, useGlassTabs } from "@/components/glass/glass-runtime";
import { SAVED_RATES, type Rates } from "@/lib/rates";

const NAMES: Record<string, string> = { USD: "доллар США", EUR: "евро" };
const money = (value: number) => value.toFixed(2).replace(".", ",");
const shortDate = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}.${m}.${y.slice(2)}`; };
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (date: Date) => `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** Live CBR rates from the site's own endpoint, or null when it cannot answer. */
async function fetchRates(): Promise<Rates | null> {
  try {
    const response = await fetch("/api/rates");
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

/** Rows as the widget shows them: price, change to the previous CBR rate and its direction. */
function rowsOf(data: Rates) {
  return data.rates.map((rate) => {
    const diff = rate.value - rate.previous;
    const dir = Math.abs(diff) < 0.005 ? "flat" : diff > 0 ? "up" : "down";
    const sign = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
    return { code: rate.code, name: NAMES[rate.code] ?? rate.code, value: money(rate.value), dir, arrow: dir === "up" ? "↗" : dir === "down" ? "↘" : "→",
      change: `${sign} ${money(Math.abs(diff))} ₽ · ${money(Math.abs(diff / rate.previous) * 100)}%` };
  });
}
const SIZES = [
  { label: "1 × 2", rows: 1, cols: 2 },
  { label: "2 × 2", rows: 2, cols: 2 },
  { label: "2 × 4", rows: 2, cols: 4 },
] as const;
const STYLES = ["Тёмный", "Светлый"] as const;

/** A price whose digits roll into place like a counter drum. */
function Roll({ value, spin }: { value: string; spin: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const strips = ref.current?.querySelectorAll<HTMLElement>(".roll-strip");
      if (!strips?.length) return;
      // The strip's position is a CSS variable (in digits), so GSAP never stacks a second transform on it.
      gsap.fromTo(strips, { "--roll": (i: number) => 10 + ((i * 3) % 7) }, { "--roll": (_: number, el: HTMLElement) => Number(el.dataset.digit), duration: 1.1, ease: "power4.out", stagger: 0.06 });
    });
    return () => mm.revert();
  }, { dependencies: [spin, value], scope: ref });
  return <span className="roll" ref={ref} aria-label={`${value} ₽`}>
    {[...value].map((char, i) => /\d/.test(char)
      ? <span className="roll-cell" key={i} aria-hidden="true">
          <span className="roll-strip" data-digit={char} style={{ "--roll": char } as CSSProperties}>
            {Array.from({ length: 20 }, (_, n) => <span key={n}>{n % 10}</span>)}
          </span>
        </span>
      : <span className="roll-sep" key={i} aria-hidden="true">{char}</span>)}
    <span className="roll-unit" aria-hidden="true"> ₽</span>
  </span>;
}

/**
 * The GlassRates widget rebuilt on the site's own glass kit, over a moving home-screen
 * wallpaper. It flows between its three sizes on the home-screen grid, switches style and
 * opacity, and a tap on its right half refreshes it the way the real widget does. Until
 * the reader takes over it cycles through the sizes by itself.
 */
export function WidgetShowcase() {
  const [size, setSize] = useState(1);
  const [style, setStyle] = useState(0);
  const [solid, setSolid] = useState(false);
  const [spin, setSpin] = useState(0);
  const [data, setData] = useState<Rates>(SAVED_RATES);
  const [stamp, setStamp] = useState("09.11 07:11");
  const [busy, setBusy] = useState(false);
  const touched = useRef(false);
  const screen = useRef<HTMLDivElement>(null);
  const widget = useRef<HTMLDivElement>(null);
  const sizeTabs = useRef<HTMLDivElement>(null);
  const styleTabs = useRef<HTMLDivElement>(null);
  const solidSwitch = useRef<HTMLInputElement>(null);
  const take = <T,>(set: (value: T) => void) => (value: T) => { touched.current = true; set(value); };
  useGlassTabs(sizeTabs, size, take(setSize));
  useGlassTabs(styleTabs, style, take(setStyle));

  useEffect(() => {
    const input = solidSwitch.current;
    if (!input) return;
    let off = () => {};
    let cancelled = false;
    loadGlassKit().then((kit) => { if (!cancelled) off = kit.mountSwitch(input).destroy; });
    return () => { cancelled = true; off(); };
  }, []);

  // The widget's box follows the home-screen grid; the move is a spring, not a cut.
  useGSAP(() => {
    const el = widget.current;
    const grid = screen.current;
    if (!el || !grid) return;
    const place = (instant: boolean) => {
      // Read the grid from resolved pixels: the custom properties hold clamp()/min() strings.
      const dock = grid.querySelector<HTMLElement>(".ws-dock");
      const gap = dock ? parseFloat(getComputedStyle(dock).columnGap) || 14 : 14;
      const pad = parseFloat(getComputedStyle(grid).paddingLeft) || 22;
      const cell = (grid.clientWidth - 2 * pad - 3 * gap) / 4;
      // The home screen keeps two rows for the widget, and type scales with the cell.
      grid.style.setProperty("--cell-px", `${cell}px`);
      grid.style.setProperty("--gap-px", `${gap}px`);
      grid.style.setProperty("--u", (cell / 80).toFixed(3));
      const { rows, cols } = SIZES[size];
      const target = { width: cols * cell + (cols - 1) * gap, height: rows * cell + (rows - 1) * gap };
      if (instant) gsap.set(el, target);
      else gsap.to(el, { ...target, duration: 0.9, ease: "elastic.out(1, 0.75)" });
    };
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => place(false));
    mm.add("(prefers-reduced-motion: reduce)", () => place(true));
    const onResize = () => place(true);
    addEventListener("resize", onResize);
    return () => { removeEventListener("resize", onResize); mm.revert(); };
  }, { dependencies: [size] });

  // The phone leans toward the pointer.
  useGSAP(() => {
    const el = screen.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const rx = gsap.quickTo(el, "rotateX", { duration: 0.9, ease: "power3.out" });
      const ry = gsap.quickTo(el, "rotateY", { duration: 0.9, ease: "power3.out" });
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const box = host.getBoundingClientRect();
        ry(((event.clientX - box.left) / box.width - 0.5) * 16);
        rx(-((event.clientY - box.top) / box.height - 0.5) * 12);
      };
      const leave = () => { rx(0); ry(0); };
      host.addEventListener("pointermove", move);
      host.addEventListener("pointerleave", leave);
      return () => { host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); };
    });
    return () => mm.revert();
  });

  // The first entrance: the widget drops onto the home screen and the digits roll in.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      gsap.from(".ws-widget-wrap", { y: 60, scale: 0.86, rotateX: 18, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: screen.current, start: "top 75%", once: true, onEnter: () => setSpin((n) => n + 1) } });
      gsap.from(".ws-app", { y: 30, scale: 0.6, duration: 0.8, ease: "back.out(1.8)", stagger: 0.05, scrollTrigger: { trigger: screen.current, start: "top 75%", once: true } });
    });
    return () => mm.revert();
  }, { scope: screen });

  // Until the reader takes over, the widget walks through its sizes.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    if (screen.current) observer.observe(screen.current);
    const timer = setInterval(() => { if (visible && !touched.current) setSize((n) => (n + 1) % SIZES.length); }, 3400);
    return () => { clearInterval(timer); observer.disconnect(); };
  }, []);

  // The saved rates stay on screen until the live ones arrive, then the digits roll to them.
  const apply = (live: Rates | null) => {
    if (live) setData(live);
    setStamp(clock(new Date()));
    setSpin((n) => n + 1);
  };
  useEffect(() => {
    let cancelled = false;
    fetchRates().then((live) => { if (!cancelled && live) apply(live); });
    return () => { cancelled = true; };
  }, []);

  const refresh = async () => {
    if (busy) return;
    touched.current = true;
    setBusy(true);
    const started = Date.now();
    const live = await fetchRates();
    // The light sweep needs a moment to read as "fetching" even when the answer is cached.
    await new Promise((done) => setTimeout(done, Math.max(0, 650 - (Date.now() - started))));
    apply(live);
    setBusy(false);
  };
  const rates = rowsOf(data);

  const { label, rows, cols } = SIZES[size];
  return <section id="widget" className="case-section ws" aria-labelledby="widget-title">
    <div className="case-section-head">
      <h2 id="widget-title">Виджет в движении</h2>
      <p>Веб-реконструкция виджета на том же ките Liquid Glass с живым курсом ЦБ России. Меняйте размер и стиль, нажмите на правую половину карточки — курс запросится заново.</p>
    </div>
    <div className="ws-layout">
      <div className="ws-controls" data-lg="surface">
        <div className="ws-control">
          <span className="ws-caption" id="ws-size">Размер</span>
          <div className="ws-tabs" ref={sizeTabs} role="tablist" aria-labelledby="ws-size">
            {SIZES.map((item, index) => <button key={item.label} type="button" role="tab" aria-selected={size === index} tabIndex={size === index ? 0 : -1}>{item.label}</button>)}
          </div>
        </div>
        <div className="ws-control">
          <span className="ws-caption" id="ws-style">Стиль</span>
          <div className="ws-tabs" ref={styleTabs} role="tablist" aria-labelledby="ws-style">
            {STYLES.map((item, index) => <button key={item} type="button" role="tab" aria-selected={style === index} tabIndex={style === index ? 0 : -1}>{item}</button>)}
          </div>
        </div>
        <label className="ws-switch">
          <span>Без прозрачности<small>Сплошной фон для любых обоев</small></span>
          <input ref={solidSwitch} type="checkbox" role="switch" checked={solid} onChange={(event) => { touched.current = true; setSolid(event.target.checked); }} />
        </label>
        <p className="ws-note">Строки × столбцы сетки рабочего стола. Размер шрифта подстраивается под карточку.</p>
      </div>

      <div className="ws-phone">
        <div className="ws-screen" ref={screen} data-style={style ? "light" : "dark"}>
          <div className="ws-wallpaper" aria-hidden="true"><i /><i /><i /><i /></div>
          <p className="ws-clock" aria-hidden="true">7:12<small>понедельник, 9 ноября</small></p>
          <div className="ws-widget-wrap">
            {/* State lives in data attributes: the kit adds its own classes, and a changing className would wipe them. */}
            <div className="ws-widget" ref={widget} data-lg="surface" data-solid={solid || undefined} data-busy={busy || undefined} data-size={label} data-rows={rows} data-cols={cols}
              role="group" aria-label={`Виджет ${label}: ${rates.map((rate) => `${rate.name} ${rate.value} ₽`).join(", ")}`}>
              {rows === 2 && <p className="ws-head">{cols === 4 && <b>Курс валют</b>}ЦБ · {shortDate(data.date)}</p>}
              <ul className="ws-rows">
                {rates.map((rate) => <li key={rate.code} data-dir={rate.dir}>
                  <span className="ws-code">{rate.code}{rows === 2 && <i aria-hidden="true">{rate.arrow}</i>}{cols === 4 && <small>{rate.name}</small>}</span>
                  <span className="ws-value"><Roll value={rate.value} spin={spin} />{cols === 4 && <small className="ws-change">{rate.change}</small>}</span>
                </li>)}
              </ul>
              {rows === 2 && <p className="ws-foot">{data.source === "saved" ? "Сохранённый курс" : "ЦБ · За 1 ед."} · {stamp}</p>}
              <button type="button" className="ws-refresh" onClick={refresh} aria-label="Обновить курсы на виджете" />
            </div>
          </div>
          <div className="ws-apps" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <span className="ws-app" key={i} />)}</div>
          <div className="ws-dock" aria-hidden="true">{Array.from({ length: 4 }, (_, i) => <span className="ws-app" key={i} />)}</div>
        </div>
      </div>
    </div>
  </section>;
}
