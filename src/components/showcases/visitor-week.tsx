"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleCheck, Download, FileJson, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import { workbook } from "@/lib/docflow/files";
import { brokenWeek, COUNTERS, dayLabel, parse, sha256Hex, total, validate, WEEK, type Day } from "@/lib/visitors";
import type { ShowcaseProps } from "./registry";

const TABS = ["Неделя", "Этажи", "Таблица"] as const;
const SOURCES = ["Контрольная неделя", "Выгрузка с ошибками"] as const;
const fmt = (n: number) => n.toLocaleString("ru-RU");
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const save = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * The visitor-report pipeline as a page: a week of counter readings is checked before anything
 * is written, shown by day, by floor and as the rows that go into the report template, and only a
 * clean week produces the .xlsx together with a manifest line holding both SHA-256 hashes.
 * The control week is demonstration data; a JSON export in the same shape can be dropped in.
 */
export default function VisitorWeek({ mode }: ShowcaseProps) {
  const tabs = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(0);
  useGlassTabs(tabs, tab, setTab);
  const [source, setSource] = useState(0);
  const [own, setOwn] = useState<{ name: string; days: Day[]; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [manifest, setManifest] = useState<string | null>(null);
  const [sourceHash, setSourceHash] = useState("");

  const days = useMemo(() => (own && source === 2 ? own.days : source === 1 ? brokenWeek() : WEEK), [own, source]);
  const text = useMemo(() => (own && source === 2 ? own.text : JSON.stringify(days)), [own, source, days]);
  const issues = useMemo(() => validate(days), [days]);
  const bad = useMemo(() => new Set(issues.map((i) => i.date)), [issues]);
  const unique = useMemo(() => days.filter((d, i) => days.findIndex((x) => x.date === d.date) === i), [days]);

  useEffect(() => {
    let live = true;
    sha256Hex(text).then((h) => live && setSourceHash(h));
    return () => { live = false; };
  }, [text]);

  const pick = (i: number) => { setSource(i); setManifest(null); setFocus(null); };
  const upload = async (file: File | undefined) => {
    if (!file) return;
    const body = await file.text();
    const result = parse(body);
    if ("error" in result) { setError(result.error); return; }
    setError(null); setOwn({ name: file.name, days: result.days, text: body }); pick(2);
  };
  const build = async () => {
    const grid = [
      ["Отчёт о посещаемости · неделя " + `${dayLabel(unique[0].date)} — ${dayLabel(unique.at(-1)!.date)}`], [],
      ["Дата", "День", ...COUNTERS.map((c) => c.label), "Итого входов"],
      ...unique.map((d) => [dayLabel(d.date), d.weekday, ...COUNTERS.map((c) => d.values[c.key] ?? null), d.total]),
      [], ["Итого", null, ...COUNTERS.map((c) => unique.reduce((s, d) => s + (d.values[c.key] ?? 0), 0)), total(unique)],
    ];
    const bytes = workbook(grid, "Неделя", [[1, 1, 14], [2, 2, 6], [3, 7, 22], [8, 8, 14]]);
    const result = await sha256Hex(bytes);
    setManifest(JSON.stringify({ source: sourceHash, result, rows: unique.length, completed: true, templateUnchanged: true }));
    save(new Blob([bytes as BlobPart], { type: XLSX }), "Посещаемость за неделю.xlsx");
  };

  const peak = Math.max(...unique.map((d) => d.total));

  return <div className={`vw vw-${mode}`}>
    <header className="vw-head">
      <div className="vw-title"><h3>Недельный отчёт посетителей</h3><p>Счётчики на входах и этажах · демонстрационные данные</p></div>
      <div className="vw-switch" data-lg="surface">
        <div className="vw-tabs" ref={tabs} role="tablist" aria-label="Вид">
          {TABS.map((name, i) => <button key={name} type="button" role="tab" aria-selected={tab === i} tabIndex={tab === i ? 0 : -1}>{name}</button>)}
        </div>
      </div>
    </header>

    <div className="vw-sources" role="radiogroup" aria-label="Источник данных">
      {SOURCES.map((name, i) => <button key={name} type="button" role="radio" aria-checked={source === i} onClick={() => pick(i)}>{name}</button>)}
      {own && <button type="button" role="radio" aria-checked={source === 2} onClick={() => pick(2)}><FileJson aria-hidden="true" />{own.name}</button>}
      <label className="vw-upload"><Upload aria-hidden="true" />Свой файл .json<input type="file" accept="application/json,.json" onChange={(e) => upload(e.target.files?.[0])} /></label>
      <button type="button" className="vw-sample" onClick={() => save(new Blob([JSON.stringify(WEEK, null, 2)], { type: "application/json" }), "Образец выгрузки.json")}><Download aria-hidden="true" />Образец</button>
    </div>
    {error && <p className="vw-error" role="alert">{error}</p>}

    <div className="vw-body">
      <section className="vw-view" aria-label={TABS[tab]}>
        {tab === 0 && <Week days={unique} bad={bad} focus={focus} peak={peak} />}
        {tab === 1 && <Floors days={unique} focus={focus} />}
        {tab === 2 && <Table days={days} issues={issues} focus={focus} />}
      </section>

      <aside className="vw-check" aria-live="polite">
        <p className="vw-sum"><span>Входов за неделю</span><b>{fmt(total(unique))}</b></p>
        {issues.length ? <>
          <p className="vw-state" data-bad><TriangleAlert aria-hidden="true" />{issues.length} {issues.length === 1 ? "замечание" : issues.length < 5 ? "замечания" : "замечаний"} — отчёт не формируется</p>
          <ul className="vw-issues">{issues.map((i, n) => <li key={n}><button type="button" aria-pressed={focus === i.date} onClick={() => setFocus(focus === i.date ? null : i.date)}><b>{dayLabel(i.date)}</b>{i.text}</button></li>)}</ul>
        </> : <p className="vw-state"><CircleCheck aria-hidden="true" />Проверка пройдена: пропусков, повторов и расхождений нет</p>}
        <button type="button" className="button" data-lg="button" data-lg-variant="prominent" disabled={issues.length > 0 || !unique.length} onClick={build}><FileSpreadsheet aria-hidden="true" />Сформировать отчёт .xlsx</button>
        <dl className="vw-hash">
          <div><dt>SHA-256 выгрузки</dt><dd><code>{sourceHash.slice(0, 24)}…</code></dd></div>
          {manifest && <div><dt>Запись в журнал запусков</dt><dd><code className="vw-jsonl">{manifest}</code></dd></div>}
        </dl>
        <p className="vw-muted">Правила демо: у каждого дня пять счётчиков, итог равен сумме двух входов, даты идут подряд и не повторяются.</p>
      </aside>
    </div>
  </div>;
}

function Week({ days, bad, focus, peak }: { days: Day[]; bad: Set<string>; focus: string | null; peak: number }) {
  const top = Math.ceil(peak / 1000) * 1000 || 1000;
  return <figure className="vw-week">
    <figcaption><span><i data-k="ground" />вход с первого этажа</span><span><i data-k="lower" />вход с нижнего уровня</span></figcaption>
    <div className="vw-bars">
      <div className="vw-grid" aria-hidden="true">{[1, 0.75, 0.5, 0.25].map((f) => <i key={f} style={{ bottom: `${f * 100}%` }}><span>{fmt(top * f)}</span></i>)}</div>
      {days.map((d) => {
        const lower = d.values.lower_level_entry ?? 0, ground = d.values.ground_floor_entry ?? 0;
        return <div key={d.date} className="vw-col" data-bad={bad.has(d.date) || undefined} data-focus={focus === d.date || undefined} data-peak={d.total === peak || undefined}
          title={`${dayLabel(d.date)}: ${fmt(d.total)} входов — ${fmt(ground)} с первого этажа, ${fmt(lower)} с нижнего уровня`}>
          <b>{fmt(d.total)}</b>
          <div className="vw-stack" style={{ height: `${(d.total / top) * 100}%` }}>
            <i data-k="ground" style={{ flexGrow: ground }} /><i data-k="lower" style={{ flexGrow: lower }} />
          </div>
          <span>{d.weekday}<small>{dayLabel(d.date).split(" ")[0]}</small></span>
        </div>;
      })}
    </div>
  </figure>;
}

function Floors({ days, focus }: { days: Day[]; focus: string | null }) {
  return <div className="vw-floors" role="table" aria-label="Показания счётчиков по дням" style={{ "--n": days.length } as React.CSSProperties}>
    <div role="row" className="vw-frow vw-fhead"><span role="columnheader">Счётчик</span>{days.map((d) => <span role="columnheader" key={d.date} data-focus={focus === d.date || undefined}>{d.weekday} {dayLabel(d.date).split(" ")[0]}</span>)}</div>
    {COUNTERS.map((c) => {
      const present = days.map((d) => d.values[c.key]).filter((v): v is number => v !== undefined);
      const max = Math.max(...present, 1), min = Math.min(...present, max);
      return <div role="row" className="vw-frow" key={c.key}>
        <span role="rowheader">{c.short}</span>
        {days.map((d) => {
          const v = d.values[c.key];
          return <span role="cell" key={d.date} className="vw-cell" data-missing={v === undefined || undefined} data-focus={focus === d.date || undefined}
            style={v === undefined ? undefined : { "--t": (0.2 + 0.8 * ((v - min) / Math.max(1, max - min))).toFixed(2) } as React.CSSProperties}>{v === undefined ? "нет" : fmt(v)}</span>;
        })}
      </div>;
    })}
  </div>;
}

function Table({ days, issues, focus }: { days: Day[]; issues: ReturnType<typeof validate>; focus: string | null }) {
  const flagged = (date: string, key?: string) => issues.some((i) => i.date === date && (key ? i.counter === key : !i.counter));
  return <div className="vw-table" tabIndex={0}>
    <table>
      <caption>Строки, которые лягут в шаблон отчёта</caption>
      <thead><tr><th scope="col">Дата</th>{COUNTERS.map((c) => <th scope="col" key={c.key}>{c.short}</th>)}<th scope="col">Итого</th></tr></thead>
      <tbody>{days.map((d, n) => <tr key={n} data-focus={focus === d.date || undefined} data-bad={flagged(d.date) || undefined}>
        <th scope="row">{d.weekday}, {dayLabel(d.date)}</th>
        {COUNTERS.map((c) => <td key={c.key} data-bad={flagged(d.date, c.key) || undefined}>{d.values[c.key] === undefined ? "—" : fmt(d.values[c.key]!)}</td>)}
        <td>{fmt(d.total)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
