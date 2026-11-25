/**
 * The rules behind the Sysinvent demo: a notice sent to a fleet of workstations, and a backup
 * register where a copy, a successful job and a restore test are three separate facts.
 * Computers, people and systems are invented; the outcomes are seeded so every visit and every
 * test sees the same run.
 */

export type Pc = { id: number; name: string; dept: string; os: "Windows 7" | "Windows 10" | "Windows 11"; assigned: string | null; lastUser: string };

const DEPTS: [string, number][] = [["Бухгалтерия", 5], ["Касса", 3], ["Склад", 4], ["Отдел кадров", 2], ["Приёмная", 1], ["Маркетинг", 3], ["Охрана", 2], ["Техслужба", 3], ["Дирекция", 1]];
const SURNAMES = ["Аксенова", "Белов", "Валиева", "Гордеев", "Демина", "Ершов", "Жукова", "Зайцев", "Ильина", "Карпов", "Лукина", "Миронов", "Носкова", "Осипов", "Петрова", "Рябов", "Сафина", "Титов", "Уварова", "Федоров", "Хасанова", "Чернов", "Шилова", "Юдин"];

function random(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

export const FLEET: Pc[] = (() => {
  const rnd = random(20261125);
  const list: Pc[] = [];
  for (const [dept, count] of DEPTS) {
    for (let n = 1; n <= count; n++) {
      const id = list.length;
      const person = SURNAMES[id];
      const os = rnd() < 0.18 ? "Windows 7" : rnd() < 0.55 ? "Windows 10" : "Windows 11";
      // Some workstations have nobody assigned: the card then falls back to the account seen in the last poll.
      const assigned = rnd() < 0.8 ? `${person} ${"АВЕИМНОС"[id % 8]}.` : null;
      list.push({ id, name: count > 1 ? `${dept} ${n}` : dept, dept, os, assigned, lastUser: person.toLowerCase().replace(/[ёЁ]/g, "е") });
    }
  }
  return list;
})();

/** What happened to the notice on one computer in one attempt. */
export type Outcome = "ack" | "closed" | "timeout" | "rpc" | "noreceiver";
export type Phase = "queued" | "sending" | "shown" | Outcome;

export const OUTCOME_TEXT: Record<Phase, string> = {
  queued: "в очереди", sending: "отправка", shown: "окно показано, ждём ответа",
  ack: "нажал «Ознакомился»", closed: "закрыл окно", timeout: "окно показано, ответа нет",
  rpc: "ПК не ответил по RPC", noreceiver: "в сети, приёмник не запущен",
};

/** Delivered means the window was on screen; only "Ознакомился" counts as confirmed. */
export const delivered = (o: Phase) => o === "ack" || o === "closed" || o === "timeout" || o === "shown";
export const failed = (o: Phase) => o === "rpc" || o === "noreceiver";

/**
 * The seeded outcome for one computer in one attempt. Unreachable machines stay mostly
 * unreachable; people who ignored the first window are likelier to confirm the reminder.
 */
export function outcome(pc: number, attempt: number): Outcome {
  const r = random(pc * 7919 + attempt * 104729 + 17)();
  const flaky = pc % 11 === 4 || pc % 13 === 9;
  if (flaky) return attempt === 0 || r < 0.6 ? (pc % 2 ? "rpc" : "noreceiver") : r < 0.85 ? "ack" : "closed";
  if (attempt === 0) return r < 0.26 ? "ack" : r < 0.64 ? "closed" : "timeout";
  return r < 0.62 ? "ack" : r < 0.84 ? "closed" : "timeout";
}

/** Timings of one delivery, in ms: reaching the machine, then waiting for the person. */
export function timing(pc: number, attempt: number) {
  const rnd = random(pc * 31 + attempt * 997 + 5);
  return { reach: 260 + Math.round(rnd() * 520), answer: 500 + Math.round(rnd() * 1700) };
}

export type Attempt = { at: string; targets: number[]; results: Record<number, Phase> };

export function summary(results: Record<number, Phase>, targets: number[]) {
  const of = (test: (p: Phase) => boolean) => targets.filter((id) => results[id] && test(results[id])).length;
  return {
    targets: targets.length,
    shown: of(delivered), ack: of((p) => p === "ack"), closed: of((p) => p === "closed"),
    timeout: of((p) => p === "timeout"), failed: of(failed), pending: of((p) => p === "queued" || p === "sending" || p === "shown"),
  };
}

/** The latest phase of each computer across every attempt. */
export function latest(history: Attempt[]): Record<number, Phase> {
  const state: Record<number, Phase> = {};
  for (const attempt of history) for (const id of attempt.targets) if (attempt.results[id]) state[id] = attempt.results[id];
  return state;
}

/** A reminder goes only to computers where nobody has confirmed the notice in any attempt. */
export function unconfirmed(history: Attempt[]): number[] {
  const confirmed = new Set(history.flatMap((a) => a.targets.filter((id) => a.results[id] === "ack")));
  const sent = [...new Set(history.flatMap((a) => a.targets))];
  return sent.filter((id) => !confirmed.has(id)).sort((a, b) => a - b);
}

/* Device card ------------------------------------------------------------------------ */

export type Status = "online" | "offline" | "unknown";
export const STATUS_TEXT: Record<Status, string> = { online: "В сети", offline: "Не в сети", unknown: "Нет данных" };
export const SOURCES = ["Active Directory", "Сетевое сканирование", "Excel-реестр", "Прежний учёт", "Документы ОСВ"] as const;
export const CLIENTS = ["RDP", "VNC", "AnyDesk", "RustDesk", "Dameware", "SSH"] as const;

export type DeviceCard = {
  status: Status; ip: string; mac: string; model: string; cpu: string; ram: number; disk: number;
  location: string; inventory: string; serial: string;
  metrics: { cpu: number; mem: number; temp: number; free: number; uptime: number };
  software: { apps: number; services: number; startup: number; hotfixes: number };
  security: { antivirus: string | null; bitlocker: boolean; shares: number; usb: number };
  sources: (typeof SOURCES)[number][];
  profiles: { client: (typeof CLIENTS)[number]; preferred: boolean; secret: boolean }[];
  history: { when: string; what: string }[];
};

const MODELS = ["HP ProDesk 400 G7", "Lenovo ThinkCentre M70q", "Dell OptiPlex 3080", "Acer Veriton X2690G", "HP EliteDesk 800 G4"];
const CPUS = ["Core i3-10100", "Core i5-10400", "Core i5-12400", "Ryzen 5 5600G", "Pentium G6400"];
const APPS = ["1С:Предприятие 8.3", "Microsoft Office 2019", "Яндекс Браузер", "7-Zip", "Adobe Acrobat Reader", "КриптоПро CSP", "Kaspersky Endpoint Security", "AnyDesk", "Telegram Desktop", "VLC"];
const FLOORS = ["1 этаж, офис 104", "2 этаж, бухгалтерия", "1 этаж, касса", "−1 этаж, склад", "3 этаж, приёмная", "2 этаж, отдел кадров", "4 этаж, техслужба"];

/** Everything the card shows for one computer, generated from its id: the same on every visit. */
export function card(id: number): DeviceCard {
  const rnd = random(id * 2654435761 % 2147483647 || 7);
  const pc = FLEET[id];
  const status: Status = id % 11 === 4 || id % 13 === 9 ? "offline" : id === 17 ? "unknown" : "online";
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rnd() * list.length)];
  const sources = SOURCES.filter((_, i) => i === 1 || rnd() < (i === 4 ? 0.55 : 0.8));
  const preferred = pc.dept === "Техслужба" ? "SSH" : "RDP";
  const profiles = CLIENTS.filter((c) => c === preferred || (c !== "SSH" && rnd() < 0.35)).map((client) => ({ client, preferred: client === preferred, secret: rnd() < 0.75 }));
  const day = (d: number) => `${String(25 - d).padStart(2, "0")}.11`;
  return {
    status, ip: `192.0.2.${10 + id * 3}`, mac: Array.from({ length: 6 }, () => Math.floor(rnd() * 256).toString(16).padStart(2, "0")).join(":").toUpperCase(),
    model: pick(MODELS), cpu: pick(CPUS), ram: pick([8, 8, 16, 16, 32]), disk: pick([256, 512, 512, 1000]),
    location: FLOORS[DEPTS.findIndex(([d]) => d === pc.dept) % FLOORS.length], inventory: `ИН-${String(1040 + id * 7).padStart(5, "0")}`, serial: `SN${Math.floor(rnd() * 9e7 + 1e7)}`,
    metrics: { cpu: Math.round(rnd() * 70 + 4), mem: Math.round(rnd() * 55 + 30), temp: Math.round(rnd() * 30 + 38), free: Math.round(rnd() * 180 + 12), uptime: Math.round(rnd() * 300 + 2) },
    software: { apps: Math.round(rnd() * 60 + 40), services: Math.round(rnd() * 60 + 180), startup: Math.round(rnd() * 12 + 4), hotfixes: pc.os === "Windows 7" ? Math.round(rnd() * 20 + 180) : Math.round(rnd() * 25 + 8) },
    security: { antivirus: rnd() < 0.9 ? "Kaspersky Endpoint Security" : null, bitlocker: pc.os !== "Windows 7" && rnd() < 0.4, shares: Math.round(rnd() * 3), usb: Math.round(rnd() * 8 + 3) },
    sources, profiles,
    history: [
      { when: `${day(0)} 08:52`, what: status === "online" ? "Опрос: снимок состояния обновлён" : "Опрос: компьютер не ответил" },
      { when: `${day(2)} 14:10`, what: `Вход в систему: ${pc.lastUser}` },
      { when: `${day(5)} 10:31`, what: "Сверка: привязан к позиции ОСВ по инвентарному номеру" },
      { when: `${day(9)} 17:45`, what: "Удалённое действие: установка КриптоПро CSP — успешно" },
      { when: `${day(16)} 09:02`, what: "Импорт из Active Directory: обновлено подразделение" },
    ],
  };
}

