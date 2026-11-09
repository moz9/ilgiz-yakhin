"use client";

import { useRef, useState } from "react";
import { Download, Table2 } from "lucide-react";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import type { ShowcaseProps } from "./registry";

/* Demo data: a seeded generator, so every visit shows the same believable shop. */
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
const DAYS = 180;
const CHANNELS = [
  { name: "Поиск", share: 0.38 }, { name: "Соцсети", share: 0.27 }, { name: "Рассылка", share: 0.2 }, { name: "Прямые", share: 0.15 },
];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
type Day = { date: Date; revenue: number; orders: number; visits: number; channels: number[]; hours: number[] };
const DATA: Day[] = (() => {
  const r = rng(7);
  const start = new Date(2026, 4, 13);
  return Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(start); date.setDate(start.getDate() + i);
    const weekday = (date.getDay() + 6) % 7;
    const trend = 1 + i / DAYS * 0.45;
    const weekly = weekday >= 5 ? 1.22 : weekday === 0 ? 0.92 : 1;
    const orders = Math.round((60 + r() * 22) * trend * weekly);
    const check = 2300 + r() * 600 + i * 2;
    const visits = Math.round(orders / (0.021 + r() * 0.008));
    const channels = CHANNELS.map((c) => c.share * (0.85 + r() * 0.3));
    const sum = channels.reduce((a, b) => a + b, 0);
    const revenue = Math.round(orders * check);
    const hours = Array.from({ length: 24 }, (_, h) => Math.max(0, Math.round(orders * (Math.exp(-((h - 13) ** 2) / 18) * 0.11 + Math.exp(-((h - 21) ** 2) / 6) * 0.09) * (0.8 + r() * 0.4))));
    return { date, revenue, orders, visits, channels: channels.map((c) => Math.round((c / sum) * revenue)), hours };
  });
})();

