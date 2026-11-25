"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CircleAlert, CircleCheck, CircleHelp, CircleX, Download, FileSignature, KeyRound, Link2, PenLine, RotateCcw, Scissors, Undo2 } from "lucide-react";
import { attach, authority, bytesOf, cosign, hex, issue, sha256, sign, signatureBytes, split, verify, type Authority, type Cert, type Check, type Container, type Person } from "@/lib/signing";
import type { ShowcaseProps } from "./registry";

const ORIGINAL = `ДОГОВОР ПОСТАВКИ № 14
25 ноября 2026 г.

ООО «Демо-Центр» (Поставщик) и ООО «Пример» (Покупатель) договорились о поставке 40 комплектов офисной мебели на сумму 1 240 000 ₽. Оплата — в течение 10 банковских дней после подписания акта.

Документ, организации и подписанты вымышлены.`;

const PEOPLE: [string, string, string][] = [["Орлов П. Н.", "Директор", "7A01"], ["Сафина Л. Р.", "Главный бухгалтер", "7A02"], ["Титов А. В.", "Юрист", "7A03"]];
const FILE = "Договор поставки 14.pdf";
type Kit = { ca: Authority; people: Person[]; store: Cert[] };

/**
 * A reconstruction of a desktop signing tool for the portfolio. Several people sign one document;
 * each new signature is independent and the earlier entries keep their exact bytes. Every signer
 * is checked separately for integrity, an attached certificate, the chain to the authority and
 * revocation data. The cryptography is real WebCrypto (ECDSA P-256) standing in for GOST keys.
 */