export const appsOf = (id: number) => APPS.filter((_, i) => (id + i) % 3 !== 0 || i < 3);

/* Reconciliation with accounting --------------------------------------------------------- */

export type Match = { doc: string; inventory: string; amount: number; how: "inventory" | "serial" | "model" | "ambiguous" | "none"; candidates: number[] };

/** Accounting lines from the fixed-assets statement and what the console found for each. */
export const LEDGER: Match[] = [
  { doc: "Системный блок HP ProDesk 400 G7", inventory: "ИН-01040", amount: 54_200, how: "inventory", candidates: [0] },
  { doc: "Системный блок Lenovo ThinkCentre", inventory: "ИН-01047", amount: 61_900, how: "inventory", candidates: [1] },
  { doc: "Компьютер в сборе (касса)", inventory: "ИН-01075", amount: 38_400, how: "serial", candidates: [5] },
  { doc: "ПК Dell OptiPlex 3080", inventory: "ИН-00912", amount: 57_300, how: "ambiguous", candidates: [8, 9] },
  { doc: "Системный блок офисный", inventory: "ИН-00933", amount: 41_000, how: "model", candidates: [12] },
  { doc: "Моноблок Acer (приёмная)", inventory: "ИН-01138", amount: 49_800, how: "inventory", candidates: [14] },
  { doc: "Рабочая станция техслужбы", inventory: "ИН-00871", amount: 88_500, how: "ambiguous", candidates: [20, 21, 22] },
  { doc: "Системный блок (списание 2024)", inventory: "ИН-00402", amount: 12_000, how: "none", candidates: [] },
];

