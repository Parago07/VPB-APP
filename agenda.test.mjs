import test from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  migrate,
  parseBirthday,
} from "./supabase/functions/_shared/domain.mjs";
import { applyAction } from "./supabase/functions/_shared/features.mjs";
import {
  easter,
  holidays,
  specialDays,
  holidayKind,
  optionalKind,
} from "./supabase/functions/_shared/holidays.mjs";
import { dateKey } from "./supabase/functions/_shared/domain.mjs";

test("Aniversário aceita DD/MM, com ou sem ano, e recusa datas impossíveis", () => {
  assert.equal(parseBirthday("12/03"), "03-12");
  assert.equal(parseBirthday(" 5/9 "), "09-05");
  assert.equal(parseBirthday("29/02"), "02-29");
  assert.equal(parseBirthday("12/03/1995"), "03-12");
  for (const bad of [
    "31/02",
    "29/02/1995",
    "00/01",
    "12/13",
    "12-03",
    "",
    "1/1/1800",
    "1/1/2999",
    undefined,
    42,
  ])
    assert.equal(parseBirthday(bad), null, String(bad));
});

test("Cada membro salva o próprio aniversário, e estados antigos continuam válidos", () => {
  let s = seed();
  s = applyAction(s, "Zé", { op: "birthday", value: "12/03", key: "a1" });
  s = applyAction(s, "Neto", { op: "birthday", value: "01/01", key: "a2" });
  s = applyAction(s, "Zé", { op: "birthday", value: "13/03", key: "a3" });
  assert.deepEqual(s.birthdays, { Zé: "03-13", Neto: "01-01" });
  assert.throws(
    () => applyAction(s, "Zé", { op: "birthday", value: "31/04" }),
    /DD\/MM/,
  );
  assert.throws(() =>
    applyAction(s, "Fulano", { op: "birthday", value: "01/01" }),
  );
  const old = { ...seed(), user: "Zé" };
  delete old.birthdays;
  assert.deepEqual(migrate(old).birthdays, {});
  assert.deepEqual(
    applyAction(old, "Zé", { op: "birthday", value: "02/02" }).birthdays,
    { Zé: "02-02" },
  );
});

test("Páscoa e feriados móveis seguem o calendário oficial", () => {
  const known = {
    2024: "2024-03-31",
    2025: "2025-04-20",
    2026: "2026-04-05",
    2027: "2027-03-28",
    2038: "2038-04-25",
  };
  for (const [year, date] of Object.entries(known))
    assert.equal(dateKey(easter(Number(year))), date);
  const y2026 = holidays(2026);
  const on = (date) => y2026.filter((h) => h.date === date);
  assert.deepEqual(on("2026-02-16")[0], {
    date: "2026-02-16",
    name: "Carnaval",
    kind: optionalKind,
  });
  assert.equal(on("2026-02-17")[0].name, "Carnaval");
  assert.equal(on("2026-04-03")[0].name, "Sexta-feira Santa");
  assert.equal(on("2026-04-03")[0].kind, holidayKind);
  assert.equal(on("2026-06-04")[0].name, "Corpus Christi");
  assert.equal(on("2026-11-20")[0].name, "Consciência Negra");
  assert.equal(y2026.filter((h) => h.kind === holidayKind).length, 10);
  assert.ok(!holidays(2023).some((h) => h.name === "Consciência Negra"));
  assert.deepEqual(
    y2026.map((h) => h.date),
    [...y2026.map((h) => h.date)].sort(),
  );
});

test("Aniversários entram na agenda todo ano; 29/02 aparece em 28/02 fora do bissexto", () => {
  const birthdays = { Zé: "03-12", Batata: "02-29", Asaf: "03-12" };
  const of = (year, type) =>
    specialDays(year, birthdays).filter((x) => x.type === type);
  assert.deepEqual(
    of(2026, "birthday").map((x) => [x.name, x.date]),
    [
      ["Asaf", "2026-03-12"],
      ["Batata", "2026-02-28"],
      ["Zé", "2026-03-12"],
    ],
  );
  assert.equal(
    of(2028, "birthday").find((x) => x.name === "Batata").date,
    "2028-02-29",
  );
  assert.equal(of(2026, "holiday").length, holidays(2026).length);
});