const PERIODS = [{ label: "7 дней", days: 7 }, { label: "30 дней", days: 30 }, { label: "90 дней", days: 90 }];
const rub = (v: number) => `${Math.round(v).toLocaleString("ru-RU")} ₽`;
const short = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(".", ",")} млн` : v >= 1e3 ? `${Math.round(v / 1e3)} тыс.` : `${Math.round(v)}`);
const day = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500"]; // dark-surface steps of the validated categorical order

function summarize(days: Day[]) {
  const revenue = days.reduce((a, d) => a + d.revenue, 0);
  const orders = days.reduce((a, d) => a + d.orders, 0);
  const visits = days.reduce((a, d) => a + d.visits, 0);
  return { revenue, orders, check: revenue / orders, conversion: (orders / visits) * 100 };
}

/**
 * «Пульс магазина»: an analytics dashboard for an online shop. KPIs with change against the
 * previous period, revenue by day with a crosshair, revenue by channel, and orders by weekday
 * and hour as a heatmap. Period switch, comparison, a table view and CSV export.
 */
export default function AnalyticsDashboard({ mode }: ShowcaseProps) {
  const [period, setPeriod] = useState(1);
  const [compare, setCompare] = useState(true);
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [cell, setCell] = useState<{ d: number; h: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  useGlassTabs(tabs, period, (index) => { setPeriod(index); setHover(null); });

  const span = PERIODS[period].days;
  const current = DATA.slice(-span);
  const previous = DATA.slice(-span * 2, -span);
  const now = summarize(current), before = summarize(previous);
  const channelTotals = CHANNELS.map((_, i) => current.reduce((a, d) => a + d.channels[i], 0));
  const heat = WEEKDAYS.map((_, wd) => Array.from({ length: 24 }, (_, h) => current.filter((d) => (d.date.getDay() + 6) % 7 === wd).reduce((a, d) => a + d.hours[h], 0)));
  const heatMax = Math.max(...heat.flat());

  // Line geometry: one y-scale for both periods (revenue per day).
  const W = 720, H = 240, P = { l: 56, r: 12, t: 12, b: 28 };
  const yMax = Math.max(...current.map((d) => d.revenue), ...(compare ? previous.map((d) => d.revenue) : [])) * 1.1;
  const x = (i: number) => P.l + (i / Math.max(1, span - 1)) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / yMax) * (H - P.t - P.b);
  const line = (days: Day[]) => days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.revenue).toFixed(1)}`).join(" ");
  const area = `${line(current)} L${x(span - 1)} ${H - P.b} L${x(0)} ${H - P.b} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * yMax);

  // Each period change replays the drawing: lines draw in, bars grow, numbers count up.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      gsap.fromTo(".ad-line-now", { strokeDasharray: 2000, strokeDashoffset: 2000 }, { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" });
      gsap.fromTo(".ad-area", { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.3 });
      gsap.fromTo(".ad-bar", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out", stagger: 0.06, transformOrigin: "0 50%" });
      gsap.fromTo(".ad-heat rect", { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: { each: 0.002, from: "start" } });
      root.current?.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const to = Number(el.dataset.count), digits = Number(el.dataset.digits ?? 0), suffix = el.dataset.suffix ?? "";
        const o = { v: 0 };
        gsap.to(o, { v: to, duration: 1, ease: "power2.out", onUpdate: () => { el.textContent = o.v.toLocaleString("ru-RU", { maximumFractionDigits: digits, minimumFractionDigits: digits }) + suffix; } });
      });
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [period, table], revertOnUpdate: true });

  const kpis = [
    { label: "Выручка", value: now.revenue, prev: before.revenue, digits: 0, suffix: " ₽" },
    { label: "Заказы", value: now.orders, prev: before.orders, digits: 0, suffix: "" },
    { label: "Средний чек", value: now.check, prev: before.check, digits: 0, suffix: " ₽" },
    { label: "Конверсия", value: now.conversion, prev: before.conversion, digits: 2, suffix: " %" },
  ];

  const exportCsv = () => {
    const rows = [["Дата", "Выручка", "Заказы", "Визиты", ...CHANNELS.map((c) => c.name)], ...current.map((d) => [d.date.toISOString().slice(0, 10), d.revenue, d.orders, d.visits, ...d.channels])];
    const blob = new Blob(["﻿" + rows.map((r) => r.join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = `пульс-магазина-${span}д.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    setHover(Math.max(0, Math.min(span - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (span - 1)))));
  };

  return <div className={`ad ad-${mode}`} ref={root}>
    <header className="ad-head">
      <div><h3>Пульс магазина</h3><p>Интернет-магазин · демонстрационные данные</p></div>
      <div className="ad-filters">
        <div className="ad-tabs" ref={tabs} role="tablist" aria-label="Период">
          {PERIODS.map((p, i) => <button key={p.label} type="button" role="tab" aria-selected={period === i} tabIndex={period === i ? 0 : -1}>{p.label}</button>)}
        </div>
        <label className="ad-check"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />Прошлый период</label>
        <button type="button" className="ad-btn" aria-pressed={table} onClick={() => setTable(!table)}><Table2 aria-hidden="true" />{table ? "Графики" : "Таблица"}</button>
        <button type="button" className="ad-btn" onClick={exportCsv}><Download aria-hidden="true" />CSV</button>
      </div>
    </header>

    <ul className="ad-kpis">
      {kpis.map((k) => {
        const delta = ((k.value - k.prev) / k.prev) * 100;
        const up = delta >= 0;
        return <li key={k.label}>
          <span>{k.label}</span>
          <strong data-count={k.value} data-digits={k.digits} data-suffix={k.suffix}>{k.value.toLocaleString("ru-RU", { maximumFractionDigits: k.digits, minimumFractionDigits: k.digits })}{k.suffix}</strong>
          <small data-trend={up ? "up" : "down"}><b aria-hidden="true">{up ? "▲" : "▼"}</b> {up ? "+" : "−"}{Math.abs(delta).toFixed(1).replace(".", ",")}% <em>к прошлым {span} дн.</em></small>
        </li>;
      })}
    </ul>

    {table ? <div className="ad-table" tabIndex={0}>
      <table>
        <caption>Выручка, заказы и визиты по дням за {span} дней</caption>
        <thead><tr><th scope="col">Дата</th><th scope="col">Выручка</th><th scope="col">Заказы</th><th scope="col">Визиты</th>{CHANNELS.map((c) => <th scope="col" key={c.name}>{c.name}</th>)}</tr></thead>
        <tbody>{[...current].reverse().map((d) => <tr key={d.date.toISOString()}><th scope="row">{day(d.date)}</th><td>{rub(d.revenue)}</td><td>{d.orders}</td><td>{d.visits.toLocaleString("ru-RU")}</td>{d.channels.map((c, i) => <td key={i}>{rub(c)}</td>)}</tr>)}</tbody>
      </table>
    </div> : <div className="ad-grid">
      <figure className="ad-card ad-revenue">
        <figcaption><b>Выручка по дням</b>
          <span className="ad-legend"><i style={{ background: SERIES[0] }} />Текущий период{compare && <><i className="is-dashed" />Прошлый период</>}</span>
        </figcaption>
        <div className="ad-plot">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Выручка по дням за ${span} дней, всего ${rub(now.revenue)}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            <defs><linearGradient id="ad-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={SERIES[0]} stopOpacity="0.28" /><stop offset="1" stopColor={SERIES[0]} stopOpacity="0" /></linearGradient></defs>
            {ticks.map((t) => <g key={t}><line className="ad-grid-line" x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} /><text className="ad-axis" x={P.l - 8} y={y(t) + 4} textAnchor="end">{short(t)}</text></g>)}
            {[0, Math.floor((span - 1) / 2), span - 1].map((i) => <text key={i} className="ad-axis" x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === span - 1 ? "end" : "middle"}>{day(current[i].date)}</text>)}
            {compare && <path className="ad-line-prev" d={line(previous)} />}
            <path className="ad-area" d={area} fill="url(#ad-fill)" />
            <path className="ad-line-now" d={line(current)} stroke={SERIES[0]} />
            {hover !== null && <g className="ad-cross">
              <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} />
              {compare && <circle cx={x(hover)} cy={y(previous[hover].revenue)} r="4" className="ad-dot-prev" />}
              <circle cx={x(hover)} cy={y(current[hover].revenue)} r="5" fill={SERIES[0]} className="ad-dot" />
            </g>}
          </svg>
          {hover !== null && <div className="ad-tip" style={{ left: `${(x(hover) / W) * 100}%` }} role="status">
            <b>{day(current[hover].date)}</b>
            <span><i style={{ background: SERIES[0] }} />{rub(current[hover].revenue)} · {current[hover].orders} зак.</span>
            {compare && <span><i className="is-dashed" />{day(previous[hover].date)}: {rub(previous[hover].revenue)}</span>}
          </div>}
        </div>
      </figure>

      <figure className="ad-card ad-channels">
        <figcaption><b>Выручка по каналам</b></figcaption>
        <ul>{CHANNELS.map((c, i) => {
          const share = channelTotals[i] / now.revenue;
          return <li key={c.name}>
            <span className="ad-ch-name"><i style={{ background: SERIES[i] }} />{c.name}</span>
            <span className="ad-ch-bar"><span className="ad-bar" style={{ width: `${(share / Math.max(...channelTotals.map((t) => t / now.revenue))) * 100}%`, background: SERIES[i] }} /></span>
            <span className="ad-ch-val">{short(channelTotals[i])} ₽ <em>{Math.round(share * 100)}%</em></span>
          </li>;
        })}</ul>
      </figure>

      <figure className="ad-card ad-heatmap">
        <figcaption><b>Заказы по дням недели и часам</b>
          <span className="ad-scale"><em>меньше</em><i /><em>больше</em></span>
        </figcaption>
        <div className="ad-plot">
          <svg className="ad-heat" viewBox="0 0 720 196" role="img" aria-label="Тепловая карта заказов: пик по вечерам и в выходные">
            {heat.map((row, wd) => <g key={wd}>
              <text className="ad-axis" x="30" y={wd * 26 + 18} textAnchor="end">{WEEKDAYS[wd]}</text>
              {row.map((v, h) => <rect key={h} x={40 + h * 28} y={wd * 26 + 2} width="26" height="24" rx="4"
                fill={`color-mix(in oklab, #3987e5 ${Math.round(12 + (v / heatMax) * 88)}%, #1d2030)`}
                onPointerEnter={() => setCell({ d: wd, h })} onPointerLeave={() => setCell(null)} />)}
            </g>)}
            {[0, 6, 12, 18, 23].map((h) => <text key={h} className="ad-axis" x={40 + h * 28 + 13} y="194" textAnchor="middle">{h}:00</text>)}
          </svg>
          {cell && <div className="ad-tip" style={{ left: `${((40 + cell.h * 28 + 13) / 720) * 100}%`, top: `${((cell.d * 26) / 196) * 100}%` }} role="status">
            <b>{WEEKDAYS[cell.d]}, {cell.h}:00–{cell.h + 1}:00</b><span>{heat[cell.d][cell.h]} заказов за {span} дн.</span>
          </div>}
        </div>
      </figure>
    </div>}
  </div>;
}
