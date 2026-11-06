import React, { useState } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useGroup } from "./useGroup";
import EventExtras from "./EventExtras";
import Games from "./Games";
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
  mayEdit,
} from "./supabase/functions/_shared/domain.mjs";

const reactions = ["Aprovo", "Neutro", "Reprovo"];
const today = dateKey(new Date());
function Prototype() {
  const [error, err] = useState(""),
    [screen, go] = useState("Agenda");
  const [month, setMonth] = useState(new Date()),
    [day, select] = useState(today),
    [id, setId] = useState(null);
  const [draft, form] = useState({}),
    [place, locate] = useState("");
  const group = useGroup(err);
  const { state } = group;
  const [code, setCode] = useState("");
  async function run(action) {
    try {
      err("");
      return await group.act(action);
    } catch (e) {
      err(e.message);
      return null;
    }
  }
  async function connect() {
    try {
      await group.link(code.trim());
      setCode("");
      err("");
    } catch (e) {
      err(e.message);
    }
  }
  if (!state)
    return (
      <SafeAreaView style={s.wrap}>
        <Text>
          {error || (group.invite ? "Conectando ao grupo…" : "Abrindo agenda…")}
        </Text>
        {group.invite && (
          <Button onPress={() => group.link(null)}>Voltar ao modo local</Button>
        )}
      </SafeAreaView>
    );
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
  async function submit() {
    try {
      const item = saveEvent(draft, event, user);
      const key = await run({ op: "save", id: event?.id, draft });
      if (key) {
        select(item.date);
        setMonth(new Date(item.date + "T12:00:00"));
        open(event?.id ?? key);
      }
    } catch (e) {
      err(e.message);
    }
  }
  const status = (value) => run({ op: "status", id: event.id, value });
  const changeLook = (field, value) => run({ op: "look", field, value });
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
        </View>
      </View>
      <ScrollView
        key={screen}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.wrap}
      >
        {group.invite && !group.connected && (
          <Text>Reconectando ao grupo…</Text>
        )}
        {screen === "Jogos" && (
          <Games state={state} run={run} group={!!group.invite} />
        )}
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
          screen !== "Jogos" && (
            <View style={s.spread}>
              <Text style={s.heading}>{screen}</Text>
              <Button onPress={() => navigate("Agenda")}>Agenda</Button>
            </View>
          )
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
              ["title", "Nome do rolé", "Futebol"],
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
                  onPress={() => run({ op: "react", id: event.id, value: v })}
                >
                  {v} ·{" "}
                  {Object.values(event.reactions).filter((x) => x === v).length}
                </Button>
              ))}
            </View>
            <EventExtras
              key={event.id}
              event={event}
              state={state}
              run={run}
              err={err}
            />
            {mayEdit(user, event) && (
              <View style={s.row}>
                <Button onPress={() => edit(event)}>Editar</Button>
                {event.author === user && event.status === statuses[0] && (
                  <Button active onPress={() => status(statuses[1])}>
                    Confirmar rolé
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
              {group.invite
                ? "Entrega nos avisos dos membros conectados ao grupo."
                : "Simulação local · entrega nos avisos dos outros perfis de teste."}
            </Text>
            <Button
              active
              onPress={async () => {
                if (await run({ op: "signal", place })) {
                  navigate("Agenda");
                  err("Batsinal enviado.");
                }
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
            {options("ÓCULOS", "glasses", ["Sem óculos", "Armação", "Escuros"])}
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
            {group.invite ? (
              <Button onPress={() => group.link(null)}>
                Desconectar do grupo
              </Button>
            ) : (
              <>
                <Field
                  name="Convite privado da turma"
                  value={code}
                  onChangeText={setCode}
                  maxLength={512}
                />
                <Button onPress={connect}>Conectar ao grupo</Button>
                <Button onPress={() => navigate("Perfis de teste")}>
                  Trocar perfil de teste
                </Button>
              </>
            )}
          </>
        )}
        {screen === "Perfis de teste" && (
          <View style={s.row}>
            {members.map((name) => (
              <Button
                key={name}
                active={name === user}
                onPress={() => {
                  group.switchUser(name);
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
                    run({ op: "pref", field: v, value: on })
                  }
                />
              </View>
            ))}
            <Text style={s.label}>
              {group.invite
                ? "AVISOS DA TURMA"
                : "AVISOS SIMULADOS NESTE APARELHO"}
            </Text>
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
        {["Agenda", "Jogos", "Avisos", "Perfil"].map((v) => (
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
