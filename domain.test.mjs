import test from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  notices,
  deliver,
  members,
  saveEvent,
  parseDate,
  mayEdit,
} from "./supabase/functions/_shared/domain.mjs";

const draft = {
  day: "06/11/2026",
  time: "19:00",
  title: "Futebol",
  location: "",
  description: "",
  status: "Sugestão",
};
test("Valida data de calendário e horário obrigatório", () => {
  assert.equal(parseDate("31/02/2026"), null);
  assert.equal(parseDate("29/02/2028"), "2028-02-29");
  assert.throws(() => saveEvent({ ...draft, time: "24:00" }, null, "Zé"));
});
test("Editar preserva autor e identidade, mas mudar dia ou hora zera reações", () => {
  const old = {
    ...saveEvent(draft, null, "Zé"),
    reactions: { Neto: "Aprovo" },
  };
  assert.ok(mayEdit("Kcaio", old));
  assert.ok(mayEdit("Mateus Lessa", old));
  assert.ok(!mayEdit("Gabri", old));
  const edit = saveEvent({ ...draft, title: "Futsal" }, old, "Kcaio");
  assert.deepEqual(edit.reactions, old.reactions);
  assert.equal(edit.author, "Zé");
  assert.equal(edit.id, old.id);
  for (const changed of [{ time: "20:00" }, { day: "07/11/2026" }])
    assert.deepEqual(
      saveEvent({ ...draft, ...changed }, old, "Zé").reactions,
      {},
    );
});
test("Batsinal respeita preferências por perfil sem gerar publicação", () => {
  const state = seed();
  state.prefs.Neto = { Batsinal: false };
  state.prefs.Zé = { [notices[0]]: false };
  const next = deliver(state, "Batsinal", "Kcaio enviou um batsinal: 'Praça'");
  assert.equal(members.length, 28);
  assert.equal(next.inbox.Neto, undefined);
  assert.equal(next.inbox.Kcaio, undefined);
  assert.equal(next.inbox.Zé.length, 1);
  assert.deepEqual(next.events, state.events);
  assert.equal(Object.keys(next.inbox).length, 26);
});
