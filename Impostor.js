import React, { useState } from "react";
import { View, Text } from "react-native";
import { Button, Field, s } from "./ui";
export default function Impostor({ r, user, play }) {
  const [text, edit] = useState(""),
    [revealed, reveal] = useState(false);
  if (!r.players.includes(user)) return <Text>Sessão em andamento.</Text>;
  const send = (op, args = {}) => play({ op, round: r.round, ...args });
  const writing = ["Perguntas", "Respostas"].includes(r.stage);
  return (
    <View style={s.box}>
      <Text style={s.label}>RODADA {r.round}</Text>
      {r.role && (
        <>
          <Button onPress={() => reveal(!revealed)}>
            {revealed ? "Ocultar meu papel" : "Ver meu papel"}
          </Button>
          {revealed && (
            <Text style={s.body}>
              {r.role === "Impostor"
                ? "Você é o impostor. Tente passar despercebido."
                : "Você é da turma. Descubra quem está blefando."}
            </Text>
          )}
        </>
      )}
      {writing &&
        (r.sent ? (
          <Text>Envio registrado. Aguardando a turma.</Text>
        ) : (
          <>
            {r.prompt && <Text style={s.body}>{r.prompt}</Text>}
            <Field
              name={
                r.stage === "Perguntas"
                  ? "Sua pergunta anônima"
                  : "Sua resposta"
              }
              value={text}
              onChangeText={edit}
              maxLength={200}
            />
            <Button
              dark
              onPress={async () => {
                if (
                  await send(r.stage === "Perguntas" ? "ask" : "respond", {
                    text,
                  })
                )
                  edit("");
              }}
            >
              Enviar {r.stage === "Perguntas" ? "pergunta" : "resposta"}
            </Button>
          </>
        ))}
      {r.stage === "Votação" && (
        <>
          <Text style={s.heading}>Quem é o impostor?</Text>
          {r.ballot.map((x) => (
            <View style={s.box} key={x.name}>
              <Text style={s.label}>{x.name}</Text>
              <Text>{x.question}</Text>
              <Text style={s.body}>{x.answer}</Text>
              {!r.sent && x.name !== user && (
                <Button onPress={() => send("vote", { target: x.name })}>
                  Votar em {x.name}
                </Button>
              )}
            </View>
          ))}
          {r.sent && <Text>Voto registrado.</Text>}
        </>
      )}
      {r.last && (
        <>
          <Text style={s.body}>{r.last.impostor} era o impostor.</Text>
          <Text>+1 ponto: {r.last.winners.join(", ")}</Text>
        </>
      )}
      <Text style={s.label}>RANKING DA SESSÃO</Text>
      {[...r.players]
        .sort((a, b) => (r.scores[b] ?? 0) - (r.scores[a] ?? 0))
        .map((n) => (
          <Text key={n}>
            {n} · {r.scores[n] ?? 0} pts
          </Text>
        ))}
      {r.stage === "Resultado" && r.host === user && (
        <View style={s.row}>
          <Button active onPress={() => send("again")}>
            Nova rodada
          </Button>
          <Button onPress={() => send("finish")}>Encerrar sessão</Button>
        </View>
      )}
    </View>
  );
}
