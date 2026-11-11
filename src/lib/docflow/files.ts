import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { key, type Block, type Doc, type Row } from "./rules";
import { MONTH_NAMES } from "./text";

/**
 * Office files without a server: read a timesheet from .xlsx, write a sample one, and write
 * every document as a real .docx. All three formats are zip archives of XML.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
const texts = (xml: string) => [...xml.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((m) => unesc(m[1])).join("");
const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? "";

type Cell = { row: number; col: number; address: string; value: string };
const column = (name: string) => [...name].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const letters = (col: number): string => (col > 26 ? letters(Math.floor((col - 1) / 26)) : "") + String.fromCharCode(65 + ((col - 1) % 26));
const number = (s: string) => { const n = Number(s.replace(",", ".")); return s.trim() !== "" && Number.isFinite(n) ? n : null; };

/** Every non-empty cell of the first sheet. Excel errors and unsaved formulas are refused, not read as zero. */
export function readCells(file: Uint8Array): Cell[] {
  let zip: Record<string, Uint8Array>;
  try { zip = unzipSync(file); } catch { throw new Error("Это не файл Excel (.xlsx)."); }
  if (Object.values(zip).reduce((a, f) => a + f.length, 0) > 40_000_000) throw new Error("Файл слишком большой для табеля.");
  const xml = (path: string) => { const f = zip[path]; if (!f) throw new Error("Повреждён Excel-файл."); return strFromU8(f); };
  const strings = zip["xl/sharedStrings.xml"] ? [...xml("xl/sharedStrings.xml").matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1])) : [];
  const rels = Object.fromEntries([...xml("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b[^>]*>/g)].map((m) => [attr(m[0], "Id"), attr(m[0], "Target")]));
  const sheet = /<sheet\b[^>]*>/.exec(xml("xl/workbook.xml"));
  const target = sheet ? rels[attr(sheet[0], "r:id")] : "";
  if (!target) throw new Error("В книге нет листов.");
  const cells: Cell[] = [];
  for (const m of xml(target.startsWith("/") ? target.slice(1) : `xl/${target}`).matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const address = attr(m[1], "r"), type = attr(m[1], "t"), body = m[2] ?? "";
    const at = /^([A-Z]+)(\d+)$/.exec(address);
    if (!at) continue;
    let value = unesc(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
    if (type === "s") value = strings[Number(value)] ?? "";
    if (type === "inlineStr") value = texts(body);
    if (type === "e") throw new Error(`В ячейке ${address} ошибка Excel. Исправьте её и сохраните файл.`);
    if (/<f\b/.test(body) && !value) throw new Error(`В ячейке ${address} нет сохранённого результата формулы. Откройте файл в Excel и сохраните.`);
    if (value.trim()) cells.push({ row: Number(at[2]), col: column(at[1]), address, value: value.trim() });
  }
  return cells;
}

/**
 * Finds the table by its headers, not by fixed addresses: the "ФИО" cell, day numbers in the
 * row under it, and the salary, norm, reason and "worked for" columns by their names.
 */
export function importTimesheet(file: Uint8Array, month: string): Row[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const cells = readCells(file);
  const get = (row: number, col: number) => cells.find((c) => c.row === row && c.col === col)?.value ?? "";
  const titles = cells.filter((c) => c.row <= 12).map((c) => c.value).join(" ").toLowerCase();
  for (const y of titles.match(/\b20\d{2}\b/g) ?? []) if (Number(y) !== year) throw new Error("Год внутри файла не совпадает с месяцем комплекта.");
  const stems = ["январ", "феврал", "март", "апрел", "ма[йя]", "июн", "июл", "август", "сентябр", "октябр", "ноябр", "декабр"];
  if (stems.some((stem, i) => new RegExp(`(^|[^а-яё])${stem}`).test(titles) && i + 1 !== monthNumber)) throw new Error("Месяц внутри файла не совпадает с месяцем комплекта.");
  const header = cells.find((c) => key(c.value).includes("ФАМИЛИЯ") || key(c.value) === "ФИО");
  if (!header) throw new Error("Не найден столбец «ФИО». Проверьте выбранный файл.");
  const dateRow = header.row + 1, last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const inHeader = (test: (k: string) => boolean) => cells.find((c) => c.row === header.row && test(key(c.value)));
  const dayCols = cells.filter((c) => c.row === dateRow && /^\d+$/.test(c.value) && Number(c.value) >= 1 && Number(c.value) <= last);
  const salary = inHeader((k) => k.startsWith("ОКЛАД")), norm = inHeader((k) => k.includes("НОРМ") && k.includes("ЧАС"));
  const reason = inHeader((k) => k.includes("ПРИЧИН")), replaced = inHeader((k) => k.includes("РАБОТАЛ ЗА"));
  const total = cells.find((c) => c.row === dateRow && key(c.value).startsWith("ЧАС"));
  const rows: Row[] = [];
  for (const name of cells.filter((c) => c.col === header.col && c.row > dateRow)) {
    if (/^итого/i.test(name.value)) continue;
    const marks: Record<number, number> = {};
    for (const c of dayCols) { const h = number(get(name.row, c.col)); if (h) marks[Number(c.value)] = h; }
    const raw = reason ? get(name.row, reason.col).toLowerCase() : "";
    rows.push({
      id: `r${name.row}`, name: name.value, personCode: "",
      salary: salary ? number(get(name.row, salary.col)) : null, normHours: norm ? number(get(name.row, norm.col)) : null,
      reason: raw.includes("вакан") ? "вакантная должность" : raw.includes("отпуск") ? "отпуск" : raw.includes("больнич") ? "больничный" : raw.includes("непол") ? "неполная ставка" : "",
      replaced: replaced ? get(name.row, replaced.col) : "", marks, reported: total ? number(get(name.row, total.col)) : null,
    });
  }
  if (!rows.length) throw new Error("Не найдены строки сотрудников. Проверьте выбранный файл.");
  return rows;
}

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const PACKAGE = "http://schemas.openxmlformats.org/package/2006";
const OFFICE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const types = (part: string, type: string) => `${XML}<Types xmlns="${PACKAGE}/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${part ? `<Override PartName="${part}" ContentType="${type}"/>` : ""}</Types>`;
const rels = (type: string, target: string) => `${XML}<Relationships xmlns="${PACKAGE}/relationships"><Relationship Id="rId1" Type="${OFFICE}/${type}" Target="${target}"/></Relationships>`;

export type Grid = (string | number | null)[][];

/** A one-sheet .xlsx from a grid of values. `widths` are [first column, last column, width] in Excel units. */
export function workbook(grid: Grid, sheetName: string, widths: [number, number, number][] = []): Uint8Array {
  const cell = (v: string | number | null, c: number, r: number) => v === null || v === ""
    ? "" : typeof v === "number" ? `<c r="${letters(c + 1)}${r + 1}"><v>${v}</v></c>` : `<c r="${letters(c + 1)}${r + 1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
  const sheet = grid.map((line, r) => `<row r="${r + 1}">${line.map((v, c) => cell(v, c, r)).join("")}</row>`).join("");
  const cols = widths.length ? `<cols>${widths.map(([min, max, width]) => `<col min="${min}" max="${max}" width="${width}" customWidth="1"/>`).join("")}</cols>` : "";
  const main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  return zipSync({
    "[Content_Types].xml": strToU8(types("/xl/workbook.xml", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml").replace("</Types>", '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')),
    "_rels/.rels": strToU8(rels("officeDocument", "xl/workbook.xml")),
    "xl/workbook.xml": strToU8(`${XML}<workbook xmlns="${main}" xmlns:r="${OFFICE}"><sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(rels("worksheet", "worksheets/sheet1.xml")),
    "xl/worksheets/sheet1.xml": strToU8(`${XML}<worksheet xmlns="${main}">${cols}<sheetData>${sheet}</sheetData></worksheet>`),
  });
}

/** The timesheet as a workbook in the layout the importer reads: headers, a row of day numbers, one row per person. */
export function exportTimesheet(rows: Row[], month: string): Uint8Array {
  const [year, monthNumber] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return workbook([
    [`Табель дополнительной работы · ${MONTH_NAMES[monthNumber - 1]} ${year} · демонстрационные данные`], [],
    ["ФИО", "Оклад", "Норма часов", "Причина", "Работал за"],
    [null, null, null, null, null, ...Array.from({ length: last }, (_, i) => i + 1), "Часов"],
    ...rows.map((row) => [row.name, row.salary, row.normHours, row.reason, row.replaced, ...Array.from({ length: last }, (_, i) => row.marks[i + 1] ?? null), row.reported]),
  ], "Табель", [[1, 1, 24], [4, 5, 22], [6, 5 + last, 4]]);
}

function paragraph(block: Block) {
  const run = `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${block.bold ? "<w:b/>" : ""}<w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>`;
  const jc = block.align ? `<w:jc w:val="${block.align === "justify" ? "both" : block.align}"/>` : "";
  const indent = block.indent ? '<w:ind w:firstLine="709"/>' : "";
  return `<w:p><w:pPr>${jc}<w:spacing w:after="${block.gap ? 280 : 60}" w:line="300" w:lineRule="auto"/>${indent}</w:pPr><w:r>${run}<w:t xml:space="preserve">${esc(block.text)}</w:t></w:r></w:p>`;
}

/** One document as a .docx Word opens directly: A4, Times New Roman 13, the margins of a Russian order. */
export function docx(doc: Doc): Uint8Array {
  const page = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';
  return zipSync({
    "[Content_Types].xml": strToU8(types("/word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml")),
    "_rels/.rels": strToU8(rels("officeDocument", "word/document.xml")),
    "word/document.xml": strToU8(`${XML}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${doc.blocks.map(paragraph).join("")}${page}</w:body></w:document>`),
  });
}

/** The whole set in one archive. The .docx files are already compressed, so they are stored as they are. */
export function packageZip(docs: Doc[]) {
  return zipSync(Object.fromEntries(docs.map((doc) => [doc.file, [docx(doc), { level: 0 }] as [Uint8Array, { level: 0 }]])));
}
