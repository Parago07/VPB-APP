import React, { useState } from "react";
import { View, Text, Linking } from "react-native";
import { s, Avatar, Button, Field } from "./ui";
import { defaultLook } from "./supabase/functions/_shared/domain.mjs";
import {
  amount as parseAmount,
  calendarUrl,
  brl,
  transfers,
} from "./supabase/functions/_shared/features.mjs";
function Settlement({ to, balance, pix, act, err }) {
  const [value, setValue] = useState((balance / 100).toFixed(2).replace(".", ","));
  async function record() {
    try {
      const cents = parseAmount(value);
      await act("settle", { to, cents, expectedCents: balance });
    } catch (error) {
      err(error.message);
    }
  }
  return (
    <View style={s.box}>
      <Text selectable>{pix ? "Chave Pix de " + to + ": " + pix : to + " ainda não cadastrou uma chave Pix."}</Text>
      <Field name="Quanto você pagou?" value={value} onChangeText={setValue} />
      <Button onPress={record}>Registrar pagamento</Button>
    </View>
  );
}

export default function EventExtras({ event: e, state, run, err }) {
  const [section, show] = useState("Lista"),
    [name, setName] = useState(""),
    [title, setTitle] = useState(""),
    [amount, setAmount] = useState(""),
    [people, setPeople] = useState([]);
  const u = state.user,
    attendees = e.attendees ?? [],
    items = e.items ?? [],
    expenses = e.expenses ?? [];
  const act = (op, detail = {}) => run({ op, id: e.id, ...detail });
  async function add(mine) {
    if (await act("item", { name, mine })) setName("");
  }
  async function spend() {
    if (
      await act("expense", {
        title,
        amount,
        people: people.filter((n) => attendees.includes(n)),
      })
    ) {
      setTitle("");
      setAmount("");
      setPeople([]);
    }
  }
  return (
    <>
      {e.status.indexOf("Cancelado") !== 0 && (
        <Button
          onPress={() =>
            Linking.openURL(calendarUrl(e)).catch(() =>
              err("Não foi possível abrir o Google Agenda."),
            )
          }
        >
          Adicionar ao Google Agenda ↗
        </Button>
      )}
      <View style={s.row}>
        {["Lista", "Divisão de contas"].map((x) => (
          <Button key={x} active={section === x} onPress={() => show(x)}>
            {x}
          </Button>
        ))}
      </View>
      {section === "Lista" ? (
        <View style={s.box}>
          <Text style={s.heading}>Quem leva o quê?</Text>
          {items.length === 0 && <Text>O que falta para o rolé?</Text>}
          {items.map((i) => (
            <View key={i.id} style={s.box}>
              <View style={s.row}>
                {i.owner && (
                  <Avatar compact look={state.looks[i.owner] ?? defaultLook} />
                )}
                <View>
                  <Text style={s.body}>{i.name}</Text>
                  <Text style={s.label}>{i.owner ?? "Em aberto"}</Text>
                </View>
              </View>
              {!i.owner ? (
                <Button
                  onPress={() => act("claim", { item: i.id, take: true })}
                >
                  Eu levo
                </Button>
              ) : (
                i.owner === u && (
                  <View style={s.row}>
                    <Button
                      onPress={() => act("claim", { item: i.id, take: false })}
                    >
                      Liberar item
                    </Button>
                    <Button onPress={() => act("removeItem", { item: i.id })}>
                      Remover
                    </Button>
                  </View>
                )
              )}
            </View>
          ))}
          <Field
            name="Item"
            placeholder="Ex.: controle extra"
            value={name}
            onChangeText={setName}
          />
          <View style={s.row}>
            <Button active onPress={() => add(true)}>
              Vou levar
            </Button>
            <Button onPress={() => add(false)}>Sugerir item</Button>
          </View>
        </View>
      ) : (
        <View style={s.box}>
          <Text style={s.heading}>Divisão de contas</Text>
          <Text>
            Participantes: {attendees.join(", ") || "ninguém confirmou ainda"}.
          </Text>
          <Button
            active={attendees.includes(u)}
            onPress={() => act("attend", { value: !attendees.includes(u) })}
          >
            {attendees.includes(u)
              ? "Retirar minha presença"
              : "Confirmar minha presença"}
          </Button>
          {attendees.includes(u) && (
            <>
              <Field
                name="Despesa que paguei"
                placeholder="Ex.: pizzas"
                value={title}
                onChangeText={setTitle}
              />
              <Field
                name="Valor em reais"
                placeholder="89,90"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={s.label}>DIVIDIR IGUALMENTE ENTRE</Text>
              <View style={s.row}>
                {attendees.map((n) => (
                  <Button
                    key={n}
                    active={people.includes(n)}
                    onPress={() =>
                      setPeople(
                        people.includes(n)
                          ? people.filter((x) => x !== n)
                          : [...people, n],
                      )
                    }
                  >
                    {n}
                  </Button>
                ))}
              </View>
              <Button dark onPress={spend}>
                Registrar despesa
              </Button>
            </>
          )}
          {expenses.map((x) => (
            <View style={s.box} key={x.id}>
              <Text style={s.body}>
                {x.title} · {brl(x.cents)}
              </Text>
              <Text>
                {x.payer} pagou por {x.people.join(", ")}
              </Text>
              {x.payer === u && (
                <Button onPress={() => act("removeExpense", { expense: x.id })}>
                  Excluir despesa
                </Button>
              )}
            </View>
          ))}
          <Text style={s.label}>ACERTO DO ROLÉ</Text>
          {transfers(expenses, e.payments).length ? (
            transfers(expenses, e.payments).map(([from, to, c]) => (
              <View key={from + to}>
                <Text>
                  {from} deve {brl(c)} a {to}
                </Text>
                {from === u && (
                  <Settlement key={u + ":" + c} to={to} balance={c} pix={state.pixKeys?.[to]} act={act} err={err} />
                )}
              </View>
            ))
          ) : (
            <Text>Nenhum valor pendente.</Text>
          )}
          {(e.payments ?? []).map((p) => (
            <Text key={p.id}>
              {p.from} acertou {brl(p.cents)} com {p.to}.
            </Text>
          ))}
        </View>
      )}
    </>
  );
}
