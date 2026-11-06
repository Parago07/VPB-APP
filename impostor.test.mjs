import test from "node:test";
import assert from "node:assert/strict";
import {
  play,
  createRoom,
  chessRanking,
} from "./supabase/functions/_shared/games.mjs";
import { roomView } from "./supabase/functions/_shared/impostor.mjs";
const players = ["Kcaio", "Neto", "Zé", "Batata"];
test("Sessão privada, sorteio um a um, apuração única e pontos acumulados", () => {
  let r = createRoom("Impostor", players[0], "test");
  for (const u of players.slice(1)) r = play(r, u, { op: "join" });
  r = play(r, players[0], { op: "start" });
  const expected = {};
  for (let round = 1; round <= 2; round++) {
    const action = (u, op, args = {}) => play(r, u, { op, round, ...args });
    const impostor = r.secret.impostor;
    assert.equal(
      players.filter((u) => roomView(r, u).role === "Impostor").length,
      1,
    );
    assert.equal(roomView(r, "Fred").role, undefined);
    assert.equal(roomView(r, impostor).person, undefined);
    assert.equal(roomView(r, "Fred").person, undefined);
    const prompts = players.map((u) => roomView(r, u).prompt);
    assert.equal(new Set(prompts).size, players.length);
    for (const u of players) {
      const view = roomView(r, u);
      assert.equal(view.secret, undefined);
      if (u !== impostor) assert.equal(view.person, r.secret.person);
      r = action(u, "respond", { text: "Resposta " + u });
    }
    for (const u of players) {
      const v = roomView(r, u);
      assert.equal(v.ballot.length, 4);
      assert.equal(v.votes, undefined);
      assert.equal(v.last, undefined);
      assert.throws(() => action(u, "vote", { target: u }));
      const target =
        round === 1 && u !== impostor
          ? impostor
          : players.find((n) => n !== u && n !== impostor);
      r = action(u, "vote", { target });
    }
    const winners =
      round === 1 ? players.filter((u) => u !== impostor) : [impostor];
    winners.forEach((u) => (expected[u] = (expected[u] ?? 0) + 1));
    assert.deepEqual(r.scores, expected);
    assert.equal(r.last.impostor, impostor);
    assert.throws(() => action(players[0], "vote", { target: players[1] }));
    r = action(players[0], round === 1 ? "again" : "finish");
  }
  assert.equal(r.stage, "Encerrada");
});
test("Sudoku pausado e xadrez por correspondência com ranking de partidas concluídas", () => {
  assert.throws(() => createRoom("Sudoku", "Neto", "id"));
  assert.throws(() => play({ kind: "Sudoku" }, "Neto", { op: "join" }));
  let r = createRoom("Xadrez", "Kcaio", "id");
  r = play(r, "Neto", { op: "join" });
  assert.equal(r.stage, "Jogando");
  for (const [u, from, to] of [
    ["Kcaio", "f2", "f3"],
    ["Neto", "e7", "e5"],
    ["Kcaio", "g2", "g4"],
    ["Neto", "d8", "h4"],
  ])
    r = play(r, u, { op: "move", from, to });
  assert.deepEqual(chessRanking([r]), [
    ["Neto", 1],
    ["Kcaio", 0],
  ]);
});