export default function SignerDesk({ mode }: ShowcaseProps) {
  const [kit, setKit] = useState<Kit | null>(null);
  const [doc, setDoc] = useState(ORIGINAL);
  const [base, setBase] = useState(ORIGINAL);
  const [container, setContainer] = useState<Container>([]);
  const [kept, setKept] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Check[]>([]);
  const [revocation, setRevocation] = useState(true);
  const [splitView, setSplitView] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [digest, setDigest] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      const ca = await authority();
      const people = await Promise.all(PEOPLE.map(([owner, role, serial]) => issue(ca, owner, role, serial)));
      // A reissued certificate with the same serial and owner but another key: the trap for picking by name.
      const reissued = await issue(ca, PEOPLE[0][0], PEOPLE[0][1], PEOPLE[0][2]);
      if (live) setKit({ ca, people, store: [reissued.cert, ...people.map((p) => p.cert)] });
    })();
    return () => { live = false; };
  }, []);

  useEffect(() => {
    let live = true;
    sha256(doc).then((d) => live && setDigest(hex(d, 16)));
    if (kit) Promise.all(container.map((s) => verify(s, doc, kit.ca, revocation))).then((c) => live && setChecks(c));
    return () => { live = false; };
  }, [doc, container, kit, revocation]);

  const next = kit?.people.find((p) => !container.some((s) => s.serial === p.cert.serial));
  const changed = container.length > 0 && doc !== base;
  const time = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const addSigner = async () => {
    if (!kit || !next) return;
    const entry = await sign(next, doc, time());
    if (!container.length) setBase(doc);
    // Remember how every earlier entry looked, to show it was carried over byte for byte.
    setKept(Object.fromEntries(container.map((s) => [s.serial, hex(bytesOf(s), 64)])));
    setContainer((c) => cosign(c, entry));
    setSplitView(false);
    setNote(container.length ? `${next.cert.owner} добавлен(а) в общую подпись. Записи прежних подписантов перенесены без пересборки.` : `${next.cert.owner} подписал(а) документ. Подпись отсоединённая: файл документа не изменился.`);
  };
  const detach = (i: number) => { setContainer((c) => c.map((s, n) => (n === i ? { ...s, cert: null } : s))); setNote("Сертификат убран из контейнера: подпись цела, но на другом компьютере её не проверить."); };
  const reattach = async (i: number) => {
    if (!kit) return;
    const { entry, tried, picked } = await attach(container[i], kit.store);
    setContainer((c) => c.map((s, n) => (n === i ? entry : s)));
    setNote(picked ? `В хранилище ${tried} сертификата с серийным номером ${entry.serial}. Взят тот, с которым математически сходится подпись, а не первый по имени.` : "Подходящий сертификат не найден.");
  };
  const reset = () => { setDoc(ORIGINAL); setBase(ORIGINAL); setContainer([]); setKept({}); setSplitView(false); setNote(null); };
  const download = () => {
    const body = JSON.stringify({ format: "демо: JSON вместо CMS/CAdES", document: FILE, signers: container }, null, 2);
    const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
    Object.assign(document.createElement("a"), { href: url, download: `${FILE}.sig.json` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const parts = useMemo(() => split(container), [container]);

  return <div className={`sd sd-${mode}`}>
    <header className="sd-head">
      <div className="sd-title"><h3>Подпись документов</h3><p>Несколько подписантов · проверка каждой подписи · данные вымышлены</p></div>
      <label className="sd-switch"><input type="checkbox" checked={revocation} onChange={(e) => setRevocation(e.target.checked)} /><span aria-hidden="true" />Сведения об отзыве доступны</label>
    </header>

    <div className="sd-body">
      <section className="sd-doc" aria-label="Документ">
        <p className="sd-file"><FileSignature aria-hidden="true" />{FILE}</p>
        <label className="sd-paper">
          <span className="sd-sr">Текст документа — его можно изменить</span>
          <textarea value={doc} onChange={(e) => setDoc(e.target.value)} spellCheck={false} />
        </label>
        <p className="sd-hash" data-changed={changed || undefined}>SHA-256 <code>{digest}…</code>{changed && <button type="button" onClick={() => setDoc(base)}><Undo2 aria-hidden="true" />Вернуть исходный</button>}</p>
        <p className="sd-hint">{changed ? "Документ изменён после подписания — проверьте, что стало с каждой подписью справа." : "Попробуйте подписать, а потом поменять в тексте хотя бы одну цифру."}</p>
      </section>

      <section className="sd-sig" aria-label="Подпись">
        <div className="sd-sig-head">
          <p><b>{FILE}.sig</b> · {container.length ? `${container.length} ${container.length === 1 ? "подписант" : container.length < 5 ? "подписанта" : "подписантов"}` : "пусто"}</p>
          <div className="sd-actions">
            {next && <button type="button" className="button" data-lg="button" data-lg-variant="prominent" disabled={!kit} onClick={addSigner}><PenLine aria-hidden="true" />{container.length ? "Добавить подписанта" : "Подписать"} · {next.cert.owner}</button>}
            {container.length > 1 && <button type="button" className="button" data-lg="button" aria-pressed={splitView} onClick={() => setSplitView((v) => !v)}><Scissors aria-hidden="true" />Разделить</button>}
          </div>
        </div>

        {splitView ? <ul className="sd-split" aria-label="Отдельные файлы подписи">
          {parts.map((p, i) => <li key={i}><FileSignature aria-hidden="true" /><div><b>{FILE}.{p[0].cert?.owner.split(" ")[0] ?? p[0].serial}.sig</b><span>1 подписант · запись перенесена без изменений · подпись {hex(signatureBytes(p[0]), 6)}…</span></div></li>)}
          <li className="sd-muted">Из одного контейнера — отдельный файл на каждого подписанта, например для портала, который принимает только одну подпись.</li>
        </ul> : container.length ? <ol className="sd-signers">
          {container.map((s, i) => {
            const c = checks[i];
            const person = kit?.people.find((p) => p.cert.serial === s.serial)?.cert;
            const same = kept[s.serial] && kept[s.serial] === hex(bytesOf(s), 64);
            return <li key={s.serial} className="sd-signer">
              <div className="sd-who"><i aria-hidden="true">{person?.owner.split(" ").map((x) => x[0]).slice(0, 2).join("")}</i><div><b>{person?.owner}</b><span>{person?.role} · подписано в {s.signedAt}</span></div></div>
              {c && <dl className="sd-checks">
                <Row label="Целостность" ok={c.integrity} yes="документ не менялся" no="документ изменён после подписи" none="нечем проверить: нет сертификата" />
                <Row label="Сертификат" ok={c.certificate} yes="вложен в подпись" no="не вложен" />
                <Row label="Цепочка доверия" ok={c.chain} yes="до «Демо УЦ», срок действует" no="не построена" none="не построена: нет сертификата" />
                <Row label="Отзыв" ok={c.revocation === "checked" ? true : null} yes="проверен по локальным сведениям" none="сведений нет — это не ошибка подписи" />
              </dl>}
              <div className="sd-row"><p className="sd-bytes"><code>подпись {hex(signatureBytes(s), 8)}…</code>{same && <span><BadgeCheck aria-hidden="true" />байты не изменились при доподписании</span>}</p>
              <div className="sd-card-actions">
                {s.cert ? <button type="button" onClick={() => detach(i)}><KeyRound aria-hidden="true" />Убрать сертификат</button>
                  : <button type="button" onClick={() => reattach(i)}><Link2 aria-hidden="true" />Вложить сертификат</button>}
              </div></div>
            </li>;
          })}
        </ol> : <p className="sd-empty">{kit ? "Подписей пока нет. Первая подпись — отсоединённая: документ остаётся как есть, подпись ложится рядом отдельным файлом." : "Готовлю ключи и сертификаты…"}</p>}

        {note && <p className="sd-note" aria-live="polite"><CircleAlert aria-hidden="true" />{note}</p>}
        <div className="sd-foot">
          <button type="button" onClick={download} disabled={!container.length}><Download aria-hidden="true" />Скачать подпись</button>
          <button type="button" onClick={reset}><RotateCcw aria-hidden="true" />Сначала</button>
          <span>Криптография настоящая: ECDSA P-256 и SHA-256 в браузере вместо ГОСТ и токена.</span>
        </div>
      </section>
    </div>
  </div>;
}

function Row({ label, ok, yes, no, none }: { label: string; ok: boolean | null; yes: string; no?: string; none?: string }) {
  const Icon = ok === true ? CircleCheck : ok === false ? CircleX : CircleHelp;
  return <div data-ok={ok === true ? "yes" : ok === false ? "no" : "unknown"}>
    <dt><Icon aria-hidden="true" />{label}</dt>
    <dd>{ok === true ? yes : ok === false ? no : none}</dd>
  </div>;
}
