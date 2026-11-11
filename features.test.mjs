import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAction,
  amount,
  transfers,
  visiblePixKeys,
  calendarUrl,
} from "./supabase/functions/_shared/features.mjs";
import { seed, migrate } from "./supabase/functions/_shared/domain.mjs";
import {
  createRoom,
  play,
  question,
} from "./supabase/functions/_shared/games.mjs";
const date = {
  day: "07/11/2026",
  time: "23:30",
  title: "Videogame",
  description: "A&B",
  location: "Casa do Batata",
  status: "Confirmado",
};
test("Limpeza mantém publicações da turma, perfil e avisos", () => {
  const s = seed();
  s.events = ["demo1", "real", "demo3"].map((id) => ({ id }));
  s.user = "Batata";
  const after = migrate(s);
  assert.deepEqual(after.events, [{ id: "real" }]);
  assert.equal(after.user, "Batata");
  assert.equal(seed().events.length, 0);
});
test("Dois membros assumem itens, dividem gastos e acertam sem perder dados na edição", () => {
  let s = seed(),
    n = 0;
  function doIt(user, op, args) {
    s = applyAction(s, user, { op, key: "action" + ++n, id: "event", ...args });
  }
  doIt("Batata", "save", { id: null, key: "event", draft: date });
  doIt("Batata", "item", { name: "Controle", mine: false });
  const item = s.events[0].items[0].id;
  doIt("Zé", "claim", { item, take: true });
  assert.throws(() => doIt("Neto", "claim", { item, take: true }));
  for (const u of ["Batata", "Zé", "Neto"]) doIt(u, "attend", { value: true });
  doIt("Batata", "expense", {
    title: "Pizza",
    amount: "10,00",
    people: ["Batata", "Zé", "Neto"],
  });
  const list = transfers(s.events[0].expenses);
  assert.equal(
    list.reduce((a, t) => a + t[2], 0),
    666,
  );
  for (const [from, to, cents] of list) doIt(from, "settle", { to, cents });
  assert.deepEqual(transfers(s.events[0].expenses, s.events[0].payments), []);
  doIt("Batata", "save", { draft: { ...date, title: "Videogame + pizza" } });
  assert.equal(s.events[0].items[0].owner, "Zé");
  assert.equal(s.events[0].payments.length, 2);
  assert.throws(() => amount("-0,99"));
  const url = new URL(calendarUrl(s.events[0]));
  assert.equal(url.searchParams.get("details"), "A&B");
  assert.equal(
    url.searchParams.get("dates"),
    "20261108T023000Z/20261108T033000Z",
  );
});
test("Salas isoladas, jogadores, vez no xadrez, pontuação e casas fixas", () => {
  for (const kind of ["Quiz", "Xadrez"]) {
    let r = createRoom(kind, "Zé", "id");
    r = play(r, "Neto", { op: "join" });
    if (kind === "Quiz") r = play(r, "Zé", { op: "start" }, 1000);
    if (kind === "Xadrez") {
      assert.throws(() =>
        play(r, "Neto", { op: "move", from: "e7", to: "e5" }),
      );
      r = play(r, "Zé", { op: "move", from: "e2", to: "e4" });
      assert.equal(r.moves[0], "e4");
    }
    if (kind === "Quiz") {
      r = play(
        r,
        "Zé",
        { op: "answer", round: 0, choice: question(r)[2] },
        2000,
      );
      assert.equal(r.scores.Zé, 1);
      assert.throws(() =>
        play(r, "Zé", { op: "answer", round: 0, choice: 0 }, 2000),
      );
      r = play(r, "Neto", { op: "answer", round: 0, choice: 0 }, 2000);
      assert.equal(r.round, 1);
    }
  }
});

test("Acerto parcial preserva centavos e limita quem vê a chave Pix", () => {
  let state = seed();
  const act = (user, op, args) => {
    state = applyAction(state, user, { op, id: "role", ...args });
  };
  act("Zé", "pix", { value: "ze@example.com" });
  act("Zé", "save", { id: null, key: "role", draft: date });
  for (const user of ["Zé", "Neto"]) act(user, "attend", { value: true });
  act("Zé", "expense", { key: "pizza", title: "Pizza", amount: "60,01", people: ["Neto"] });
  assert.equal(visiblePixKeys(state, "Neto").Zé, "ze@example.com");
  assert.deepEqual(visiblePixKeys(state, "Fred"), {});
  const pay = (cents, expectedCents) => act("Neto", "settle", { to: "Zé", cents, expectedCents });
  for (const invalid of [0, -1, 6002, 0.5]) assert.throws(() => pay(invalid, 6001));
  pay(2000, 6001);
  assert.throws(() => pay(2000, 6001));
  assert.deepEqual(transfers(state.events[0].expenses, state.events[0].payments), [["Neto", "Zé", 4001]]);
  pay(4001, 4001);
  assert.deepEqual(visiblePixKeys(state, "Neto"), {});
  assert.throws(() => act("Zé", "pix", { value: "inválida" }));
  act("Zé", "pix", { value: null });
  assert.deepEqual(visiblePixKeys(state, "Zé"), { Zé: null });
});
