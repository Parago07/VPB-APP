import {
  members,
  statuses,
  notices,
  saveEvent,
  mayEdit,
  deliver,
  defaultLook,
  parseBirthday,
} from "./domain.mjs";
import { createRoom, play } from "./games.mjs";
const fail = (message) => {
  throw Error(message);
};
function clean(value, limit = 160) {
  if (typeof value !== "string" || !value.trim() || value.length > limit)
    fail("Preencha o campo com um texto válido.");
  return value.trim();
}
export function amount(text) {
  if (!/^\d{1,8}([,.]\d{1,2})?$/.test(text.trim()))
    fail("Informe um valor em reais, como 39,90.");
  const [whole, frac = ""] = text.trim().split(/[,.]/);
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!cents) fail("O valor deve ser positivo.");
  return cents;
}
export const brl = (c) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function balances(expenses, payments = []) {
  const b = {};
  function add(u, n) {
    b[u] = (b[u] ?? 0) + n;
  }
  for (const e of expenses) {
    add(e.payer, e.cents);
    e.people.forEach((u, i) =>
      add(
        u,
        -Math.floor(e.cents / e.people.length) -
          Number(i < e.cents % e.people.length),
      ),
    );
  }
  for (const p of payments) {
    add(p.from, p.cents);
    add(p.to, -p.cents);
  }
  return b;
}
export function transfers(expenses, payments = []) {
  const entries = Object.entries(balances(expenses, payments)),
    debt = entries.filter(([, v]) => v < 0),
    credit = entries.filter(([, v]) => v > 0),
    out = [];
  let i = 0,
    j = 0;
  while (i < debt.length && j < credit.length) {
    const n = Math.min(-debt[i][1], credit[j][1]);
    out.push([debt[i][0], credit[j][0], n]);
    debt[i][1] += n;
    credit[j][1] -= n;
    if (!debt[i][1]) i++;
    if (!credit[j][1]) j++;
  }
  return out;
}
export function calendarUrl(e) {
  const start = new Date(e.date + "T" + e.time + ":00-03:00");
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return (
    "https://calendar.google.com/calendar/render?" +
    Object.entries({
      action: "TEMPLATE",
      text: e.title,
      details: e.description,
      location: e.location,
      ctz: "America/Sao_Paulo",
      dates: fmt(start) + "/" + fmt(new Date(+start + 3600000)),
    })
      .map(([k, v]) => k + "=" + encodeURIComponent(v ?? ""))
      .join("&")
  );
}
export function applyAction(state, user, a) {
  if (!members.includes(user)) fail("Perfil inválido.");
  const { op, id } = a,
    e = state.events.find((x) => x.id === id);
  function replace(item, type, message) {
    const next = {
      ...state,
      events: e
        ? state.events.map((x) => (x.id === id ? item : x))
        : [...state.events, item],
    };
    return type
      ? { ...next, inbox: deliver({ ...next, user }, type, message).inbox }
      : next;
  }
  if (op === "room.new")
    return {
      ...state,
      rooms: [...state.rooms, createRoom(a.kind, user, a.key)],
    };
  if (op === "room.play") {
    if (!state.rooms.some((r) => r.id === id)) fail("Sala indisponível.");
    return {
      ...state,
      rooms: state.rooms.map((r) => (r.id === id ? play(r, user, a.play) : r)),
    };
  }
  if (op === "look") {
    const options = {
      hair: 3,
      skin: 4,
      shirt: 4,
      glasses: 3,
      hat: 3,
      speaker: 2,
    };
    if (!Object.hasOwn(options, a.field)) fail("Opção inválida.");
    if (
      a.field === "speaker"
        ? typeof a.value !== "boolean"
        : !Number.isInteger(a.value) ||
          a.value < 0 ||
          a.value >= options[a.field]
    )
      fail("Opção inválida.");
    if (
      ["hat", "speaker"].includes(a.field) &&
      state.events.filter((x) => x.author === user).length < 3
    )
      fail("Publique três rolés para desbloquear.");
    return {
      ...state,
      looks: {
        ...state.looks,
        [user]: { ...defaultLook, ...state.looks[user], [a.field]: a.value },
      },
    };
  }
  if (op === "birthday") {
    const value = parseBirthday(a.value);
    if (!value) fail("Informe o aniversário como DD/MM, por exemplo 12/03.");
    return {
      ...state,
      birthdays: { ...state.birthdays, [user]: value },
    };
  }
  if (op === "pref" && notices.includes(a.field))
    return {
      ...state,
      prefs: {
        ...state.prefs,
        [user]: { ...state.prefs[user], [a.field]: Boolean(a.value) },
      },
    };
  if (op === "signal")
    return {
      ...state,
      inbox: deliver(
        { ...state, user },
        "Batsinal",
        user + " enviou um batsinal: '" + clean(a.place) + "'",
      ).inbox,
    };
  if (op === "save") {
    if (id && !e) fail("Evento indisponível.");
    if (e && !mayEdit(user, e)) fail("Apenas autor ou administrador.");
    const d = a.draft;
    clean(d.title);
    if (!e && !statuses.slice(0, 2).includes(d.status))
      fail("Status inválido.");
    const item = saveEvent(d, e, user);
    if (!e) item.id = a.key;
    const type = !e
      ? notices[0]
      : e.date !== item.date || e.time !== item.time
        ? notices[2]
        : null;
    return replace(item, type, type + " · " + item.title);
  }
  if (!e) fail("Evento indisponível.");
  if (op === "react" && ["Aprovo", "Neutro", "Reprovo"].includes(a.value))
    return replace({ ...e, reactions: { ...e.reactions, [user]: a.value } });
  if (op === "status") {
    const confirm = a.value === statuses[1];
    if (
      !mayEdit(user, e) ||
      statuses.indexOf(e.status) > 1 ||
      (confirm
        ? e.author !== user || e.status !== statuses[0]
        : !statuses.slice(2).includes(a.value))
    )
      fail("Alteração de status indisponível.");
    return replace(
      { ...e, status: a.value },
      confirm ? notices[1] : notices[3],
      a.value + " · " + e.title,
    );
  }
  const items = e.items ?? [],
    expenses = e.expenses ?? [],
    attendees = e.attendees ?? [];
  if (op === "attend")
    return replace({
      ...e,
      attendees: a.value
        ? [...new Set([...attendees, user])]
        : attendees.filter((n) => n !== user),
    });
  if (op === "item")
    return replace({
      ...e,
      items: [
        ...items,
        { id: a.key, name: clean(a.name), owner: a.mine ? user : null },
      ],
    });
  if (op === "claim" || op === "removeItem") {
    const item = items.find((x) => x.id === a.item);
    if (!item) fail("Item indisponível.");
    if (item.owner && item.owner !== user)
      fail("Esse item já tem responsável.");
    if (op === "removeItem" && !item.owner && !mayEdit(user, e))
      fail("Somente a organização pode remover um item em aberto.");
    return replace({
      ...e,
      items:
        op === "removeItem"
          ? items.filter((x) => x !== item)
          : items.map((x) =>
              x === item ? { ...x, owner: a.take ? user : null } : x,
            ),
    });
  }
  if (op === "expense") {
    const people = [...new Set(a.people)].sort();
    if (
      !attendees.includes(user) ||
      !people.length ||
      people.some((n) => !attendees.includes(n))
    )
      fail("Selecione os participantes presentes.");
    return replace({
      ...e,
      expenses: [
        ...expenses,
        {
          id: a.key,
          title: clean(a.title),
          cents: amount(a.amount),
          payer: user,
          people,
        },
      ],
    });
  }
  if (op === "settle") {
    const transfer = transfers(expenses, e.payments).find(
      ([from, to, c]) => from === user && to === a.to && c === a.cents,
    );
    if (!transfer) fail("O saldo mudou. Confira o valor atualizado.");
    return replace({
      ...e,
      payments: [
        ...(e.payments ?? []),
        { id: a.key, from: user, to: a.to, cents: a.cents },
      ],
    });
  }
  if (op === "removeExpense") {
    if (!expenses.some((x) => x.id === a.expense && x.payer === user))
      fail("Somente quem registrou pode excluir.");
    return replace({
      ...e,
      expenses: expenses.filter((x) => x.id !== a.expense),
    });
  }
  throw Error("Ação desconhecida.");
}
