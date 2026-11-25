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
