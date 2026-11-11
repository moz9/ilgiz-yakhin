"use client";

import { useMemo, useRef, useState } from "react";
import { Archive, Check, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, RotateCcw, TriangleAlert, Upload } from "lucide-react";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { docx, exportTimesheet, importTimesheet, packageZip } from "@/lib/docflow/files";
import { buildDocuments, evaluate, REASONS, sumHours, type Doc, type Issue, type Row } from "@/lib/docflow/rules";
import { MONTH, ORG, PEOPLE, sampleRows } from "@/lib/docflow/sample";
import { day, MONTH_NAMES, plural } from "@/lib/docflow/text";
import type { ShowcaseProps } from "./registry";

const [YEAR, MONTH_NUMBER] = MONTH.split("-").map(Number);
const DAYS = Array.from({ length: new Date(Date.UTC(YEAR, MONTH_NUMBER, 0)).getUTCDate() }, (_, i) => i + 1);
const WEEKEND = new Set(DAYS.filter((d) => [0, 6].includes(day(YEAR, MONTH_NUMBER, d).getUTCDay())));
const TABS = ["Табель", "Замечания", "Документы"] as const;
const money = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;
const numberOrNull = (text: string) => { const n = Number(text.replace(",", ".")); return text.trim() === "" || !Number.isFinite(n) ? null : n; };

