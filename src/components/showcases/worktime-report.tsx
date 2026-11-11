"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Clock, Download, RotateCcw, TriangleAlert } from "lucide-react";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { workbook } from "@/lib/docflow/files";
import { plural } from "@/lib/plural";
import { clock, computeWeek, dayKey, DAYS, hours, NORM, PEOPLE, sampleEvents, SHIFT_END, START, type DayResult, type Decisions } from "@/lib/worktime";
import type { ShowcaseProps } from "./registry";

const FROM = 7 * 60, TO = 21 * 60, SPAN = TO - FROM;
const HOURS = Array.from({ length: (TO - FROM) / 60 + 1 }, (_, i) => FROM + i * 60);
const DATES = ["5 октября", "6 октября", "7 октября", "8 октября", "9 октября"];
const TABS = [...DAYS, "Неделя"] as const;
const pct = (minute: number) => `${((minute - FROM) / SPAN) * 100}%`;
const dec = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

/** Splits a day's intervals at the minute the norm is reached, so the part past it can be drawn as overtime. */
function segments(day: DayResult) {
  let left = NORM;
  return day.intervals.flatMap((interval) => {
    if (interval.open || day.issue || day.skipped) return [{ ...interval, over: false }];
    const length = interval.to - interval.from;
    if (left >= length) { left -= length; return [{ ...interval, over: false }]; }
    const cut = interval.from + left;
    left = 0;
    return [...(cut > interval.from ? [{ from: interval.from, to: cut, over: false }] : []), { from: cut, to: interval.to, over: true }];
  });
}

/**
 * A week of door events turned into a working-time report. Each row is a person's day drawn
 * from the raw entries and exits: presence, the part past the norm, late arrivals, and the one
 * day that cannot be counted until someone decides what a missing exit means. The report
 * downloads as .xlsx. People, events and rules are a demonstration.
 */
