import { categories, celebrities, football, prompts } from "./pessoas.mjs";
function shuffle(players) {
  const order = [...players];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
function start(r, category = r.category ?? "Misturado") {
  if (!categories.includes(category)) throw Error("Categoria inválida.");
  const choices = [r.players, celebrities, football];
  const pool =
    category === "Misturado"
      ? shuffle(choices)[0]
      : choices[categories.indexOf(category) - 1];
  const person = shuffle(pool.filter((n) => n !== r.last?.person))[0];
  const questions = shuffle(prompts),
    impostor = shuffle(r.players)[0];
  const assigned = Object.fromEntries(
    r.players.map((n, i) => [n, questions[i]]),
  );
  return {
    ...r,
    category,
    stage: "Respostas",
    round: r.round + 1,
    secret: { impostor, person, assigned, responses: {}, votes: {} },
    last: null,
  };
}
function entry(value) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 200)
    throw Error("Escreva entre 1 e 200 caracteres.");
  return value.trim();
}
function once(values, user, value) {
  if (Object.hasOwn(values, user)) throw Error("Você já enviou nesta etapa.");
  return { ...values, [user]: value };
}
export function impostorTurn(r, user, a) {
  if (!r.players.includes(user)) throw Error("Entre na sessão.");
  if (a.op === "start" || a.op === "again") {
    const initial = a.op === "start";
    if (
      r.host !== user ||
      r.players.length < 3 ||
      r.stage !== (initial ? "Espera" : "Resultado") ||
      (!initial && a.round !== r.round)
    )
      throw Error("Rodada indisponível.");
    return start(r, a.category);
  }
  if (
    a.op === "finish" &&
    r.stage === "Resultado" &&
    r.host === user &&
    a.round === r.round
  )
    return { ...r, stage: "Encerrada" };
  if (a.round !== r.round) throw Error("Esta rodada já passou.");
  const s = { ...r.secret };
  if (r.stage === "Respostas" && a.op === "respond") {
    s.responses = once(s.responses, user, entry(a.text));
    return {
      ...r,
      secret: s,
      stage:
        Object.keys(s.responses).length === r.players.length
          ? "Votação"
          : r.stage,
    };
  }
  if (r.stage === "Votação" && a.op === "vote") {
    if (!r.players.includes(a.target) || a.target === user)
      throw Error("Escolha outro jogador da sessão.");
    s.votes = once(s.votes, user, a.target);
    if (Object.keys(s.votes).length < r.players.length)
      return { ...r, secret: s };
    const correct = r.players.filter((n) => s.votes[n] === s.impostor);
    const winners = correct.length ? correct : [s.impostor],
      scores = { ...r.scores };
    for (const n of winners) scores[n] = (scores[n] ?? 0) + 1;
    return {
      ...r,
      secret: null,
      scores,
      stage: "Resultado",
      last: { impostor: s.impostor, person: s.person, winners },
    };
  }
  throw Error("Esta etapa já terminou.");
}
export function roomView(r, user) {
  if (r.kind !== "Impostor")
    return {
      ...r,
      boards: { [user]: r.boards?.[user] },
      answers: Object.fromEntries(
        Object.keys(r.answers ?? {}).map((n) => [n, true]),
      ),
    };
  // Allowlist only. Never serialize the private maps or reveal submissions as they arrive.
  const { id, kind, stage, host, players, round, scores, last } = r;
  const view = { id, kind, stage, host, players, round, scores };
  if (!players.includes(user)) return view;
  if (last) view.last = last;
  const s = r.secret;
  if (!s) return view;
  view.role = s.impostor === user ? "Impostor" : "Turma";
  if (view.role === "Turma") view.person = s.person;
  if (stage === "Respostas") {
    view.prompt = s.assigned[user];
    view.sent = Object.hasOwn(s.responses, user);
  }
  if (stage === "Votação") {
    view.sent = Object.hasOwn(s.votes, user);
    view.ballot = players.map((name) => ({
      name,
      question: s.assigned[name],
      answer: s.responses[name],
    }));
  }
  return view;
}
