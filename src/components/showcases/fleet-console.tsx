"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Archive, Check, Download, HardDriveDownload, Link2, MessageSquare, Monitor, Package, RotateCcw, Save, Search, Send, ShieldAlert, ShieldCheck, ShieldX, Timer, WifiOff, Wrench, X } from "lucide-react";
import { useGlassTabs } from "@/components/glass/glass-runtime";
import { workbook } from "@/lib/docflow/files";
import { plural } from "@/lib/plural";
import {
  appsOf, card, failed, FLEET, HOW_TEXT, latest, LEDGER, outcome, OUTCOME_TEXT, STATUS_TEXT, summary, SYSTEMS, timing, unconfirmed, verdict, VERDICT_TEXT,
  JOB_FRESH, RESTORE_FRESH, type Attempt, type Phase, type System,
} from "@/lib/fleet";
import type { ShowcaseProps } from "./registry";

const TEMPLATES = [
  { id: "works", label: "Плановые работы", title: "Сегодня в 19:00 учётная база будет недоступна 30 минут", body: "Сохраните документы до 18:55. После работ перезапускать ничего не нужно." },
  { id: "phone", label: "Новый номер", title: "У техподдержки новый внутренний номер — 300", body: "Старый номер перестанет отвечать в понедельник. Номер также есть в карточке «Помощь» на рабочем столе." },
  { id: "mail", label: "Осторожно, письмо", title: "Не открывайте вложение из письма «Акт сверки»", body: "Письмо пришло с похожего адреса и содержит вредоносный файл. Если уже открыли — позвоните в техподдержку." },
] as const;

const SAVED = [{ name: "Бухгалтерия и касса", ids: FLEET.filter((p) => p.dept === "Бухгалтерия" || p.dept === "Касса").map((p) => p.id) }];
const TABS = ["Парк", "Сверка", "Рассылки", "Резервирование", "Журнал"] as const;
const CONCURRENCY = 3;
const ICON: Partial<Record<Phase, typeof Check>> = { ack: Check, closed: X, timeout: Timer, rpc: WifiOff, noreceiver: WifiOff };
const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
const ago = (days: number | null) => (days === null ? "никогда" : days === 0 ? "сегодня" : days === 1 ? "вчера" : `${days} ${plural(days, "день", "дня", "дней")} назад`);

