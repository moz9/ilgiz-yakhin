"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, Scissors } from "lucide-react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import type { ShowcaseProps } from "./registry";

gsap.registerPlugin(DrawSVGPlugin);

const SERVICES = [
  { id: "cut", name: "Мужская стрижка", minutes: 60, price: 1800, note: "Мытьё, стрижка, укладка" },
  { id: "beard", name: "Борода", minutes: 30, price: 1100, note: "Форма, контур, горячее полотенце" },
  { id: "combo", name: "Стрижка + борода", minutes: 90, price: 2600, note: "Полный образ за один визит" },
  { id: "kid", name: "Детская стрижка", minutes: 40, price: 1200, note: "До 12 лет" },
];
const MASTERS = [
  { id: "any", name: "Любой мастер", role: "Ближайшее свободное время", color: "#8b8a82" },
  { id: "artem", name: "Артём", role: "Топ-мастер · 8 лет", color: "#d95926", extra: 400 },
  { id: "ilya", name: "Илья", role: "Барбер · 4 года", color: "#3987e5", extra: 0 },
  { id: "sasha", name: "Саша", role: "Барбер · 2 года", color: "#199e70", extra: 0 },
];
const STEPS = ["Услуга", "Мастер", "Время", "Контакты", "Готово"];
const WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

/** Busy slots are a stable function of master and day, so the calendar looks lived-in and never changes under the reader. */
function slotsFor(date: Date, master: string, minutes: number) {
  const seed = date.getFullYear() * 400 + date.getMonth() * 31 + date.getDate() + master.length * 17;
  const closed = date.getDay() === 1 && master !== "any";
  const slots: { time: string; free: boolean }[] = [];
  for (let m = 10 * 60; m + minutes <= 21 * 60; m += 30) {
    const h = Math.floor(m / 60), mm = m % 60;
    const busy = closed || ((seed * 31 + m * 7) % 11) < (date.getDay() === 6 ? 7 : 4);
    slots.push({ time: `${h}:${String(mm).padStart(2, "0")}`, free: !busy });
  }
  return slots;
}
const phoneMask = (raw: string) => {
  const d = raw.replace(/\D/g, "").replace(/^[78]/, "").slice(0, 10);
  const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)];
  return d.length ? `+7 (${p[0]}${d.length > 3 ? `) ${p[1]}` : ""}${d.length > 6 ? `-${p[2]}` : ""}${d.length > 8 ? `-${p[3]}` : ""}` : "";
};

/**
 * Online booking for a barbershop, start to finish: service, master, a month calendar with
 * availability, free slots, contact form with a phone mask and validation, and a ticket with
 * a real .ics file for the reader's calendar. A live summary follows every choice.
 */