export default function WorktimeReport({ mode }: ShowcaseProps) {
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const events = useMemo(() => sampleEvents(), []);
  const [decisions, setDecisions] = useState<Decisions>({});
  const [tab, setTab] = useState(2);
  const [person, setPerson] = useState(3);
  useGlassTabs(tabs, tab, setTab);
  const week = useMemo(() => computeWeek(events, decisions), [events, decisions]);
  const day = Math.min(tab, DAYS.length - 1);
  const selected = week.days.find((d) => d.person === person && d.day === day)!;
  const decision = decisions[dayKey(person, day)];
  const openDay = selected.intervals.some((i) => i.open) || decision === "close";

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      // The raw events land first, then each pair stretches into its interval.
      gsap.fromTo(".wt-dot", { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(3)", stagger: { each: 0.012, from: "start" } });
      gsap.fromTo(".wt-bar", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out", transformOrigin: "0 50%", delay: 0.25, stagger: 0.015 });
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [tab], revertOnUpdate: true });

  const decide = (value: Decisions[string]) => setDecisions((d) => ({ ...d, [dayKey(person, day)]: value }));
  const download = () => {
    const grid = [
      ["Отчёт о рабочем времени · 5–9 октября 2026 · демонстрационные данные"], [],
      ["Сотрудник", ...DAYS.map((d, i) => `${d}, ${DATES[i]}`), "Смен", "Отработано, ч", "Переработка засчитана, ч", "Опозданий", "Примечание"],
      ...week.people.map((p) => [p.name, ...p.days.map((d) => (d.issue ? "нет выхода" : d.skipped ? "не учтён" : d.worked ? dec(d.worked) : null)), p.shifts, dec(p.worked), dec(p.credited), p.late, p.issues ? "Есть день без выхода: требуется решение" : null]),
      [], ["Итого", ...DAYS.map(() => null), null, dec(week.worked), dec(week.credited), week.late, null],
    ];
    const url = URL.createObjectURL(new Blob([workbook(grid, "Отчёт", [[1, 1, 24], [2, 6, 16], [7, 10, 14], [11, 11, 40]]) as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    Object.assign(document.createElement("a"), { href: url, download: "Рабочее время 5–9 октября.xlsx" }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className={`wt wt-${mode}`} ref={root}>
    <header className="wt-head">
      <div className="wt-title"><h3>Рабочее время</h3><p>5–9 октября 2026 · события и сотрудники вымышлены</p></div>
      <div className="wt-switch" data-lg="surface">
        <div className="wt-tabs" ref={tabs} role="tablist" aria-label="День">
          {TABS.map((name, i) => <button key={name} type="button" role="tab" aria-selected={tab === i} tabIndex={tab === i ? 0 : -1}>{name}</button>)}
        </div>
      </div>
      <button type="button" className="button wt-export" data-lg="button" onClick={download}><Download aria-hidden="true" />Отчёт .xlsx</button>
    </header>

    <ul className="wt-kpis" aria-live="polite">
      <li><span>Отработано за неделю</span><b>{hours(week.worked)}</b></li>
      <li><span>Переработка засчитана</span><b>{hours(week.credited)}</b></li>
      <li><span>Опозданий</span><b>{week.late}</b></li>
      <li data-warn={week.issues > 0 || undefined}><span>Требуют решения</span><b>{week.issues} {plural(week.issues, "день", "дня", "дней")}</b></li>
    </ul>

    {tab < DAYS.length ? <div className="wt-body">
      <section className="wt-chart" aria-label={`Присутствие за ${DAYS[day]}, ${DATES[day]}`}>
        <div className="wt-axis" aria-hidden="true">{HOURS.map((h) => <i key={h} style={{ left: pct(h) }}>{h / 60}</i>)}</div>
        <ul className="wt-rows">
          {PEOPLE.map((name, p) => {
            const d = week.days.find((x) => x.person === p && x.day === day)!;
            const marks = events.filter((e) => e.person === p && e.day === day);
            return <li key={name}>
              <button type="button" className="wt-row" aria-pressed={person === p} onClick={() => setPerson(p)}
                aria-label={`${name}: ${d.issue ? "нет отметки выхода" : d.worked ? `отработано ${hours(d.worked)}` : d.skipped ? "день не учтён" : "нет отметок"}`}>
                <span className="wt-who">{name}{d.issue && <TriangleAlert aria-hidden="true" />}</span>
                <span className="wt-track">
                  <i className="wt-shift" style={{ left: pct(START), width: `${((SHIFT_END - START) / SPAN) * 100}%` }} />
                  {segments(d).map((s, i) => <i key={i} className="wt-bar" data-over={s.over || undefined} data-open={(s as { open?: boolean }).open || undefined} data-skip={d.skipped || undefined} style={{ left: pct(s.from), width: `${((s.to - s.from) / SPAN) * 100}%` }} />)}
                  {d.late > 0 && <i className="wt-late" style={{ left: pct(START), width: `${(d.late / SPAN) * 100}%` }} />}
                  {marks.map((e, i) => <i key={i} className="wt-dot" data-dir={e.direction} style={{ left: pct(e.minute) }} />)}
                </span>
                <span className="wt-sum">{d.issue ? "?" : d.worked ? hours(d.worked) : "—"}</span>
              </button>
            </li>;
          })}
        </ul>
        <ul className="wt-legend" aria-hidden="true">
          <li><i data-k="work" />в пределах нормы</li><li><i data-k="over" />сверх 8 часов</li><li><i data-k="late" />опоздание</li><li><i data-k="open" />нет выхода</li><li><i data-k="dot" />отметка на входе или выходе</li>
        </ul>
      </section>

      <aside className="wt-card" aria-live="polite">
        <p className="wt-card-day">{DAYS[day]}, {DATES[day]}</p>
        <h4>{PEOPLE[person]}</h4>
        {selected.intervals.length ? <ol className="wt-intervals">
          {selected.intervals.map((i, n) => <li key={n} data-open={i.open || undefined}><Clock aria-hidden="true" />{clock(i.from)} – {i.open ? "нет выхода" : clock(i.to)}{!i.open && <em>{hours(i.to - i.from)}</em>}</li>)}
        </ol> : <p className="wt-none">В этот день отметок нет.</p>}
        {selected.issue ? <div className="wt-issue">
          <p><TriangleAlert aria-hidden="true" />Последний вход без выхода. День не считается, пока вы не решите, что это было.</p>
          <div><button type="button" onClick={() => decide("close")}>Закрыть в {clock(SHIFT_END)}</button><button type="button" onClick={() => decide("skip")}>Не учитывать день</button></div>
        </div> : <dl className="wt-facts">
          <div><dt>Отработано</dt><dd>{selected.worked ? hours(selected.worked) : "—"}</dd></div>
          <div><dt>Сверх нормы</dt><dd>{selected.overtime ? hours(selected.overtime) : "—"}</dd></div>
          <div><dt>Засчитано</dt><dd>{selected.credited ? hours(selected.credited) : "—"}</dd></div>
          <div><dt>Опоздание</dt><dd data-warn={selected.late > 0 || undefined}>{selected.late ? `${selected.late} мин` : "нет"}</dd></div>
        </dl>}
        {openDay && decision && <p className="wt-decided"><Check aria-hidden="true" />{decision === "close" ? `Выход проставлен вручную: ${clock(SHIFT_END)}.` : "День исключён из расчёта."}<button type="button" onClick={() => decide(undefined)}><RotateCcw aria-hidden="true" />Вернуть</button></p>}
        {selected.duplicates > 0 && <p className="wt-dup">Двойное срабатывание считывателя убрано автоматически: {selected.duplicates}.</p>}
      </aside>
    </div> : <div className="wt-table" tabIndex={0}>
      <table>
        <caption>Часы по дням и итоги недели</caption>
        <thead><tr><th scope="col">Сотрудник</th>{DAYS.map((d) => <th scope="col" key={d}>{d}</th>)}<th scope="col">Смен</th><th scope="col">Отработано</th><th scope="col">Засчитано сверх</th><th scope="col">Опозданий</th></tr></thead>
        <tbody>{week.people.map((p) => <tr key={p.name}>
          <th scope="row">{p.name}</th>
          {p.days.map((d) => <td key={d.day} data-warn={d.issue || undefined} data-over={d.credited > 0 || undefined}>{d.issue ? "нет выхода" : d.skipped ? "не учтён" : d.worked ? hours(d.worked) : "—"}</td>)}
          <td>{p.shifts}</td><td>{hours(p.worked)}</td><td>{p.credited ? hours(p.credited) : "—"}</td><td>{p.late || "—"}</td>
        </tr>)}</tbody>
        <tfoot><tr><th scope="row">Итого</th><td colSpan={DAYS.length + 1} /><td>{hours(week.worked)}</td><td>{hours(week.credited)}</td><td>{week.late}</td></tr></tfoot>
      </table>
    </div>}

    <p className="wt-foot">Правила демо: норма 8 часов, начало в 9:00 с допуском 5 минут, переработка засчитывается полными получасами. Исходные события не меняются: решения хранятся отдельно.</p>
  </div>;
}
