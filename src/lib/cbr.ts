/** Official CBR rates for the GlassRates widget showcase. Server-only: cbr.ru sends no CORS headers. */
import "server-only";

import { SAVED_RATES, type Rates } from "@/lib/rates";

const CODES = ["USD", "EUR"];

const iso = (ddmmyyyy: string) => { const [d, m, y] = ddmmyyyy.split("."); return `${y}-${m}-${d}`; };
const number = (text: string) => Number(text.replace(",", "."));

/** Reads CharCode, Nominal and Value of each currency from the CBR daily XML (plain ASCII fields). */
function parseDaily(xml: string) {
  const date = xml.match(/<ValCurs[^>]*Date="([\d.]+)"/)?.[1];
  const values = new Map<string, number>();
  for (const block of xml.matchAll(/<Valute\b[\s\S]*?<\/Valute>/g)) {
    const code = block[0].match(/<CharCode>(\w+)<\/CharCode>/)?.[1];
    const nominal = number(block[0].match(/<Nominal>([\d,]+)<\/Nominal>/)?.[1] ?? "1");
    const value = number(block[0].match(/<Value>([\d,]+)<\/Value>/)?.[1] ?? "NaN");
    if (code && Number.isFinite(value)) values.set(code, value / nominal);
  }
  return date ? { date: iso(date), values } : null;
}

async function get(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "Mozilla/5.0 (portfolio rates widget)" } });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer()).toString("latin1");
}

async function fromCbr(): Promise<Rates> {
  const today = parseDaily(await get("https://www.cbr.ru/scripts/XML_daily.asp"));
  if (!today) throw new Error("cbr: no date");
  // The rate in force the day before the published date is the one the change is measured against.
  const before = new Date(`${today.date}T00:00:00Z`);
  before.setUTCDate(before.getUTCDate() - 1);
  const stamp = `${String(before.getUTCDate()).padStart(2, "0")}/${String(before.getUTCMonth() + 1).padStart(2, "0")}/${before.getUTCFullYear()}`;
  const previous = parseDaily(await get(`https://www.cbr.ru/scripts/XML_daily.asp?date_req=${stamp}`));
  if (!previous) throw new Error("cbr: no previous date");
  const rates = CODES.map((code) => ({ code, value: today.values.get(code)!, previous: previous.values.get(code)! }));
  if (rates.some((rate) => !Number.isFinite(rate.value) || !Number.isFinite(rate.previous))) throw new Error("cbr: missing currency");
  return { date: today.date, previousDate: previous.date, rates, source: "cbr" };
}

async function fromMirror(): Promise<Rates> {
  const data = JSON.parse(await get("https://www.cbr-xml-daily.ru/daily_json.js")) as {
    Date: string; PreviousDate: string; Valute: Record<string, { Nominal: number; Value: number; Previous: number }>;
  };
  const rates = CODES.map((code) => {
    const item = data.Valute[code];
    return { code, value: item.Value / item.Nominal, previous: item.Previous / item.Nominal };
  });
  return { date: data.Date.slice(0, 10), previousDate: data.PreviousDate.slice(0, 10), rates, source: "mirror" };
}

/** Official CBR first, the public mirror of the same data second, the saved rates last. */
export async function loadRates(): Promise<Rates> {
  for (const source of [fromCbr, fromMirror]) {
    try { return await source(); } catch { /* try the next source */ }
  }
  return SAVED_RATES;
}
