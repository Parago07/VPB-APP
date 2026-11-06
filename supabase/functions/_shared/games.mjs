import { Chess } from "chess.js";
export const games = ["Quiz", "Xadrez", "Sudoku"];
export const questions = [
  [
    "Qual planeta tem a Grande Mancha Vermelha?",
    ["Marte", "Júpiter", "Vênus"],
    1,
  ],
  ["Quantas casas há no tabuleiro de xadrez?", ["64", "72", "81"], 0],
  [
    "Quem criou o personagem Mario?",
    ["Hideo Kojima", "Hayao Miyazaki", "Shigeru Miyamoto"],
    2,
  ],
  ["Qual é o maior oceano?", ["Atlântico", "Pacífico", "Índico"], 1],
  [
    "Qual instrumento mede a pressão atmosférica?",
    ["Barômetro", "Anemômetro", "Higrômetro"],
    0,
  ],
  [
    "Qual peça de xadrez pode saltar sobre outras?",
    ["Bispo", "Torre", "Cavalo"],
    2,
  ],
];
const puzzle =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const solution =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
function digits(str, offset) {
  return str.replace(/[1-9]/g, (n) =>
    String(1 + ((Number(n) - 1 + offset) % 9)),
  );
}
export function createRoom(kind, user, id) {
  if (!games.includes(kind)) throw Error("Escolha um jogo.");
  const offset = Math.floor(Math.random() * 9);
  return {
    id,
    kind,
    host: user,
    players: [user],
    stage: "Espera",
    offset,
    round: 0,
    scores: {},
    answers: {},
    moves: [],
    boards: {},
    clues: digits(puzzle, offset),
    first: Math.floor(Math.random() * questions.length),
  };
}
export function question(room) {
  return questions[(room.first + room.round) % questions.length];
}
export function chessBoard(room) {
  const board = new Chess();
  for (const move of room.moves) board.move(move);
  return board;
}
export function play(room, user, action, now = Date.now()) {
  const r = { ...room },
    { op } = action;
  if (op === "join") {
    if (r.players.includes(user)) return r;
    if (r.stage !== "Espera" || (r.kind === "Xadrez" && r.players.length >= 2))
      throw Error("Sala fechada para entrada.");
    return { ...r, players: [...r.players, user] };
  }
  if (!r.players.includes(user)) throw Error("Entre na sala primeiro.");
  if (op === "start") {
    if (r.host !== user || r.stage !== "Espera" || r.players.length < 2)
      throw Error("Aguarde pelo menos dois jogadores e o anfitrião.");
    return { ...r, stage: "Jogando", deadline: now + 30000 };
  }
  if (r.stage !== "Jogando") throw Error("A partida não está em andamento.");
  if (r.kind === "Quiz") {
    if (action.round !== r.round) throw Error("Essa rodada já terminou.");
    if (op === "answer") {
      if (
        now >= r.deadline ||
        user in r.answers ||
        ![0, 1, 2].includes(action.choice)
      )
        throw Error("Resposta fora do prazo ou já registrada.");
      r.answers = { ...r.answers, [user]: action.choice };
      r.scores = {
        ...r.scores,
        [user]:
          (r.scores[user] ?? 0) + Number(action.choice === question(r)[2]),
      };
    } else if (op !== "next" || now < r.deadline)
      throw Error("A rodada ainda está aberta.");
    if (
      Object.keys(r.answers).length === r.players.length ||
      now >= r.deadline
    ) {
      if (r.round === questions.length - 1) return { ...r, stage: "Encerrada" };
      return { ...r, round: r.round + 1, answers: {}, deadline: now + 30000 };
    }
    return r;
  }
  if (r.kind === "Xadrez" && op === "move") {
    const b = chessBoard(r);
    if (r.players[b.turn() === "w" ? 0 : 1] !== user)
      throw Error("Aguarde sua vez.");
    let move;
    try {
      move = b.move({
        from: action.from,
        to: action.to,
        promotion: action.promotion ?? "q",
      });
    } catch {
      throw Error("Movimento inválido.");
    }
    return {
      ...r,
      moves: [...r.moves, move.san],
      stage: b.isGameOver() ? "Encerrada" : r.stage,
      result: b.isCheckmate() ? user : b.isDraw() ? "Empate" : null,
    };
  }
  if (r.kind === "Sudoku" && op === "digit") {
    const { index, value } = action;
    if (
      !Number.isInteger(index) ||
      r.clues[index] !== "0" ||
      !/^[0-9]$/.test(value)
    )
      throw Error("Escolha uma casa vazia e um dígito.");
    const grid = (r.boards[user] ?? r.clues).split("");
    grid[index] = String(value);
    const board = grid.join(""),
      won = board === digits(solution, r.offset);
    return {
      ...r,
      boards: { ...r.boards, [user]: board },
      stage: won ? "Encerrada" : r.stage,
      result: won ? user : null,
    };
  }
  throw Error("Jogada inválida.");
}
