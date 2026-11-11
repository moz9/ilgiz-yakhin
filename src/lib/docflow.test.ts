import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { docx, exportTimesheet, importTimesheet, packageZip } from "./docflow/files";
import { buildDocuments, evaluate, nameMatches, onOrBeforeWeekday, previousWeekday, type Row } from "./docflow/rules";
import { MONTH, ORG, PEOPLE, sampleRows } from "./docflow/sample";
import { amountWords, day, fullName, initials, rub } from "./docflow/text";

const withoutId = (row: Row) => ({ ...row, id: "" });

describe("document text", () => {
  it("declines full names by gender taken from the patronymic", () => {
    expect(fullName("Соколова Марина Андреевна", "genitive")).toBe("Соколовой Марины Андреевны");
    expect(fullName("Соколова Марина Андреевна", "dative")).toBe("Соколовой Марине Андреевне");
    expect(fullName("Кузнецов Артём Игоревич", "dative")).toBe("Кузнецову Артёму Игоревичу");
    expect(fullName("Назаров Дмитрий Сергеевич", "genitive")).toBe("Назарова Дмитрия Сергеевича");
    // A woman's surname ending in a consonant is not declined; her name and patronymic are.
    expect(fullName("Мельник Татьяна Юрьевна", "dative")).toBe("Мельник Татьяне Юрьевне");
    expect(initials("БЕЛОВА ольга Викторовна", "genitive")).toBe("Беловой О. В.");
    expect(() => fullName("Ли Анна", "genitive")).toThrow(/Не удалось склонить/);
  });

  it("writes an amount in words", () => {
    expect(amountWords(4750)).toBe("четыре тысячи семьсот пятьдесят рублей 00 копеек");
    expect(amountWords(21001)).toBe("двадцать одна тысяча один рубль 00 копеек");
    expect(amountWords(1002012.5)).toBe("один миллион две тысячи двенадцать рублей 50 копеек");
    expect(amountWords(0)).toBe("ноль рублей 00 копеек");
  });

  it("never dates a document on a weekend", () => {
    expect(onOrBeforeWeekday(day(2026, 10, 31)).getUTCDate()).toBe(30);
    expect(previousWeekday(day(2026, 10, 5)).getUTCDate()).toBe(2);
    expect(previousWeekday(day(2026, 10, 1)).toISOString().slice(0, 10)).toBe("2026-09-30");
  });
});

describe("timesheet rules", () => {
  it("matches a short name to a person by surname and first letters", () => {
    expect(nameMatches("Соколова М.А.", "Соколова Марина Андреевна")).toBe(true);
    expect(nameMatches("Соколова", "Соколова Марина Андреевна")).toBe(false);
    expect(nameMatches("Кузнецов А.", "Кузнецов Алексей Павлович")).toBe(true);
  });

  it("holds back rows with remarks and computes the rest", () => {
    const result = evaluate(sampleRows(), PEOPLE, MONTH);
    expect(result.issues.map((i) => i.id)).toEqual(["r2:person", "r3:total", "r4:reason"]);
    expect(result.awards.map((a) => a.person.code)).toEqual(["p5", "p7", "p1"]);
    // 42 000 / 176 × 16 = 3 818,18, rounded to fifty.
    expect(result.awards[2].amount).toBe(3800);
    expect(result.awards[2].documentDate.toISOString().slice(0, 10)).toBe("2026-10-02");
    expect(buildDocuments(result, MONTH, ORG)).toHaveLength(7);
  });

  it("releases every document once the remarks are resolved", () => {
    const rows = sampleRows();
    rows[1].personCode = "p3"; rows[2].reported = 12; rows[3].reason = "отпуск"; rows[3].replaced = "Кузнецов Артём Игоревич";
    const result = evaluate(rows, PEOPLE, MONTH);
    expect(result.issues).toEqual([]);
    const docs = buildDocuments(result, MONTH, ORG);
    expect(docs).toHaveLength(13);
    expect(docs.find((d) => d.id === "order:p6")!.blocks.map((b) => b.text).join("\n")).toContain("на период отпуска Кузнецова А. И.");
    expect(docs.at(-1)!.blocks.map((b) => b.text).join("\n")).toContain(`Общая сумма выплат: ${rub(result.total)}`);
  });
});

describe("office files", () => {
  it("reads back the workbook it writes", () => {
    const rows = sampleRows();
    expect(importTimesheet(exportTimesheet(rows, MONTH), MONTH).map(withoutId)).toEqual(rows.map(withoutId));
  });

  it("refuses a sheet for another month", () => {
    expect(() => importTimesheet(exportTimesheet(sampleRows(), "2026-09"), MONTH)).toThrow(/Месяц внутри файла/);
  });

  it("writes Word documents and one archive of them", () => {
    const docs = buildDocuments(evaluate(sampleRows(), PEOPLE, MONTH), MONTH, ORG);
    expect(new TextDecoder().decode(unzipSync(docx(docs[0]))["word/document.xml"])).toContain("ПРИКАЗ №");
    expect(Object.keys(unzipSync(packageZip(docs)))).toHaveLength(docs.length);
  });
});
