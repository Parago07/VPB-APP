import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button, s, green, ink } from "./ui";
import {
  games,
  question,
  chessBoard,
  chessRanking,
} from "./supabase/functions/_shared/games.mjs";
import Impostor from "./Impostor";
const glyph = {
  w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
  b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
};
function Grid({ n, cell }) {
  return (
    <View style={{ width: "100%", maxWidth: 400, alignSelf: "center" }}>
      {Array.from({ length: n }, (_, r) => (
        <View key={r} style={{ flexDirection: "row" }}>
          {Array.from({ length: n }, (_, c) => {
            const i = r * n + c,
              v = cell(i, r, c);
            return (
              <Pressable
                key={c}
                accessibilityLabel={v.label}
                accessibilityRole="button"
                onPress={v.press}
                style={{
                  width: 100 / n + "%",
                  aspectRatio: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: v.bg,
                  borderWidth: 0.5,
                  borderRightWidth: n === 9 && c % 3 === 2 ? 2 : 0.5,
                  borderBottomWidth: n === 9 && r % 3 === 2 ? 2 : 0.5,
                  borderColor: "#778575",
                }}
              >
                <Text
                  style={{
                    fontWeight: v.bold ? "bold" : "normal",
                    fontSize: n === 8 ? 26 : 18,
                    color: ink,
                  }}
                >
                  {v.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
export default function Games({ state, run, group }) {
  const [id, choose] = useState(null),
    [sel, select] = useState(null),
    [now, tick] = useState(Date.now()),
    [promotion, promote] = useState("q");
  const r = state.rooms.find((x) => x.id === id),
    u = state.user;
  const play = (a) => run({ op: "room.play", id, play: a });
  useEffect(() => {
    if (r?.kind !== "Quiz" || r.stage !== "Jogando") return;
    const t = setInterval(() => tick(Date.now()), 500);
    return () => clearInterval(t);
  }, [r?.kind, r?.stage]);
  if (!r)
    return (
      <>
        <Text style={s.label}>
          {group ? "SALAS DA TURMA" : "SALAS DE TESTE NESTE APARELHO"}
        </Text>
        <Text style={s.body}>Abrir uma sala</Text>
        <View style={s.row}>
          {games.map((kind) => (
            <Button
              key={kind}
              onPress={async () => {
                const key = await run({ op: "room.new", kind });
                if (key) {
                  choose(key);
                  select(null);
                }
              }}
            >
              {kind}
            </Button>
          ))}
        </View>
        <Text style={s.label}>RANKING DE XADREZ</Text>
        {chessRanking(state.rooms).length ? (
          chessRanking(state.rooms).map(([name, points]) => (
            <Text key={name}>
              {name} · {points.toLocaleString("pt-BR")} pts
            </Text>
          ))
        ) : (
          <Text>O ranking começa na primeira partida concluída.</Text>
        )}
        <Text style={s.label}>Sudoku pausado · ranking por tempo previsto</Text>
        {[...state.rooms]
          .filter((x) => x.kind !== "Sudoku")
          .reverse()
          .map((x) => (
            <View key={x.id} style={s.box}>
              <Text style={s.body}>
                {x.kind} · {x.host}
              </Text>
              <Text>
                {x.stage} · {x.players.length} jogadores
              </Text>
              <Button
                onPress={() => {
                  choose(x.id);
                  select(null);
                }}
              >
                Abrir sala
              </Button>
            </View>
          ))}
      </>
    );
  const joined = r.players.includes(u);
  return (
    <>
      <Button onPress={() => choose(null)}>Todas as salas</Button>
      <View style={s.box}>
        <Text style={s.heading}>{r.kind}</Text>
        <Text>{r.players.join(" · ")}</Text>
        <Text style={s.label}>{r.stage}</Text>
      </View>
      {r.stage === "Espera" &&
        (!joined ? (
          <Button onPress={() => play({ op: "join" })}>
            Entrar na partida
          </Button>
        ) : r.host === u &&
          r.players.length < (r.kind === "Impostor" ? 3 : 2) ? (
          <Text>
            {r.kind === "Impostor"
              ? "São necessários três jogadores."
              : "Aguardando outro jogador entrar."}
          </Text>
        ) : r.host === u ? (
          <Button dark onPress={() => play({ op: "start" })}>
            Iniciar partida
          </Button>
        ) : (
          <Text>Aguardando o anfitrião iniciar.</Text>
        ))}
      {r.kind === "Impostor" && r.stage !== "Espera" && (
        <Impostor
          key={r.id + ":" + r.round + ":" + u}
          r={r}
          user={u}
          play={play}
        />
      )}
      {r.stage === "Jogando" && joined && r.kind === "Quiz" && (
        <View style={s.box}>
          <Text style={s.label}>
            RODADA {r.round + 1} ·{" "}
            {Math.max(0, Math.ceil((r.deadline - now) / 1000))}s
          </Text>
          <Text style={s.body}>{question(r)[0]}</Text>
          {u in r.answers ? (
            <Text>Resposta registrada.</Text>
          ) : (
            question(r)[1].map((x, i) => (
              <Button
                key={x}
                onPress={() =>
                  play({ op: "answer", round: r.round, choice: i })
                }
              >
                {x}
              </Button>
            ))
          )}
          {now >= r.deadline && (
            <Button onPress={() => play({ op: "next", round: r.round })}>
              Avançar rodada
            </Button>
          )}
        </View>
      )}
      {r.kind === "Quiz" && r.stage !== "Espera" && (
        <Text>
          {[...r.players]
            .sort((a, b) => (r.scores[b] ?? 0) - (r.scores[a] ?? 0))
            .map((n) => n + " · " + (r.scores[n] ?? 0) + " pts")
            .join("\n")}
        </Text>
      )}
      {r.kind === "Xadrez" &&
        r.stage !== "Espera" &&
        (() => {
          const b = chessBoard(r),
            cells = b.board().flat();
          return (
            <>
              <Text>
                Jogue na sua vez, sem limite de tempo. Brancas: {r.players[0]} ·
                Pretas: {r.players[1]}
              </Text>
              {r.stage === "Jogando" && (
                <Text>
                  Vez de {r.players[b.turn() === "w" ? 0 : 1]}
                  {b.isCheck() ? " · Xeque" : ""}
                </Text>
              )}
              <Grid
                n={8}
                cell={(i, row, col) => {
                  const square = "abcdefgh"[col] + (8 - row),
                    p = cells[i];
                  return {
                    label: square,
                    text: p ? glyph[p.color][p.type] : "",
                    bg:
                      sel === square
                        ? green
                        : (row + col) % 2
                          ? "#8eaa8f"
                          : "#f1edd9",
                    press: async () => {
                      if (r.stage !== "Jogando" || !joined) return;
                      if (!sel || p?.color === b.turn()) {
                        select(square);
                        return;
                      }
                      await play({
                        op: "move",
                        from: sel,
                        to: square,
                        promotion,
                      });
                      select(null);
                    },
                  };
                }}
              />
              {joined && r.stage === "Jogando" && (
                <View style={s.row}>
                  <Text>Promoção</Text>
                  {Object.entries({
                    q: "Dama",
                    r: "Torre",
                    b: "Bispo",
                    n: "Cavalo",
                  }).map(([k, v]) => (
                    <Button
                      key={k}
                      active={promotion === k}
                      onPress={() => promote(k)}
                    >
                      {v}
                    </Button>
                  ))}
                </View>
              )}
            </>
          );
        })()}
      {r.stage === "Encerrada" && r.result && (
        <Text style={s.body}>
          {r.result === "Empate" ? "Empate" : "Vencedor: " + r.result}
        </Text>
      )}
    </>
  );
}