function save(bytes: Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * From a timesheet to a set of personnel documents, in the browser. The sheet is checked row
 * by row; a row with a remark produces nothing until the remark is resolved, and every clean
 * row becomes an order and an agreement with declined names, the sum in words and a working-day
 * date. The set downloads as real .docx files. All people and numbers are invented.
 */
export default function DocumentFactory({ mode }: ShowcaseProps) {
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const seen = useRef<Set<string> | null>(null);
  const [rows, setRows] = useState(sampleRows);
  const [activeId, setActiveId] = useState("");
  const [tab, setTab] = useState(0);
  const [focus, setFocus] = useState("");
  const [note, setNote] = useState("");
  useGlassTabs(tabs, tab, setTab);

  const result = useMemo(() => evaluate(rows, PEOPLE, MONTH), [rows]);
  const docs = useMemo(() => buildDocuments(result, MONTH, ORG), [result]);
  const index = Math.max(0, docs.findIndex((doc) => doc.id === activeId));
  const active: Doc | undefined = docs[index];
  const flagged = new Set(result.issues.map((issue) => issue.rowId));
  const amounts = new Map(result.awards.flatMap((award) => award.rows.map((row) => [row.id, award.amount] as const)));

  const patch = (id: string, change: Partial<Row>) => setRows((list) => list.map((row) => (row.id === id ? { ...row, ...change } : row)));
  const mark = (row: Row, d: number, text: string) => {
    const marks = { ...row.marks }, value = numberOrNull(text);
    if (value) marks[d] = value; else delete marks[d];
    patch(row.id, { marks });
  };
  const show = (rowId: string) => {
    setFocus(rowId);
    root.current?.querySelector(`[data-row="${rowId}"]`)?.scrollIntoView({ block: "nearest", inline: "start", behavior: "smooth" });
  };
  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      setRows(importTimesheet(new Uint8Array(await file.arrayBuffer()), MONTH));
      setNote(`Загружен «${file.name}».`);
    } catch (error) { setNote(error instanceof Error ? error.message : "Файл не прочитан."); }
    if (picker.current) picker.current.value = "";
  };

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      // Documents that have just been released are dealt onto the stack; a plain switch only slides the page.
      const fresh = docs.filter((doc) => seen.current && !seen.current.has(doc.id)).map((doc) => doc.id);
      if (fresh.length) {
        gsap.fromTo(".df-paper", { y: 46, rotate: -5, scale: 0.94 }, { y: 0, rotate: 0, scale: 1, duration: 0.7, ease: "back.out(1.4)" });
        gsap.fromTo(fresh.map((id) => `[data-doc="${id}"]`).join(","), { scale: 0.6, y: 14 }, { scale: 1, y: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.05 });
      } else if (seen.current) gsap.fromTo(".df-paper", { y: 14, rotate: 0.8 }, { y: 0, rotate: 0, duration: 0.35, ease: "power3.out" });
    });
    seen.current = new Set(docs.map((doc) => doc.id));
    // The open document's chip stays in view in the horizontal list.
    const list = root.current?.querySelector<HTMLElement>(".df-list"), chip = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (list && chip) list.scrollTo({ left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
    return () => mm.revert();
  }, { scope: root, dependencies: [docs.map((doc) => doc.id).join(), active?.id] });

  const fix = (issue: Issue) => {
    const row = rows.find((r) => r.id === issue.rowId)!;
    if (issue.kind === "person") return <select aria-label={`Сотрудник для строки «${row.name}»`} value="" onChange={(e) => patch(row.id, { personCode: e.target.value })}>
      <option value="" disabled>Выбрать сотрудника</option>
      {issue.candidates!.map((p) => <option key={p.code} value={p.code}>{p.name}, {p.position}</option>)}
    </select>;
    if (issue.kind === "total") return <button type="button" onClick={() => patch(row.id, { reported: issue.sum! })}>Принять {issue.sum} ч по датам</button>;
    if (issue.kind === "reason") return <select aria-label={`Основание для строки «${row.name}»`} value="" onChange={(e) => patch(row.id, { reason: e.target.value })}>
      <option value="" disabled>Выбрать основание</option>
      {REASONS.map((reason) => <option key={reason}>{reason}</option>)}
    </select>;
    if (issue.kind === "replaced") return <select aria-label={`За кого работал(а) «${row.name}»`} value="" onChange={(e) => patch(row.id, { replaced: e.target.value })}>
      <option value="" disabled>За кого работал(а)</option>
      {PEOPLE.map((p) => <option key={p.code}>{p.name}</option>)}
    </select>;
    return <button type="button" onClick={() => { setTab(0); show(row.id); }}>Показать в табеле</button>;
  };

  return <div className={`df df-${mode}`} ref={root} data-tab={tab}>
    <header className="df-head">
      <div className="df-title">
        <h3>Документы из табеля</h3>
        <p>{MONTH_NAMES[MONTH_NUMBER - 1]} {YEAR} · все люди и суммы вымышлены</p>
      </div>
      <ul className="df-stats" aria-live="polite">
        <li data-warn={result.issues.length > 0 || undefined}><b>{result.issues.length}</b>{plural(result.issues.length, ["замечание", "замечания", "замечаний"])}</li>
        <li><b>{docs.length}</b>{plural(docs.length, ["документ", "документа", "документов"])}</li>
        <li><b>{money(result.total)}</b>к выплате</li>
      </ul>
      <div className="df-tools">
        <button type="button" onClick={() => save(exportTimesheet(sampleRows(), MONTH), "Табель-образец.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}><FileSpreadsheet aria-hidden="true" />Образец .xlsx</button>
        <button type="button" onClick={() => picker.current?.click()}><Upload aria-hidden="true" />Загрузить .xlsx</button>
        <button type="button" aria-label="Вернуть исходный табель" title="Вернуть исходный табель" onClick={() => { setRows(sampleRows()); setNote(""); setFocus(""); }}><RotateCcw aria-hidden="true" /></button>
        <input ref={picker} type="file" accept=".xlsx" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </div>
    </header>
    {note && <p className="df-note" role="status">{note}</p>}

    <div className="df-switch" data-lg="surface">
      <div className="df-tabs" ref={tabs} role="tablist" aria-label="Шаг">
        {TABS.map((name, i) => <button key={name} type="button" role="tab" aria-selected={tab === i} tabIndex={tab === i ? 0 : -1}>{name}{i === 1 && result.issues.length > 0 && <i>{result.issues.length}</i>}{i === 2 && <i>{docs.length}</i>}</button>)}
      </div>
    </div>

    <div className="df-body">
      <section className="df-sheet" aria-label="Табель дополнительной работы">
        <div className="df-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col" className="df-name">ФИО</th>
                {DAYS.map((d) => <th scope="col" key={d} data-weekend={WEEKEND.has(d) || undefined}>{d}</th>)}
                <th scope="col">Часов</th><th scope="col">Оклад</th><th scope="col">Норма, ч</th><th scope="col">Причина</th><th scope="col">Работал(а) за</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const sum = sumHours(row), bad = (kind: string) => result.issues.some((issue) => issue.id === `${row.id}:${kind}`) || undefined;
                return <tr key={row.id} data-row={row.id} data-flag={flagged.has(row.id) || undefined} data-focus={focus === row.id || undefined}>
                  <th scope="row" className="df-name" data-bad={bad("person")}>
                    <span>{row.name}</span>
                    {amounts.has(row.id) ? <small className="df-ok"><Check aria-hidden="true" />{money(amounts.get(row.id)!)}</small> : <small className="df-wait"><TriangleAlert aria-hidden="true" />ждёт проверки</small>}
                  </th>
                  {DAYS.map((d) => <td key={d} data-weekend={WEEKEND.has(d) || undefined} data-on={row.marks[d] ? true : undefined}>
                    <input inputMode="decimal" aria-label={`${row.name}, ${d} число, часы`} value={row.marks[d] ?? ""} onChange={(e) => mark(row, d, e.target.value)} />
                  </td>)}
                  <td className="df-num" data-bad={bad("total") || bad("hours")}><input inputMode="decimal" aria-label={`${row.name}, итог часов`} value={row.reported ?? ""} onChange={(e) => patch(row.id, { reported: numberOrNull(e.target.value) })} />{row.reported !== sum && <small>по датам {sum}</small>}</td>
                  <td className="df-num" data-bad={bad("salary")}><input inputMode="decimal" aria-label={`${row.name}, оклад`} value={row.salary ?? ""} onChange={(e) => patch(row.id, { salary: numberOrNull(e.target.value) })} /></td>
                  <td className="df-num" data-bad={bad("norm")}><input inputMode="decimal" aria-label={`${row.name}, норма часов`} value={row.normHours ?? ""} onChange={(e) => patch(row.id, { normHours: numberOrNull(e.target.value) })} /></td>
                  <td className="df-text" data-bad={bad("reason")}><select aria-label={`${row.name}, причина`} value={row.reason} onChange={(e) => patch(row.id, { reason: e.target.value })}><option value="">не указана</option>{REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select></td>
                  <td className="df-text" data-bad={bad("replaced")}><input aria-label={`${row.name}, работал(а) за`} value={row.replaced} onChange={(e) => patch(row.id, { replaced: e.target.value })} /></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <p className="df-foot">Ячейки можно править. Кадровые сведения: {PEOPLE.length} {plural(PEOPLE.length, ["сотрудник", "сотрудника", "сотрудников"])}, по ним подбираются полное ФИО, должность и трудовой договор.</p>
      </section>

      <section className="df-issues" aria-label="Замечания">
        {result.issues.length ? <ul>
          {result.issues.map((issue) => <li key={issue.id} onPointerEnter={() => setFocus(issue.rowId)}>
            <TriangleAlert aria-hidden="true" /><p>{issue.text}</p>{fix(issue)}
          </li>)}
        </ul> : <p className="df-clear"><Check aria-hidden="true" />Замечаний нет: все строки табеля превратились в документы.</p>}
      </section>

      <section className="df-docs" aria-label="Комплект документов">
        {active ? <>
          <ol className="df-list">
            {docs.map((doc) => <li key={doc.id}><button type="button" data-doc={doc.id} aria-pressed={doc.id === active.id} onClick={() => setActiveId(doc.id)}>
              <FileText aria-hidden="true" /><span>{doc.title}<small>{doc.subtitle}</small></span>
            </button></li>)}
          </ol>
          <div className="df-desk">
            <article className="df-paper" aria-label={`${active.title}, ${active.subtitle}`} tabIndex={0}>
              <div className="df-page">
                {active.blocks.map((block, i) => <p key={i} data-align={block.align} data-bold={block.bold || undefined} data-gap={block.gap || undefined} data-indent={block.indent || undefined}>{block.text}</p>)}
              </div>
            </article>
          </div>
          <div className="df-actions">
            <div className="df-pager">
              <button type="button" aria-label="Предыдущий документ" onClick={() => setActiveId(docs[(index - 1 + docs.length) % docs.length].id)}><ChevronLeft aria-hidden="true" /></button>
              <span>{index + 1} / {docs.length}</span>
              <button type="button" aria-label="Следующий документ" onClick={() => setActiveId(docs[(index + 1) % docs.length].id)}><ChevronRight aria-hidden="true" /></button>
            </div>
            <button type="button" className="button" data-lg="button" onClick={() => save(docx(active), active.file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}><Download aria-hidden="true" />.docx</button>
            <button type="button" className="button button-primary" data-lg="button" data-lg-variant="prominent" onClick={() => save(packageZip(docs), `Комплект ${MONTH}.zip`, "application/zip")}><Archive aria-hidden="true" />Комплект .zip</button>
          </div>
        </> : <p className="df-empty">Пока ни одна строка не прошла проверку. Разберите замечания — документы появятся здесь.</p>}
      </section>
    </div>
  </div>;
}
