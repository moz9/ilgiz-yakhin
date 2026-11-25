"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Check, Download, Monitor, RotateCcw, Save, Send, ShieldAlert, ShieldCheck, ShieldX, Timer, WifiOff, X } from "lucide-react";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import { workbook } from "@/lib/docflow/files";
import { plural } from "@/lib/plural";
import {
  failed, FLEET, latest, outcome, OUTCOME_TEXT, summary, SYSTEMS, timing, unconfirmed, verdict, VERDICT_TEXT,
  JOB_FRESH, RESTORE_FRESH, type Attempt, type Phase, type System,
} from "@/lib/fleet";
import type { ShowcaseProps } from "./registry";

const TEMPLATES = [
  { id: "works", label: "Плановые работы", title: "Сегодня в 19:00 учётная база будет недоступна 30 минут", body: "Сохраните документы до 18:55. После работ перезапускать ничего не нужно." },
  { id: "phone", label: "Новый номер", title: "У техподдержки новый внутренний номер — 300", body: "Старый номер перестанет отвечать в понедельник. Номер также есть в карточке «Помощь» на рабочем столе." },
  { id: "mail", label: "Осторожно, письмо", title: "Не открывайте вложение из письма «Акт сверки»", body: "Письмо пришло с похожего адреса и содержит вредоносный файл. Если уже открыли — позвоните в техподдержку." },
] as const;

const SAVED = [{ name: "Бухгалтерия и касса", ids: FLEET.filter((p) => p.dept === "Бухгалтерия" || p.dept === "Касса").map((p) => p.id) }];
const TABS = ["Рассылка", "Резервирование"] as const;
const CONCURRENCY = 3;
const ICON: Partial<Record<Phase, typeof Check>> = { ack: Check, closed: X, timeout: Timer, rpc: WifiOff, noreceiver: WifiOff };
const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
const ago = (days: number | null) => (days === null ? "никогда" : days === 0 ? "сегодня" : days === 1 ? "вчера" : `${days} ${plural(days, "день", "дня", "дней")} назад`);

/**
 * Two parts of an IT console reconstructed for the portfolio. A notice goes out to a fleet of
 * workstations through a small queue; each machine reports whether the window was shown and
 * what the person did, and a reminder goes only to those who never confirmed. The backup
 * register keeps a found copy, a successful job and a tested restore as separate facts.
 * Computers, people and systems are invented.
 */
export default function FleetConsole({ mode }: ShowcaseProps) {
  const tabs = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(0);
  useGlassTabs(tabs, tab, setTab);

  return <div className={`fc fc-${mode}`}>
    <header className="fc-head">
      <div className="fc-title"><h3>Пульт ИТ-парка</h3><p>24 рабочих места · компьютеры, люди и системы вымышлены</p></div>
      <div className="fc-switch" data-lg="surface">
        <div className="fc-tabs" ref={tabs} role="tablist" aria-label="Раздел">
          {TABS.map((name, i) => <button key={name} type="button" role="tab" aria-selected={tab === i} tabIndex={tab === i ? 0 : -1}>{name}</button>)}
        </div>
      </div>
    </header>
    {/* Both parts stay mounted: switching tabs must not drop a running or finished notice. */}
    <div className="fc-pane" hidden={tab !== 0}><Notices /></div>
    <div className="fc-pane" hidden={tab !== 1}><Backups /></div>
  </div>;
}

