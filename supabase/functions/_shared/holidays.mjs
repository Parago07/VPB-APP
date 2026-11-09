import { dateKey } from "./domain.mjs";
// Domingo de Páscoa pelo algoritmo gregoriano anônimo (Meeus/Jones/Butcher).
export function easter(year) {
  const a = year % 19,
    b = Math.floor(year / 100),
    c = year % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31),
    day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
export const holidayKind = "Feriado nacional",
  optionalKind = "Ponto facultativo";
const fixed = [
  ["01-01", "Confraternização Universal"],
  ["04-21", "Tiradentes"],
  ["05-01", "Dia do Trabalho"],
  ["09-07", "Independência do Brasil"],
  ["10-12", "Nossa Senhora Aparecida"],
  ["11-02", "Finados"],
  ["11-15", "Proclamação da República"],
  ["11-20", "Consciência Negra", 2024],
  ["12-25", "Natal"],
];
const movable = [
  [-48, "Carnaval", optionalKind],
  [-47, "Carnaval", optionalKind],
  [-2, "Sexta-feira Santa", holidayKind],
  [60, "Corpus Christi", optionalKind],
];
export function holidays(year) {
  const base = easter(year);
  return [
    ...fixed
      .filter(([, , since = 0]) => year >= since)
      .map(([md, name]) => ({
        date: year + "-" + md,
        name,
        kind: holidayKind,
      })),
    ...movable.map(([offset, name, kind]) => ({
      date: dateKey(
        new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset),
      ),
      name,
      kind,
    })),
  ].sort((x, y) => x.date.localeCompare(y.date));
}
const leap = (y) => new Date(y, 1, 29).getMonth() === 1;
export function birthdayDate(year, md) {
  return year + "-" + (md === "02-29" && !leap(year) ? "02-28" : md);
}
// Feriados e aniversários do ano, sem horário, para exibir na agenda.
export function specialDays(year, birthdays = {}) {
  return [
    ...holidays(year).map((h) => ({ ...h, type: "holiday" })),
    ...Object.entries(birthdays)
      .map(([name, md]) => ({
        date: birthdayDate(year, md),
        name,
        kind: "Aniversário",
        type: "birthday",
      }))
      .sort((x, y) => x.name.localeCompare(y.name, "pt-BR")),
  ];
}