/**
 * An IT console reconstructed for the portfolio. The fleet opens into a full computer card;
 * accounting lines are matched to real devices with every doubtful match left to a person. A notice goes out to a fleet of
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
    <div className="fc-pane" hidden={tab !== 0}><Park /></div>
    <div className="fc-pane" hidden={tab !== 1}><Ledger /></div>
    <div className="fc-pane" hidden={tab !== 2}><Notices /></div>
    <div className="fc-pane" hidden={tab !== 3}><Backups /></div>
    <div className="fc-pane" hidden={tab !== 4}><Audit /></div>
  </div>;
}

const STATUS_FILTERS = [["all", "Все"], ["online", "В сети"], ["offline", "Не в сети"], ["unknown", "Нет данных"]] as const;
const CARD_TABS = ["Обзор", "Подключения", "Софт", "Безопасность", "История"] as const;
const ACTIONS = [
  { id: "ping", label: "Ping", icon: Activity },
  { id: "message", label: "Сообщение", icon: MessageSquare },
  { id: "install", label: "Установить ПО", icon: Package },
  { id: "drivers", label: "Обновить драйверы", icon: Wrench },
  { id: "probe", label: "Аппаратный опрос", icon: HardDriveDownload },
] as const;

/** The fleet and the card of one computer: what the console knows about it and where each fact came from. */
function Park() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number][0]>("all");
  const [picked, setPicked] = useState(3);
  const [cardTab, setCardTab] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const cards = useMemo(() => FLEET.map((p) => card(p.id)), []);
  const shown = FLEET.filter((p) => (status === "all" || cards[p.id].status === status)
    && (!query || `${p.name} ${p.assigned ?? ""} ${p.lastUser} ${cards[p.id].ip} ${cards[p.id].inventory}`.toLowerCase().includes(query.toLowerCase())));
  const pc = FLEET[picked], c = cards[picked];
  const counts = { online: cards.filter((x) => x.status === "online").length, offline: cards.filter((x) => x.status === "offline").length };
  const act = (label: string) => setNote(`«${label}» для ${pc.name}: в демо команда не выполняется. В продукте она уходит через PowerShell-мост на компьютер и пишется в журнал аудита с именем администратора.`);

  return <div className="fc-park">
    <section className="fc-list" aria-label="Компьютеры">
      <div className="fc-tools">
        <label className="fc-search"><Search aria-hidden="true" /><span className="fc-sr">Поиск</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Имя, сотрудник, IP, инв. номер" /></label>
        <div className="fc-filters" role="radiogroup" aria-label="Состояние">
          {STATUS_FILTERS.map(([id, label]) => <button key={id} type="button" role="radio" aria-checked={status === id} onClick={() => setStatus(id)}>{label}</button>)}
        </div>
      </div>
      <p className="fc-muted">{counts.online} в сети · {counts.offline} не в сети · опрос сегодня в 08:52</p>
      <ul className="fc-rows">
        {shown.map((p) => <li key={p.id}>
          <button type="button" className="fc-row" aria-pressed={picked === p.id} onClick={() => { setPicked(p.id); setNote(null); }}>
            <i data-status={cards[p.id].status} aria-label={STATUS_TEXT[cards[p.id].status]} />
            <span><b>{p.name}</b><small>{p.assigned ?? `нет закрепления · ${p.lastUser}`}</small></span>
            <span className="fc-row-meta">{p.os.replace("Windows ", "Win ")}<small>{cards[p.id].ip}</small></span>
          </button>
        </li>)}
        {!shown.length && <li className="fc-muted">Ничего не найдено.</li>}
      </ul>
    </section>

    <section className="fc-device" aria-label={`Карточка: ${pc.name}`}>
      <header>
        <div><h4>{pc.name}</h4><p>{c.model} · {pc.os} · {c.ip}</p></div>
        <span className="fc-status" data-status={c.status}><i />{STATUS_TEXT[c.status]}</span>
      </header>
      <div className="fc-quick" aria-label="Быстрые действия">
        {ACTIONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => act(label)}><Icon aria-hidden="true" />{label}</button>)}
      </div>
      {note && <p className="fc-note" aria-live="polite">{note}</p>}
      <div className="fc-card-tabs" role="tablist" aria-label="Разделы карточки">
        {CARD_TABS.map((name, i) => <button key={name} type="button" role="tab" aria-selected={cardTab === i} onClick={() => setCardTab(i)}>{name}</button>)}
      </div>
      <div className="fc-card-body">
        {cardTab === 0 && <>
          <ul className="fc-metrics">
            <li><span>Загрузка CPU</span><b>{c.status === "online" ? `${c.metrics.cpu}%` : "—"}</b></li>
            <li><span>Память занята</span><b>{c.status === "online" ? `${c.metrics.mem}%` : "—"}</b></li>
            <li><span>Температура</span><b>{c.status === "online" ? `${c.metrics.temp} °C` : "—"}</b></li>
            <li><span>Свободно на C:</span><b>{c.metrics.free} ГБ</b></li>
            <li><span>Время работы</span><b>{c.status === "online" ? `${c.metrics.uptime} ч` : "—"}</b></li>
            <li><span>Железо</span><b>{c.cpu} · {c.ram} ГБ · {c.disk} ГБ</b></li>
          </ul>
          <dl className="fc-fields">
            <div><dt>Закреплён</dt><dd>{pc.assigned ?? "—"}</dd></div>
            <div><dt>Последний вход</dt><dd>{pc.lastUser}</dd></div>
            <div><dt>Подразделение</dt><dd>{pc.dept}</dd></div>
            <div><dt>Локация</dt><dd>{c.location}</dd></div>
            <div><dt>Инвентарный номер</dt><dd>{c.inventory}</dd></div>
            <div><dt>Серийный номер · MAC</dt><dd>{c.serial} · {c.mac}</dd></div>
          </dl>
          <p className="fc-sources"><span>Источники:</span>{c.sources.map((s) => <em key={s}>{s}</em>)}</p>
        </>}
        {cardTab === 1 && <ul className="fc-profiles">
          {c.profiles.map((p) => <li key={p.client}>
            <b>{p.client}</b>
            {p.preferred && <em>основной</em>}
            <span>{p.secret ? "логин и пароль — в зашифрованном хранилище" : "пароль не сохранён"}</span>
            <button type="button" onClick={() => act(`Подключиться по ${p.client}`)}><Link2 aria-hidden="true" />Подключиться</button>
          </li>)}
          <li className="fc-muted">Пароль не показывается и не копируется: клиент получает его напрямую, а каждый запуск попадает в журнал доступа к секретам.</li>
        </ul>}
        {cardTab === 2 && <>
          <ul className="fc-metrics">
            <li><span>Приложений</span><b>{c.software.apps}</b></li><li><span>Служб</span><b>{c.software.services}</b></li>
            <li><span>Автозагрузка</span><b>{c.software.startup}</b></li><li><span>Обновлений</span><b>{c.software.hotfixes}</b></li>
          </ul>
          <ul className="fc-apps">{appsOf(pc.id).map((a) => <li key={a}>{a}</li>)}</ul>
        </>}
        {cardTab === 3 && <ul className="fc-metrics">
          <li data-warn={!c.security.antivirus || undefined}><span>Антивирус</span><b>{c.security.antivirus ?? "не найден"}</b></li>
          <li><span>BitLocker</span><b>{c.security.bitlocker ? "диск C: защищён" : pc.os === "Windows 7" ? "недоступен" : "выключен"}</b></li>
          <li data-warn={c.security.shares > 1 || undefined}><span>Общие папки</span><b>{c.security.shares}</b></li>
          <li><span>USB и PnP-устройства</span><b>{c.security.usb}</b></li>
        </ul>}
        {cardTab === 4 && <ol className="fc-history">{c.history.map((h) => <li key={h.when}><time>{h.when}</time>{h.what}</li>)}</ol>}
      </div>
    </section>
  </div>;
}

