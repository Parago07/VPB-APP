import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Storage from "@react-native-async-storage/async-storage";
import Calendar from "./Calendar";
import { s, ink, green, mono, Button, Avatar, Field } from "./ui";
import {
  members,
  statuses,
  notices,
  defaultLook,
  dateKey,
  displayDate,
  saveEvent,
  seed,
  mayEdit,
  deliver,
} from "./domain.mjs";

const storageKey = "vpb:prototype:v1";
const reactions = ["Aprovo", "Neutro", "Reprovo"];
const today = dateKey(new Date());
function Prototype() {
  const [state, set] = useState(null),
    [error, err] = useState(""),
    [screen, go] = useState("Agenda");
  const [month, setMonth] = useState(new Date()),
    [day, select] = useState(today),
    [id, setId] = useState(null);
  const [draft, form] = useState({}),
    [place, locate] = useState("");
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    Storage.getItem(storageKey)
      .then((raw) => set(raw ? JSON.parse(raw) : seed()))
      .catch(() =>
        err(
          "Falha ao abrir os dados locais. Reinicie o app para tentar novamente.",
        ),
      );
  }, []);
  useEffect(() => {
    if (state)
      writes.current = writes.current
        .then(() => Storage.setItem(storageKey, JSON.stringify(state)))
        .catch(() => err("Falha ao salvar neste aparelho."));
  }, [state]);
  if (!state) return <Text style={s.wrap}>{error || "Abrindo agenda…"}</Text>;
  const { user, events } = state,
    event = events.find((e) => e.id === id),
    look = state.looks[user] ?? defaultLook;
  const posts = events.filter((e) => e.author === user).length;
  const navigate = (name) => {
    err("");
    go(name);
  };
  const open = (key) => {
    setId(key);
    navigate("Detalhes");
  };
  const edit = (item = null) => {
    setId(item?.id ?? null);
    form({
      title: item?.title ?? "",
      day: displayDate(item?.date ?? day),
      time: item?.time ?? "",
      location: item?.location ?? "",
      description: item?.description ?? "",
      status: item?.status ?? statuses[0],
    });
    navigate("Publicação");
  };
  const update = (item, type, message) => {
    const next = {
      ...state,
      events: events.some((e) => e.id === item.id)
        ? events.map((e) => (e.id === item.id ? item : e))
        : [...events, item],
    };
    set(type ? deliver(next, type, message) : next);
  };
  function submit() {
    try {
      const item = saveEvent(draft, event, user);
      const moved =
        event && (event.date !== item.date || event.time !== item.time);
      const type = event ? (moved ? notices[2] : null) : notices[0];
      update(
        item,
        type,
        type +
          " · " +
          item.title +
          " · " +
          displayDate(item.date) +
          " " +
          item.time,
      );
      select(item.date);
      setMonth(new Date(item.date + "T12:00:00"));
      open(item.id);
    } catch (e) {
      err(e.message);
    }
  }
  const status = (value) =>
    update(
      { ...event, status: value },
      value === statuses[1] ? notices[1] : notices[3],
      value + " · " + event.title,
    );
  const changeLook = (key, value) =>
    set({
      ...state,
      looks: { ...state.looks, [user]: { ...look, [key]: value } },
    });
  const options = (title, key, values) => (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{title}</Text>
      <View style={s.row}>
        {values.map((v, i) => (
          <Button
            key={v}
            active={look[key] === i}
            onPress={() => changeLook(key, i)}
          >
            {v}
          </Button>
        ))}
      </View>
    </View>
  );
  return (
    <SafeAreaView style={s.page}>
      <StatusBar style="dark" />
      <View style={{ backgroundColor: ink }}>
        <View
          style={[
            s.spread,
            { width: "100%", maxWidth: 740, alignSelf: "center", padding: 14 },
          ]}
        >
          <Text
            style={{
              color: green,
              fontFamily: mono,
              fontWeight: "900",
              fontSize: 22,
            }}
          >
            ▦ VPB
          </Text>
          <Text style={{ color: "white", fontFamily: mono }}>
            Agenda da turma
          </Text>
        </View>
      </View>
      <ScrollView
        key={screen}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.wrap}
      >
        {screen === "Agenda" ? (
          <Calendar
            {...{ month, day, select, events, open }}
            create={() => edit()}
            signal={() => {
              locate("");
              navigate("Batsinal");
            }}
            change={(delta) => {
              const next = new Date(
                month.getFullYear(),
                month.getMonth() + delta,
                1,
              );
              setMonth(next);
              select(dateKey(next));
            }}
          />
        ) : (
          <View style={s.spread}>
            <Text style={s.heading}>{screen}</Text>
            <Button onPress={() => navigate("Agenda")}>Agenda</Button>
          </View>
        )}
        {screen === "Publicação" && (
          <>
            {!event && (
              <View style={s.row}>
                {statuses.slice(0, 2).map((v) => (
                  <Button
                    key={v}
                    active={draft.status === v}
                    onPress={() => form({ ...draft, status: v })}
                  >
                    {v}
                  </Button>
                ))}
              </View>
            )}
            {[
              ["title", "Nome do rolê", "Futebol"],
              ["day", "Dia", "DD/MM/AAAA"],
              ["time", "Horário", "HH:MM"],
              ["location", "Local (opcional)", ""],
              ["description", "Descrição (opcional)", ""],
            ].map(([k, name, hint]) => (
              <Field
                key={k}
                name={name}
                placeholder={hint}
                value={draft[k]}
                onChangeText={(v) => form({ ...draft, [k]: v })}
              />
            ))}
            <Button dark onPress={submit}>
              {event ? "Salvar alterações" : "Publicar"}
            </Button>
          </>
        )}
        {screen === "Detalhes" && event && (
          <>
            <View style={s.box}>
              <Text style={s.label}>
                {event.status} · {displayDate(event.date)} · {event.time}
              </Text>
              <Text style={s.heading}>{event.title}</Text>
              {!!event.location && <Text style={s.body}>{event.location}</Text>}
              {!!event.description && <Text>{event.description}</Text>}
              <View style={s.row}>
                <Avatar look={state.looks[event.author] ?? defaultLook} />
                <Text>{event.author}</Text>
              </View>
            </View>
            <Text style={s.label}>REAÇÕES</Text>
            <View style={s.row}>
              {reactions.map((v) => (
                <Button
                  key={v}
                  active={event.reactions[user] === v}
                  onPress={() =>
                    update({
                      ...event,
                      reactions: { ...event.reactions, [user]: v },
                    })
                  }
                >
                  {v} ·{" "}
                  {Object.values(event.reactions).filter((x) => x === v).length}
                </Button>
              ))}
            </View>
            {mayEdit(user, event) && (
              <View style={s.row}>
                <Button onPress={() => edit(event)}>Editar</Button>
                {event.author === user && event.status === statuses[0] && (
                  <Button active onPress={() => status(statuses[1])}>
                    Confirmar rolê
                  </Button>
                )}
                {statuses.slice(0, 2).includes(event.status) &&
                  statuses.slice(2).map((v) => (
                    <Button key={v} onPress={() => status(v)}>
                      {v}
                    </Button>
                  ))}
              </View>
            )}
          </>
        )}
        {screen === "Batsinal" && (
          <>
            <Field
              name="Local"
              value={place}
              placeholder="Casa do Neto"
              onChangeText={locate}
            />
            <Text style={s.body}>
              {user} enviou um batsinal: '{place.trim() || "nome do local"}'
            </Text>
            <Text style={s.label}>
              Simulação local · entrega nos avisos dos outros perfis de teste.
            </Text>
            <Button
              active
              onPress={() => {
                if (!place.trim()) return err("Informe o local.");
                set(
                  deliver(
                    state,
                    "Batsinal",
                    user + " enviou um batsinal: '" + place.trim() + "'",
                  ),
                );
                navigate("Agenda");
                err("Batsinal enviado aos perfis locais com o aviso ativo.");
              }}
            >
              Soltar batsinal
            </Button>
          </>
        )}
        {screen === "Perfil" && (
          <>
            <View style={[s.box, s.row]}>
              <Avatar look={look} large />
              <View>
                <Text style={s.heading}>{user}</Text>
                <Text>{posts} de 3 postagens para os itens</Text>
              </View>
            </View>
            {options("CABELO", "hair", ["Curto", "Espetado", "Franja"])}
            {options("PELE", "skin", ["Mel", "Castanha", "Escura", "Clara"])}
            {options("ROUPA", "shirt", ["Terracota", "Verde", "Azul", "Lilás"])}
            {posts >= 3 ? (
              <>
                {options("CHAPÉU", "hat", [
                  "Sem chapéu",
                  "Mao Tsé-Tung",
                  "Guarda Real",
                ])}
                <Button
                  active={look.speaker}
                  onPress={() => changeLook("speaker", !look.speaker)}
                >
                  Balthinha {look.speaker ? "equipada" : "no inventário"}
                </Button>
              </>
            ) : (
              <Text style={s.box}>
                Na 3ª postagem você ganha os dois chapéus e a Balthinha.
              </Text>
            )}
            <Button onPress={() => navigate("Perfis de teste")}>
              Trocar perfil de teste
            </Button>
          </>
        )}
        {screen === "Perfis de teste" && (
          <View style={s.row}>
            {members.map((name) => (
              <Button
                key={name}
                active={name === user}
                onPress={() => {
                  set({ ...state, user: name });
                  navigate("Perfil");
                }}
              >
                {name}
              </Button>
            ))}
          </View>
        )}
        {screen === "Avisos" && (
          <>
            <Text style={s.label}>PREFERÊNCIAS DE {user.toUpperCase()}</Text>
            {notices.map((v) => (
              <View key={v} style={[s.box, s.spread]}>
                <Text>{v}</Text>
                <Switch
                  accessibilityLabel={v}
                  value={state.prefs[user]?.[v] !== false}
                  onValueChange={(on) =>
                    set({
                      ...state,
                      prefs: {
                        ...state.prefs,
                        [user]: { ...state.prefs[user], [v]: on },
                      },
                    })
                  }
                />
              </View>
            ))}
            <Text style={s.label}>AVISOS SIMULADOS NESTE APARELHO</Text>
            {[...(state.inbox[user] ?? [])].reverse().map((v, i) => (
              <Text style={s.box} key={i}>
                {v}
              </Text>
            ))}
            {!state.inbox[user]?.length && <Text>Nenhum aviso recebido.</Text>}
          </>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={s.body}>
            {error}
          </Text>
        )}
      </ScrollView>
      <View
        style={[
          s.row,
          {
            justifyContent: "center",
            padding: 8,
            borderTopWidth: 1,
            borderColor: ink,
          },
        ]}
      >
        {["Agenda", "Avisos", "Perfil"].map((v) => (
          <Button key={v} active={screen === v} onPress={() => navigate(v)}>
            {v}
          </Button>
        ))}
      </View>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Prototype />
    </SafeAreaProvider>
  );
}

