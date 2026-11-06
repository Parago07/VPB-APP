import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAction,
  amount,
  transfers,
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
  for (const kind of ["Quiz", "Xadrez", "Sudoku"]) {
    let r = createRoom(kind, "Zé", "id");
    r = play(r, "Neto", { op: "join" });
    r = play(r, "Zé", { op: "start" }, 1000);
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
    if (kind === "Sudoku") {
      assert.throws(() => play(r, "Zé", { op: "digit", index: 0, value: "3" }));
      r = play(r, "Zé", { op: "digit", index: 2, value: "3" });
      assert.equal(r.boards.Zé[2], "3");
      assert.equal(r.boards.Neto, undefined);
    }
  }
});