/** Accounting lines against real devices: certain matches go through, doubtful ones wait for a person. */
function Ledger() {
  const [chosen, setChosen] = useState<Record<number, number>>({});
  const decided = (i: number) => LEDGER[i].how === "inventory" || LEDGER[i].how === "serial" || chosen[i] !== undefined;
  const auto = LEDGER.filter((m) => m.how === "inventory" || m.how === "serial").length;
  const waiting = LEDGER.filter((m, i) => m.how !== "none" && !decided(i)).length;
  return <div className="fc-ledger">
    <ul className="fc-kpis">
      <li data-k="ack"><span>Сопоставлено автоматически</span><b>{auto}</b></li>
      <li><span>Подтверждено вручную</span><b>{Object.keys(chosen).length}</b></li>
      <li data-k={waiting ? "warn" : undefined}><span>Ждут решения</span><b>{waiting}</b></li>
      <li data-k="bad"><span>Нет устройства</span><b>{LEDGER.filter((m) => m.how === "none").length}</b></li>
    </ul>
    <div className="fc-table" tabIndex={0}>
      <table>
        <caption>Позиции оборотно-сальдовой ведомости и найденные устройства</caption>
        <thead><tr><th scope="col">Позиция в учёте</th><th scope="col">Инв. номер</th><th scope="col">Сумма</th><th scope="col">Как найдено</th><th scope="col">Устройство</th></tr></thead>
        <tbody>{LEDGER.map((m, i) => <tr key={m.inventory} data-how={chosen[i] !== undefined ? "chosen" : m.how}>
          <th scope="row">{m.doc}</th><td>{m.inventory}</td><td>{m.amount.toLocaleString("ru-RU")} ₽</td>
          <td>{chosen[i] !== undefined ? "подтверждено вручную" : HOW_TEXT[m.how]}</td>
          <td>{m.how === "none" ? "—"
            : decided(i) ? <span className="fc-match"><Check aria-hidden="true" />{FLEET[chosen[i] ?? m.candidates[0]].name}{chosen[i] !== undefined && <button type="button" onClick={() => setChosen((c) => Object.fromEntries(Object.entries(c).filter(([k]) => Number(k) !== i)))}>отменить</button>}</span>
            : <span className="fc-pick">{m.candidates.map((id) => <button key={id} type="button" onClick={() => setChosen((c) => ({ ...c, [i]: id }))}>{FLEET[id].name}</button>)}</span>}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="fc-muted">Учёт и физические устройства — разные модели данных, поэтому сомнительная связь не записывается сама: человек выбирает кандидата, а основание сохраняется рядом со связью. Позиции и суммы демонстрационные.</p>
  </div>;
}
const AUDIT = [
  { at: "08:52", kind: "Импорт", who: "система", what: "Сетевой опрос: 19 ответили, 4 не в сети, 1 без данных; снимки состояния обновлены" },
  { at: "09:05", kind: "Импорт", who: "система", what: "Active Directory: изменилось подразделение у 2 учётных записей" },
  { at: "09:14", kind: "Рассылка", who: "admin", what: "«Плановые работы» отправлена на 24 ПК, показ подтверждён на 20" },
  { at: "09:31", kind: "Доступ к паролю", who: "admin", what: "RDP-профиль «Бухгалтерия 4»: пароль передан клиенту подключения, на экран не выводился" },
  { at: "09:32", kind: "Подключение", who: "admin", what: "RDP → Бухгалтерия 4: сеанс запущен" },
  { at: "10:07", kind: "Действие", who: "admin", what: "Установка ПО на Склад 1: КриптоПро CSP — успешно, журнал установщика сохранён" },
  { at: "10:40", kind: "Сверка", who: "admin", what: "ИН-00912 привязан к «Склад 2» вручную, основание: серийный номер с наклейки" },
  { at: "11:02", kind: "Доступ к паролю", who: "оператор", what: "Отказано: у роли «Пользователь» нет доступа к паролям сетевого оборудования" },
  { at: "11:20", kind: "Заметка", who: "admin", what: "Заметка к «Маркетинг 1» видна только администраторам" },
  { at: "12:00", kind: "Резервирование", who: "система", what: "Импорт наблюдений: 8 систем, у 2 восстановление ни разу не проверялось" },
] as const;
const KINDS = ["Все", ...new Set(AUDIT.map((a) => a.kind))];

/** Who did what: every connection, action and password use leaves a line, refusals included. */
function Audit() {
  const [kind, setKind] = useState("Все");
  const rows = AUDIT.filter((a) => kind === "Все" || a.kind === kind);
  return <div className="fc-audit">
    <div className="fc-filters" role="radiogroup" aria-label="Тип события">
      {KINDS.map((k) => <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}>{k}</button>)}
    </div>
    <ol className="fc-events">{rows.map((a) => <li key={a.at + a.what} data-deny={a.what.startsWith("Отказано") || undefined}>
      <time>{a.at}</time><em>{a.kind}</em><span>{a.what}</span><small>{a.who}</small>
    </li>)}</ol>
    <p className="fc-muted">Роли «Администратор» и «Пользователь», заметки с видимостью «всем», «лично» и «только администраторам». Пароли лежат в зашифрованном хранилище, и каждое обращение к ним — отдельная строка журнала. События демонстрационные.</p>
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
