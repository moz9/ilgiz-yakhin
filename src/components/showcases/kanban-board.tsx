"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Flip } from "gsap/Flip";
import { ArrowLeft, ArrowRight, Plus, RotateCcw, Search, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import type { ShowcaseProps } from "./registry";

gsap.registerPlugin(Flip);

type Column = "backlog" | "doing" | "review" | "done";
type Card = { id: string; title: string; tag: Tag; who: string; due: string; priority: 1 | 2 | 3; column: Column; notes: string; checks: { text: string; done: boolean }[] };
type Tag = "Дизайн" | "Фронтенд" | "Бэкенд" | "QA";
const COLUMNS: { key: Column; title: string; limit?: number }[] = [
  { key: "backlog", title: "Бэклог" }, { key: "doing", title: "В работе", limit: 3 }, { key: "review", title: "На проверке" }, { key: "done", title: "Готово" },
];
const TAGS: Tag[] = ["Дизайн", "Фронтенд", "Бэкенд", "QA"];
const TAG_COLOR: Record<Tag, string> = { Дизайн: "#d55181", Фронтенд: "#3987e5", Бэкенд: "#199e70", QA: "#c98500" };
const PEOPLE: Record<string, string> = { ИЯ: "#5b7bff", АК: "#2fd3a0", МС: "#ff8a3d", ДП: "#b46bff" };
const STORE = "showcase-kanban-v1";
const SEED: Card[] = [
  { id: "c1", title: "Макет карточки товара", tag: "Дизайн", who: "МС", due: "12 нояб", priority: 2, column: "backlog", notes: "Две версии: со скидкой и без. Фото — квадрат.", checks: [{ text: "Состояния кнопки", done: false }, { text: "Тёмная тема", done: false }] },
  { id: "c2", title: "Фильтр каталога по цене", tag: "Фронтенд", who: "ИЯ", due: "14 нояб", priority: 1, column: "backlog", notes: "Двойной ползунок, значения в URL.", checks: [{ text: "Ползунок", done: false }, { text: "Синхронизация с URL", done: false }] },
  { id: "c3", title: "Webhook оплаты", tag: "Бэкенд", who: "АК", due: "11 нояб", priority: 1, column: "doing", notes: "Проверка подписи, идемпотентность по id платежа.", checks: [{ text: "Подпись", done: true }, { text: "Повторы", done: false }] },
  { id: "c4", title: "Корзина на телефоне", tag: "Фронтенд", who: "ИЯ", due: "13 нояб", priority: 2, column: "doing", notes: "Липкая кнопка оформления, свайп для удаления.", checks: [{ text: "Свайп", done: true }, { text: "Пустое состояние", done: false }] },
  { id: "c5", title: "Тесты оформления заказа", tag: "QA", who: "ДП", due: "15 нояб", priority: 2, column: "review", notes: "Playwright: гость, авторизованный, промокод.", checks: [{ text: "Гость", done: true }, { text: "Промокод", done: true }] },
  { id: "c6", title: "Иконки разделов", tag: "Дизайн", who: "МС", due: "8 нояб", priority: 3, column: "done", notes: "24 иконки в одном стиле, SVG-спрайт.", checks: [{ text: "Экспорт", done: true }] },
  { id: "c7", title: "Индексы для поиска", tag: "Бэкенд", who: "АК", due: "9 нояб", priority: 2, column: "done", notes: "Триграммы по названию и артикулу.", checks: [{ text: "Миграция", done: true }] },
  { id: "c8", title: "Письмо о доставке", tag: "Бэкенд", who: "АК", due: "16 нояб", priority: 3, column: "backlog", notes: "Шаблон и трекинг-ссылка.", checks: [] },
];

/**
 * A kanban task board: cards drag between columns with the mouse or a finger while the rest
 * make room (GSAP Flip), move by keyboard too, filter by text and tag, open into a detail
 * panel with a checklist, and the "in progress" column warns past its limit. Saved locally.
 */
export default function KanbanBoard({ mode }: ShowcaseProps) {
  // The demo renders on the client only, so the saved board can be read right in the initial state.
  const [cards, setCards] = useState<Card[]>(() => {
    try { const saved = localStorage.getItem(STORE); if (saved) return JSON.parse(saved); } catch { /* fresh board */ }
    return SEED;
  });
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<Tag | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState<Column | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; w: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const flip = useRef<Flip.FlipState | null>(null);
  // Every change is saved; storage may be blocked, the board still works.
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(cards)); } catch { /* not saved */ } }, [cards]);

  // Every change of order or filter animates from the previous layout.
  const change = (next: (cards: Card[]) => Card[]) => {
    if (root.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) flip.current = Flip.getState(root.current.querySelectorAll(".kb-card"));
    setCards(next);
  };
  const filterTo = (fn: () => void) => {
    if (root.current) flip.current = Flip.getState(root.current.querySelectorAll(".kb-card"));
    fn();
  };
  useLayoutEffect(() => {
    if (!flip.current) return;
    Flip.from(flip.current, { duration: 0.45, ease: "power3.inOut", absolute: true, nested: true, onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3 }), onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.2 }) });
    flip.current = null;
  });

  const move = (id: string, column: Column, index?: number) => change((list) => {
    const card = list.find((c) => c.id === id)!;
    const rest = list.filter((c) => c.id !== id);
    const inColumn = rest.filter((c) => c.column === column);
    const at = index ?? inColumn.length;
    const anchor = inColumn[at];
    const moved = { ...card, column };
    if (!anchor) { const lastIndex = rest.map((c) => c.column).lastIndexOf(column); rest.splice(lastIndex + 1 || rest.length, 0, moved); return [...rest]; }
    rest.splice(rest.indexOf(anchor), 0, moved);
    return rest;
  });
  const step = (id: string, dir: -1 | 1) => {
    const card = cards.find((c) => c.id === id)!;
    const i = COLUMNS.findIndex((c) => c.key === card.column) + dir;
    if (COLUMNS[i]) move(id, COLUMNS[i].key);
  };

  // Pointer drag: a lifted copy follows the pointer and the board reorders live under it.
  const start = useRef<{ id: string; x: number; y: number; dx: number; dy: number; w: number } | null>(null);
  // A drag ends with a click on the same card: that click must not open the panel.
  const dragged = useRef(false);
  const down = (event: React.PointerEvent, id: string) => {
    if ((event.target as HTMLElement).closest("button")) return;
    // A drag that ended outside its card produced no click: start every press clean.
    dragged.current = false;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    start.current = { id, x: event.clientX, y: event.clientY, dx: event.clientX - box.left, dy: event.clientY - box.top, w: box.width };
  };
  useEffect(() => {
    const host = root.current!;
    let last = "";
    const moveAt = (event: PointerEvent) => {
      const s = start.current;
      if (!s) return;
      if (!drag && Math.hypot(event.clientX - s.x, event.clientY - s.y) < 6) return;
      event.preventDefault();
      dragged.current = true;
      const r = host.getBoundingClientRect();
      setDrag({ id: s.id, x: event.clientX - r.left - s.dx + host.scrollLeft, y: event.clientY - r.top - s.dy + host.scrollTop, w: s.w });
      const under = document.elementsFromPoint(event.clientX, event.clientY).find((el) => (el as HTMLElement).dataset?.column) as HTMLElement | undefined;
      if (!under) return;
      const column = under.dataset.column as Column;
      const others = [...under.querySelectorAll<HTMLElement>(".kb-card")].filter((el) => el.dataset.flipId !== s.id);
      const index = others.findIndex((el) => { const b = el.getBoundingClientRect(); return event.clientY < b.top + b.height / 2; });
      const key = `${column}:${index}`;
      if (key !== last) { last = key; move(s.id, column, index < 0 ? undefined : index); }
    };
    const up = () => { start.current = null; last = ""; setDrag(null); };
    window.addEventListener("pointermove", moveAt, { passive: false });
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", moveAt); window.removeEventListener("pointerup", up); };
  });

  const visible = (c: Card) => (!tag || c.tag === tag) && (!query || c.title.toLowerCase().includes(query.toLowerCase()));
  const current = cards.find((c) => c.id === open);
  const update = (id: string, patch: Partial<Card>) => setCards((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const add = (column: Column, title: string) => {
    if (!title.trim()) { setAdding(null); return; }
    change((list) => [...list, { id: `c${Date.now()}`, title: title.trim(), tag: tag ?? "Фронтенд", who: "ИЯ", due: "без срока", priority: 2, column, notes: "", checks: [] }]);
    setAdding(null);
  };
  const lifted = drag && cards.find((c) => c.id === drag.id);

  const face = (card: Card) => <>
    <span className="kb-tag" style={{ "--tag": TAG_COLOR[card.tag] } as React.CSSProperties}>{card.tag}</span>
    <b>{card.title}</b>
    <span className="kb-meta">
      <span className="kb-who" style={{ background: PEOPLE[card.who] }} aria-label={`Исполнитель ${card.who}`}>{card.who}</span>
      <span>{card.due}</span>
      {card.checks.length > 0 && <span>✓ {card.checks.filter((c) => c.done).length}/{card.checks.length}</span>}
      <span className="kb-prio" data-p={card.priority} aria-label={`Приоритет ${card.priority}`} />
    </span>
  </>;

  return <div className={`kb kb-${mode}`} ref={root} data-dragging={drag ? "true" : undefined}>
    <header className="kb-head">
      <div><h3>Спринт 14 · Магазин</h3><p>{cards.length} задач · сохраняется в этом браузере</p></div>
      <div className="kb-tools">
        <label className="kb-search"><Search aria-hidden="true" /><input value={query} placeholder="Найти задачу" aria-label="Найти задачу" onChange={(e) => { const v = e.target.value; filterTo(() => setQuery(v)); }} /></label>
        <div className="kb-chips" role="group" aria-label="Тег">
          {TAGS.map((t) => <button key={t} type="button" aria-pressed={tag === t} style={{ "--tag": TAG_COLOR[t] } as React.CSSProperties} onClick={() => filterTo(() => setTag(tag === t ? null : t))}>{t}</button>)}
        </div>
        <button type="button" className="kb-reset" onClick={() => change(() => SEED)} aria-label="Вернуть исходную доску"><RotateCcw aria-hidden="true" /></button>
      </div>
    </header>
    <div className="kb-board">
      {COLUMNS.map((col) => {
        const list = cards.filter((c) => c.column === col.key);
        const over = col.limit !== undefined && list.length > col.limit;
        return <section key={col.key} className="kb-col" data-column={col.key} data-over={over || undefined} aria-label={col.title}>
          <h4>{col.title}<span>{list.length}{col.limit ? ` / ${col.limit}` : ""}</span></h4>
          {over && <p className="kb-warn" role="status">Больше {col.limit} задач в работе — команда распыляется</p>}
          <ul>{list.filter(visible).map((card) => <li key={card.id}>
            <div className="kb-card" data-flip-id={card.id} data-ghosted={drag?.id === card.id || undefined} onPointerDown={(e) => down(e, card.id)}
              onClick={() => { if (dragged.current) { dragged.current = false; return; } setOpen(card.id); }} onKeyDown={(e) => { if (e.key === "Enter") setOpen(card.id); }} tabIndex={0} role="button" aria-label={`${card.title}, ${col.title}`}>
              {face(card)}
              <span className="kb-move">
                <button type="button" onClick={(e) => { e.stopPropagation(); step(card.id, -1); }} disabled={col.key === "backlog"} aria-label="В предыдущую колонку"><ArrowLeft aria-hidden="true" /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); step(card.id, 1); }} disabled={col.key === "done"} aria-label="В следующую колонку"><ArrowRight aria-hidden="true" /></button>
              </span>
            </div>
          </li>)}</ul>
          {adding === col.key
            ? <form className="kb-add-form" onSubmit={(e) => { e.preventDefault(); add(col.key, new FormData(e.currentTarget).get("title") as string); }}>
                <input name="title" autoFocus placeholder="Название задачи" aria-label="Название новой задачи" onBlur={(e) => add(col.key, e.currentTarget.value)} />
              </form>
            : <button type="button" className="kb-add" onClick={() => setAdding(col.key)}><Plus aria-hidden="true" />Задача</button>}
        </section>;
      })}
    </div>
    {drag && lifted && <div className="kb-card kb-ghost" style={{ width: drag.w, transform: `translate(${drag.x}px, ${drag.y}px) rotate(2.5deg)` }} aria-hidden="true">{face(lifted)}</div>}

    {current && <aside className="kb-panel" aria-label={`Задача: ${current.title}`}>
      <button type="button" className="kb-close" onClick={() => setOpen(null)} aria-label="Закрыть"><X aria-hidden="true" /></button>
      <span className="kb-tag" style={{ "--tag": TAG_COLOR[current.tag] } as React.CSSProperties}>{current.tag}</span>
      <input className="kb-title" value={current.title} aria-label="Название" onChange={(e) => update(current.id, { title: e.target.value })} />
      <label className="kb-field">Колонка
        <select value={current.column} onChange={(e) => move(current.id, e.target.value as Column)}>{COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}</select>
      </label>
      <label className="kb-field">Описание<textarea value={current.notes} rows={3} onChange={(e) => update(current.id, { notes: e.target.value })} /></label>
      <fieldset className="kb-checks"><legend>Чек-лист</legend>
        {current.checks.map((c, i) => <label key={i}><input type="checkbox" checked={c.done} onChange={() => update(current.id, { checks: current.checks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })} />{c.text}</label>)}
        {current.checks.length === 0 && <p>Пунктов нет</p>}
      </fieldset>
      <p className="kb-who-line"><span className="kb-who" style={{ background: PEOPLE[current.who] }}>{current.who}</span>Срок: {current.due}</p>
    </aside>}
  </div>;
}
