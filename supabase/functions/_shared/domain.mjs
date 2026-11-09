export const members =
  "Kcaio|Mateus Lessa|Neto|Nacif|Zé|Tavarinho|Keoma|Coli|Maikon|Moraes|Batata|Luquinhas|Thiago|Feh|Ricardo|Cimino|Dreko|Enzzo|Fred|Asaf|Soninho|JP|Leobinho|Luan|Wilson|Cid|Gabri|Piauí".split(
    "|",
  );
export const statuses = [
  "Sugestão",
  "Confirmado",
  "Cancelado",
  "Cancelado pela patroa",
];
export const notices = [
  "Nova publicação",
  "Sugestão confirmada",
  "Mudança de dia ou horário",
  "Cancelamento",
  "Batsinal",
];
export const defaultLook = {
  hair: 0,
  skin: 0,
  shirt: 0,
  hat: 0,
  speaker: false,
};
export const pad = (n) => String(n).padStart(2, "0");
export const dateKey = (d) =>
  [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-");
export const displayDate = (key) => key.split("-").reverse().join("/");
export function parseBirthday(value) {
  const m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(
    typeof value === "string" ? value.trim() : "",
  );
  if (!m) return null;
  const [d, mo] = [Number(m[1]), Number(m[2])],
    y = m[3] ? Number(m[3]) : 2000;
  const date = new Date(y, mo - 1, d);
  if (date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  if (m[3] && (y < 1900 || date > new Date())) return null;
  return pad(mo) + "-" + pad(d);
}
export function parseDate(value) {
  const [d, m, y] = value.split("/").map(Number);
  const date = new Date(y, m - 1, d);
  return displayDate(dateKey(date)) === value ? dateKey(date) : null;
}
export function saveEvent(draft, old, user) {
  const date = parseDate(draft.day);
  if (
    !date ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time) ||
    !draft.title.trim()
  )
    throw new Error(
      "Informe nome, data válida (DD/MM/AAAA) e horário (HH:MM).",
    );
  const moved = old && (old.date !== date || old.time !== draft.time);
  return {
    ...old,
    id: old?.id ?? String(Date.now()),
    author: old?.author ?? user,
    date,
    time: draft.time,
    title: draft.title.trim(),
    location: draft.location.trim(),
    description: draft.description.trim(),
    status: old?.status ?? draft.status,
    reactions: moved ? {} : (old?.reactions ?? {}),
  };
}
export function seed() {
  return {
    user: "Kcaio",
    looks: {},
    prefs: {},
    inbox: {},
    events: [],
    rooms: [],
    birthdays: {},
  };
}
export function migrate(state) {
  const demoIds = ["demo1", "demo2", "demo3"];
  return {
    ...seed(),
    ...state,
    events: state.events.filter((e) => !demoIds.includes(e.id)),
  };
}
export const mayEdit = (user, event) =>
  event.author === user || members.slice(0, 2).includes(user);
export function deliver(state, type, message) {
  const inbox = { ...state.inbox };
  for (const member of members) {
    if (member !== state.user && state.prefs[member]?.[type] !== false)
      inbox[member] = [...(inbox[member] ?? []), message].slice(-20);
  }
  return { ...state, inbox };
}