function Notices() {
  const [template, setTemplate] = useState(0);
  const [lists, setLists] = useState(SAVED);
  const [audience, setAudience] = useState<number[]>(() => FLEET.map((p) => p.id));
  const [history, setHistory] = useState<Attempt[]>([]);
  const [picked, setPicked] = useState(3);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const state = useMemo(() => latest(history), [history]);
  const current = history.at(-1);
  const running = current ? summary(current.results, current.targets).pending > 0 : false;
  const remind = useMemo(() => (running ? [] : unconfirmed(history)), [history, running]);
  const totals = current ? summary(current.results, current.targets) : null;
  const all = useMemo(() => {
    const targets = [...new Set(history.flatMap((a) => a.targets))];
    return summary(state, targets);
  }, [history, state]);

  const set = (attempt: number, id: number, phase: Phase) =>
    setHistory((h) => h.map((a, i) => (i === attempt ? { ...a, results: { ...a.results, [id]: phase } } : a)));

  /** A small queue: a few machines at a time, the slot frees once the window is on screen or the machine fails. */
  const send = (targets: number[]) => {
    if (!targets.length || running) return;
    const attempt = history.length;
    setHistory((h) => [...h, { at: now(), targets, results: Object.fromEntries(targets.map((id) => [id, "queued" as Phase])) }]);
    const queue = [...targets];
    const next = () => {
      const id = queue.shift();
      if (id === undefined) return;
      set(attempt, id, "sending");
      const { reach, answer } = timing(id, attempt);
      const result = outcome(id, attempt);
      timers.current.push(window.setTimeout(() => {
        if (failed(result)) set(attempt, id, result);
        else {
          set(attempt, id, "shown");
          timers.current.push(window.setTimeout(() => set(attempt, id, result), answer));
        }
        next();
      }, reach));
    };
    for (let i = 0; i < CONCURRENCY; i++) next();
  };

  const reset = () => { timers.current.forEach(clearTimeout); timers.current = []; setHistory([]); };
  const saveList = () => {
    const ids = unconfirmed(history);
    if (ids.length && !lists.some((l) => l.name === "Не подтвердили")) setLists((l) => [...l, { name: "Не подтвердили", ids }]);
  };
  const exportJournal = () => {
    const grid = [
      ["Журнал рассылки · демонстрационные данные"], [],
      ["Рабочее место", "Сотрудник", "ОС", ...history.map((a, i) => `Попытка ${i + 1}, ${a.at}`)],
      ...FLEET.filter((p) => history.some((a) => a.targets.includes(p.id))).map((p) => [
        p.name, p.assigned ?? `${p.lastUser} (последний вход)`, p.os, ...history.map((a) => (a.results[p.id] ? OUTCOME_TEXT[a.results[p.id]] : null)),
      ]),
    ];
    const url = URL.createObjectURL(new Blob([workbook(grid, "Журнал", [[1, 2, 24], [3, 3, 12], [4, 6, 30]]) as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    Object.assign(document.createElement("a"), { href: url, download: "Журнал рассылки.xlsx" }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const pc = FLEET[picked];
  const t = TEMPLATES[template];
  const pickedSet = new Set(audience);

  return <div className="fc-body">
    <section className="fc-draft" aria-label="Черновик">
      <div className="fc-templates" role="radiogroup" aria-label="Сообщение">
        {TEMPLATES.map((x, i) => <button key={x.id} type="button" role="radio" aria-checked={template === i} disabled={running} onClick={() => setTemplate(i)}>{x.label}</button>)}
      </div>
      <figure className="fc-window" key={t.id}>
        <figcaption><Monitor aria-hidden="true" />Так окно увидит сотрудник</figcaption>
        <div className="fc-popup">
          <p className="fc-from">Сообщение от ИТ-отдела</p>
          <b>{t.title}</b>
          <p>{t.body}</p>
          <span className="fc-ack">Ознакомился</span>
        </div>
      </figure>
      <div className="fc-audience">
        <p>Получатели: <b>{audience.length}</b></p>
        <div>
          <button type="button" aria-pressed={audience.length === FLEET.length} disabled={running} onClick={() => setAudience(FLEET.map((p) => p.id))}>Весь парк</button>
          {lists.map((l) => <button key={l.name} type="button" disabled={running} aria-pressed={audience.length === l.ids.length && l.ids.every((id) => pickedSet.has(id))} onClick={() => setAudience(l.ids)}>{l.name} · {l.ids.length}</button>)}
        </div>
      </div>
      <div className="fc-actions">
        <button type="button" className="button" data-lg="button" data-lg-variant="prominent" disabled={running || !audience.length} onClick={() => send(audience)}><Send aria-hidden="true" />Отправить</button>
        {remind.length > 0 && <button type="button" className="button" data-lg="button" onClick={() => send(remind)}><RotateCcw aria-hidden="true" />Повторить для {remind.length} без «Ознакомился»</button>}
      </div>
    </section>

    <section className="fc-fleet" aria-label="Рабочие места">
      <ul className="fc-kpis" aria-live="polite">
        <li><span>Окно показано</span><b>{all.shown}<small> из {all.targets || audience.length}</small></b></li>
        <li data-k="ack"><span>Ознакомились</span><b>{all.ack}</b></li>
        <li><span>Закрыли окно</span><b>{all.closed}</b></li>
        <li><span>Без ответа</span><b>{all.timeout}</b></li>
        <li data-k="bad"><span>Не доставлено</span><b>{all.failed}</b></li>
      </ul>
      <ul className="fc-grid">
        {FLEET.map((p) => {
          const phase = state[p.id];
          const Icon = phase ? ICON[phase] : undefined;
          return <li key={p.id}>
            <button type="button" className="fc-pc" data-phase={phase} data-out={!pickedSet.has(p.id) && !phase || undefined} aria-pressed={picked === p.id} onClick={() => setPicked(p.id)}
              aria-label={`${p.name}: ${phase ? OUTCOME_TEXT[phase] : pickedSet.has(p.id) ? "в списке получателей" : "не выбран"}`}>
              <span className="fc-pc-name">{p.name}</span>
              <span className="fc-pc-os">{p.os.replace("Windows ", "Win ")}</span>
              <i aria-hidden="true">{Icon && <Icon />}</i>
            </button>
          </li>;
        })}
      </ul>
      <div className="fc-foot">
        <aside className="fc-card" aria-live="polite">
          <h4>{pc.name}</h4>
          <p>{pc.assigned ? <>Закреплён: <b>{pc.assigned}</b></> : <>Никто не закреплён · последний вход: <b>{pc.lastUser}</b></>} · {pc.os}</p>
          {history.some((a) => a.targets.includes(pc.id)) ? <ol>
            {history.map((a, i) => a.targets.includes(pc.id) && <li key={i} data-phase={a.results[pc.id]}>Попытка {i + 1} · {a.at} — {OUTCOME_TEXT[a.results[pc.id]]}</li>)}
          </ol> : <p className="fc-muted">Рассылок на этот компьютер ещё не было.</p>}
          {pc.os === "Windows 7" && <p className="fc-muted">На Windows 7 приёмник работает так же: окно показывается в сеансе пользователя.</p>}
        </aside>
        <div className="fc-journal">
          {history.length ? <>
            <ol>{history.map((a, i) => {
              const s = summary(a.results, a.targets);
              return <li key={i}><b>Попытка {i + 1}</b> · {a.at} · {s.targets} ПК: показано {s.shown}, подтвердили {s.ack}{s.failed ? `, не доставлено ${s.failed}` : ""}{s.pending ? ` · идёт…` : ""}</li>;
            })}</ol>
            <div>
              <button type="button" onClick={saveList} disabled={running || !remind.length}><Save aria-hidden="true" />Сохранить получателей</button>
              <button type="button" onClick={exportJournal} disabled={running}><Download aria-hidden="true" />Журнал .xlsx</button>
              <button type="button" onClick={reset}><RotateCcw aria-hidden="true" />Сначала</button>
            </div>
          </> : <p className="fc-muted">Выберите сообщение и получателей и нажмите «Отправить». Очередь отправляет на {CONCURRENCY} ПК одновременно; каждый компьютер сообщает, показано ли окно и что сделал человек.</p>}
          {totals && !running && totals.failed > 0 && <p className="fc-muted">«Не доставлено» не считается отказом сотрудника: компьютер выключен или приёмник не запущен в его сеансе. Повтор пойдёт и на эти ПК.</p>}
        </div>
      </div>
    </section>
  </div>;
}

const VERDICT_ICON = { proven: ShieldCheck, untested: ShieldAlert, stale: ShieldX, missing: ShieldX };

function Backups() {
  const [systems, setSystems] = useState<System[]>(SYSTEMS);
  const [picked, setPicked] = useState("files");
  const s = systems.find((x) => x.id === picked)!;
  const v = verdict(s);
  const update = (patch: Partial<System>) => setSystems((list) => list.map((x) => (x.id === picked ? { ...x, ...patch } : x)));
  const counts = systems.reduce((acc, x) => ({ ...acc, [verdict(x)]: (acc[verdict(x)] ?? 0) + 1 }), {} as Record<string, number>);

  return <div className="fc-backups">
    <ul className="fc-kpis">
      <li data-k="ack"><span>Восстановление подтверждено</span><b>{counts.proven ?? 0}</b></li>
      <li><span>Копия без проверки</span><b>{counts.untested ?? 0}</b></li>
      <li data-k="bad"><span>Задание устарело или копий нет</span><b>{(counts.stale ?? 0) + (counts.missing ?? 0)}</b></li>
    </ul>
    <div className="fc-register">
      <div className="fc-table" tabIndex={0}>
        <table>
          <caption>Реестр резервирования: три отдельных факта по каждой системе</caption>
          <thead><tr><th scope="col">Система</th><th scope="col">Копия найдена</th><th scope="col">Задание успешно</th><th scope="col">Восстановление проверено</th><th scope="col">Статус</th></tr></thead>
          <tbody>{systems.map((x) => {
            const xv = verdict(x);
            const Icon = VERDICT_ICON[xv];
            return <tr key={x.id} data-verdict={xv} aria-selected={picked === x.id} onClick={() => setPicked(x.id)}>
              <th scope="row"><button type="button" onClick={() => setPicked(x.id)}>{x.name}<small>{x.kind}</small></button></th>
              <td>{ago(x.copy)}</td><td data-warn={x.job === null || x.job > JOB_FRESH || undefined}>{ago(x.job)}</td>
              <td data-warn={x.restore === null || x.restore > RESTORE_FRESH || undefined}>{ago(x.restore)}</td>
              <td><span className="fc-verdict"><Icon aria-hidden="true" />{VERDICT_TEXT[xv]}</span></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <aside className="fc-card fc-why" aria-live="polite">
        <p className="fc-muted">{s.kind} · {s.what}</p>
        <h4>{s.name}</h4>
        <p className="fc-verdict" data-verdict={v}>{VERDICT_TEXT[v]}</p>
        <p>{v === "proven" ? `Задание завершилось ${ago(s.job)}, а восстановление из копии проверяли ${ago(s.restore)}. Это единственный статус, которому можно верить при сбое.`
          : v === "untested" ? `Копия свежая, но ${s.restore === null ? "из неё ни разу не восстанавливали" : `последний тест восстановления был ${ago(s.restore)} — дольше ${RESTORE_FRESH} дней`}. Файл копии ещё не доказывает, что из него поднимется система.`
          : v === "stale" ? `Последнее успешное задание — ${ago(s.job)}. Копия ${ago(s.copy)} может быть найдена на диске, но свежей она не считается.`
          : "Система есть в инфраструктуре, но ни копии, ни задания по ней не найдено."}</p>
        <div className="fc-why-actions">
          {(v === "stale" || v === "missing") && <button type="button" onClick={() => update({ copy: 0, job: 0 })}><Archive aria-hidden="true" />Отметить успешное задание</button>}
          {v === "untested" && <button type="button" onClick={() => update({ restore: 0 })}><ShieldCheck aria-hidden="true" />Записать тест восстановления</button>}
          {systems !== SYSTEMS && <button type="button" onClick={() => setSystems(SYSTEMS)}><RotateCcw aria-hidden="true" />Сбросить</button>}
        </div>
      </aside>
    </div>
    <p className="fc-muted">Правила демо: задание считается свежим {JOB_FRESH} дня, тест восстановления — {RESTORE_FRESH} дней. Найденная на диске копия, успешное задание и проверенное восстановление хранятся отдельно и не подменяют друг друга.</p>
  </div>;
}
