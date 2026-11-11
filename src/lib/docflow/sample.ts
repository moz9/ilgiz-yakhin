import type { Organization, Person, Row } from "./rules";

/** Everything here is invented: the organisation, the people and the hours. */
export const MONTH = "2026-10";
export const ORG: Organization = { name: "ООО «Демо-Центр»", city: "г. Казань", head: "Орлов Павел Николаевич", headPosition: "Директор", headPositionGenitive: "директора" };

export const PEOPLE: Person[] = [
  { code: "p1", name: "Соколова Марина Андреевна", position: "администратор", contractNumber: "14", contractDate: "2023-03-01" },
  { code: "p2", name: "Кузнецов Артём Игоревич", position: "техник", contractNumber: "22", contractDate: "2024-06-17" },
  { code: "p3", name: "Кузнецов Алексей Павлович", position: "оператор", contractNumber: "31", contractDate: "2025-02-03" },
  { code: "p4", name: "Гарипова Алсу Ринатовна", position: "кассир", contractNumber: "9", contractDate: "2022-09-12" },
  { code: "p5", name: "Белова Ольга Викторовна", position: "старший администратор", contractNumber: "5", contractDate: "2021-11-08" },
  { code: "p6", name: "Назаров Дмитрий Сергеевич", position: "инструктор", contractNumber: "27", contractDate: "2024-10-21" },
  { code: "p7", name: "Мельник Татьяна Юрьевна", position: "аниматор", contractNumber: "35", contractDate: "2025-05-19" },
];

const marks = (days: number[], hours: number) => Object.fromEntries(days.map((d) => [d, hours]));

/**
 * The sample sheet carries three typical remarks on purpose: a short name that fits two
 * people, a total that disagrees with the daily marks, and a row with no reason given.
 */
export const sampleRows = (): Row[] => [
  { id: "r1", name: "Соколова М.А.", personCode: "", salary: 42000, normHours: 176, reason: "отпуск", replaced: "Белова Ольга Викторовна", marks: marks([5, 6, 7, 8, 9, 12, 13, 14], 2), reported: 16 },
  { id: "r2", name: "Кузнецов А.", personCode: "", salary: 48000, normHours: 176, reason: "вакантная должность", replaced: "", marks: marks([1, 2, 5, 6, 7], 3), reported: 15 },
  { id: "r3", name: "Гарипова А.Р.", personCode: "", salary: 39000, normHours: 176, reason: "больничный", replaced: "Соколова Марина Андреевна", marks: marks([19, 20, 21, 22], 3), reported: 14 },
  { id: "r4", name: "Назаров Д.С.", personCode: "", salary: 45000, normHours: 176, reason: "", replaced: "", marks: marks([12, 13, 14, 15, 16], 2), reported: 10 },
  { id: "r5", name: "Мельник Т.Ю.", personCode: "", salary: 36000, normHours: 176, reason: "вакантная должность", replaced: "", marks: marks([3, 4, 10, 11, 17, 18], 4), reported: 24 },
  { id: "r6", name: "Белова О.В.", personCode: "", salary: 52000, normHours: 176, reason: "неполная ставка", replaced: "Назаров Дмитрий Сергеевич", marks: marks([26, 27, 28, 29, 30], 2), reported: 10 },
];