export const HOW_TEXT: Record<Match["how"], string> = {
  inventory: "по инвентарному номеру", serial: "по серийному номеру", model: "по модели и месту — нужна проверка",
  ambiguous: "несколько кандидатов — выберите", none: "устройство не найдено",
};

/* Backup register ------------------------------------------------------------------- */

export type System = { id: string; name: string; kind: "Сервер" | "ВМ" | "Сеть" | "Сервис"; copy: number | null; job: number | null; restore: number | null; what: string };

/** Days before the demo's "today" when each fact was last recorded; null means never. */
export const SYSTEMS: System[] = [
  { id: "dc", name: "Контроллер домена", kind: "Сервер", copy: 0, job: 0, restore: 41, what: "Состояние системы и каталог" },
  { id: "erp", name: "Учётная база", kind: "ВМ", copy: 0, job: 0, restore: 12, what: "База данных и журнал транзакций" },
  { id: "files", name: "Файловый сервер", kind: "Сервер", copy: 1, job: 1, restore: null, what: "Общие папки отделов" },
  { id: "access", name: "Пропускная система", kind: "Сервис", copy: 3, job: 9, restore: null, what: "База пропусков и событий" },
  { id: "mail", name: "Почтовый шлюз", kind: "ВМ", copy: 0, job: 0, restore: 133, what: "Конфигурация и очереди" },
  { id: "router", name: "Пограничный роутер", kind: "Сеть", copy: 2, job: 2, restore: 30, what: "Конфигурация" },
  { id: "video", name: "Видеосервер", kind: "Сервер", copy: null, job: null, restore: null, what: "Конфигурация и разметка камер" },
  { id: "hyper", name: "Хост виртуализации", kind: "Сервер", copy: 0, job: 0, restore: 64, what: "Экспорт ВМ" },
];

export const JOB_FRESH = 2, RESTORE_FRESH = 90;
export type Verdict = "proven" | "untested" | "stale" | "missing";

/** A copy proves nothing until it was restored: the status says which of the three facts is missing. */
export function verdict(s: Pick<System, "copy" | "job" | "restore">): Verdict {
  if (s.copy === null && s.job === null) return "missing";
  if (s.job === null || s.job > JOB_FRESH) return "stale";
  if (s.restore === null || s.restore > RESTORE_FRESH) return "untested";
  return "proven";
}

export const VERDICT_TEXT: Record<Verdict, string> = {
  proven: "Восстановление подтверждено",
  untested: "Копия есть, восстановление не проверено",
  stale: "Задание давно не завершалось",
  missing: "Копий нет",
};