export default function BookingFlow({ mode }: ShowcaseProps) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<string | null>(null);
  const [master, setMaster] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const pane = useRef<HTMLDivElement>(null);
  const dir = useRef(1);

  const svc = SERVICES.find((s) => s.id === service);
  const who = MASTERS.find((m) => m.id === master);
  const price = (svc?.price ?? 0) + (who?.extra ?? 0);
  const errors = { name: name.trim().length < 2 ? "Как к вам обращаться?" : "", phone: phone.replace(/\D/g, "").length !== 11 ? "Нужен номер из 10 цифр после +7" : "" };
  const can = [Boolean(svc), Boolean(who), Boolean(date && time), !errors.name && !errors.phone, true][step];

  // Each step slides in from the side it comes from.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      gsap.from(pane.current, { x: dir.current * 40, opacity: 0, duration: 0.45, ease: "power3.out" });
      if (step === 4) gsap.from(".bk-check path", { drawSVG: "0%", duration: 0.6, delay: 0.2, ease: "power2.out" });
    });
    return () => mm.revert();
  }, { dependencies: [step] });

  const go = (to: number) => { dir.current = to > step ? 1 : -1; setStep(to); };
  const next = () => { if (step === 3) setTouched(true); if (can) go(step + 1); };
  const restart = () => { setService(null); setMaster(null); setDate(null); setTime(null); setName(""); setPhone(""); setTouched(false); go(0); };

  const days = useMemo(() => {
    const first = (month.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);
  const slots = date && svc && who ? slotsFor(date, who.id, svc.minutes) : [];
  const freeCount = (d: Date) => (svc && who ? slotsFor(d, who.id, svc.minutes).filter((s) => s.free).length : 0);
  const horizon = new Date(today); horizon.setDate(today.getDate() + 45);

  const ics = () => {
    if (!date || !time || !svc) return;
    const [h, m] = time.split(":").map(Number);
    const start = new Date(date); start.setHours(h, m);
    const end = new Date(start.getTime() + svc.minutes * 60000);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//portfolio demo//booking//RU", "BEGIN:VEVENT", `UID:${Date.now()}@demo`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:${svc.name} — барбершоп «Лезвие»`, `DESCRIPTION:Мастер: ${who?.name}. Демонстрационная запись.`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
    link.download = "запись-лезвие.ics"; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const when = date && time ? `${date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}, ${time}` : "";

  return <div className={`bk bk-${mode}`}>
    <header className="bk-head">
      <p className="bk-brand"><Scissors aria-hidden="true" />Барбершоп «Лезвие»<small>Демо: запись никуда не отправляется</small></p>
      <ol className="bk-steps" aria-label="Шаги записи">
        {STEPS.map((s, i) => <li key={s} data-state={i < step ? "done" : i === step ? "now" : undefined} aria-current={i === step ? "step" : undefined}>
          <span>{i < step ? <Check aria-hidden="true" /> : i + 1}</span>{s}
        </li>)}
      </ol>
    </header>

    <div className="bk-body">
      <div className="bk-pane" ref={pane} key={step}>
        {step === 0 && <section aria-label="Выбор услуги"><h3>Что делаем?</h3>
          <div className="bk-options">{SERVICES.map((s) => <button key={s.id} type="button" className="bk-option" aria-pressed={service === s.id} onClick={() => { setService(s.id); setTime(null); }}>
            <b>{s.name}</b><small>{s.note}</small><span><Clock aria-hidden="true" />{s.minutes} мин · {s.price.toLocaleString("ru-RU")} ₽</span>
          </button>)}</div>
        </section>}

        {step === 1 && <section aria-label="Выбор мастера"><h3>К кому?</h3>
          <div className="bk-options">{MASTERS.map((m) => <button key={m.id} type="button" className="bk-option bk-master" aria-pressed={master === m.id} onClick={() => { setMaster(m.id); setTime(null); }}>
            <i style={{ background: m.color }} aria-hidden="true">{m.id === "any" ? "?" : m.name[0]}</i><b>{m.name}</b><small>{m.role}</small>{m.extra ? <span>+{m.extra} ₽</span> : null}
          </button>)}</div>
        </section>}

        {step === 2 && <section aria-label="Дата и время" className="bk-when"><h3>Когда удобно?</h3>
          <div className="bk-cal">
            <div className="bk-cal-head">
              <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)} aria-label="Предыдущий месяц"><ChevronLeft aria-hidden="true" /></button>
              <b>{MONTHS[month.getMonth()]} {month.getFullYear()}</b>
              <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Следующий месяц"><ChevronRight aria-hidden="true" /></button>
            </div>
            <div className="bk-grid" role="grid" aria-label="Календарь">
              {WEEK.map((w) => <span key={w} className="bk-wd" role="columnheader">{w}</span>)}
              {days.map((d, i) => {
                if (!d) return <span key={`e${i}`} />;
                const out = d < today || d > horizon;
                const free = out ? 0 : freeCount(d);
                return <button key={d.toISOString()} type="button" role="gridcell" disabled={out || !free} aria-selected={date?.getTime() === d.getTime()} data-load={free > 10 ? "lots" : free > 4 ? "some" : free ? "few" : undefined}
                  onClick={() => { setDate(d); setTime(null); }} aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}: ${free ? `${free} свободных окон` : "нет окон"}`}>{d.getDate()}</button>;
              })}
            </div>
            <p className="bk-legend"><i data-load="lots" />много окон <i data-load="some" />есть <i data-load="few" />мало</p>
          </div>
          <div className="bk-slots">
            {date ? <><p>{date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
              <div>{slots.map((s) => <button key={s.time} type="button" disabled={!s.free} aria-pressed={time === s.time} onClick={() => setTime(s.time)}>{s.time}</button>)}</div></>
              : <p className="bk-empty">Выберите день — покажу свободное время</p>}
          </div>
        </section>}

        {step === 3 && <section aria-label="Контакты"><h3>Как с вами связаться?</h3>
          <form className="bk-form" onSubmit={(e) => { e.preventDefault(); next(); }} noValidate>
            <label>Имя<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" aria-invalid={touched && Boolean(errors.name)} placeholder="Ильгиз" />{touched && errors.name && <small role="alert">{errors.name}</small>}</label>
            <label>Телефон<input value={phone} inputMode="tel" onChange={(e) => setPhone(phoneMask(e.target.value))} autoComplete="tel" aria-invalid={touched && Boolean(errors.phone)} placeholder="+7 (900) 000-00-00" />{touched && errors.phone && <small role="alert">{errors.phone}</small>}</label>
            <p className="bk-hint">Напомним за два часа до визита. Это демо: данные не уходят дальше этой страницы.</p>
          </form>
        </section>}

        {step === 4 && <section aria-label="Запись подтверждена" className="bk-done">
          <svg className="bk-check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" /><path d="M19 33l9 9 17-19" /></svg>
          <h3>Вы записаны</h3>
          <div className="bk-ticket">
            <b>{svc?.name}</b><span>{when}</span><span>Мастер: {who?.name}</span><span>{price.toLocaleString("ru-RU")} ₽ · оплата в салоне</span>
            <small>{name}, {phone}</small>
          </div>
          <div className="bk-done-actions">
            <button type="button" className="bk-primary" onClick={ics}><CalendarPlus aria-hidden="true" />Добавить в календарь</button>
            <button type="button" className="bk-ghost" onClick={restart}>Новая запись</button>
          </div>
        </section>}
      </div>

      <aside className="bk-summary" aria-label="Ваша запись">
        <h4>Ваша запись</h4>
        <dl>
          <div><dt>Услуга</dt><dd>{svc ? `${svc.name}, ${svc.minutes} мин` : "—"}</dd></div>
          <div><dt>Мастер</dt><dd>{who?.name ?? "—"}</dd></div>
          <div><dt>Когда</dt><dd>{when || "—"}</dd></div>
        </dl>
        <p className="bk-total"><span>Итого</span><b>{price ? `${price.toLocaleString("ru-RU")} ₽` : "—"}</b></p>
        {step < 4 && <div className="bk-nav">
          {step > 0 && <button type="button" className="bk-ghost" onClick={() => go(step - 1)}><ArrowLeft aria-hidden="true" />Назад</button>}
          <button type="button" className="bk-primary" onClick={next} aria-disabled={!can && step !== 3}>{step === 3 ? "Записаться" : "Дальше"}</button>
        </div>}
      </aside>
    </div>
  </div>;
}
