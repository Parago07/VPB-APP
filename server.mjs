import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { WebSocketServer, WebSocket } from "ws";
import { members, seed } from "./supabase/functions/_shared/domain.mjs";
import { applyAction } from "./supabase/functions/_shared/features.mjs";
const db = new DatabaseSync(process.env.VPB_DB ?? "vpb.sqlite");
db.exec(
  "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS group_state(id INTEGER PRIMARY KEY, data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS invites(digest TEXT PRIMARY KEY,member TEXT UNIQUE); CREATE TABLE IF NOT EXISTS applied(member TEXT,key TEXT,PRIMARY KEY(member,key))",
);
const digest = (s) => createHash("sha256").update(s).digest("hex");
if (process.argv[2] === "invite") {
  const member = process.argv[3],
    base = process.env.VPB_PUBLIC_URL;
  if (!members.includes(member) || !base)
    throw Error("Defina VPB_PUBLIC_URL e informe um membro da turma.");
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT OR REPLACE INTO invites VALUES(?,?)").run(
    digest(token),
    member,
  );
  console.log(base.replace(/\/$/, "") + "#" + token);
  process.exit(0);
}
let state = JSON.parse(
  db.prepare("SELECT data FROM group_state WHERE id=1").get()?.data ??
    JSON.stringify(seed()),
);
const save = db.prepare("INSERT OR REPLACE INTO group_state VALUES(1,?)");
const root = resolve("dist");
const http = createServer(async (req, res) => {
  if (req.url === "/health") {
    res.end("VPB OK");
    return;
  }
  try {
    const name = new URL(req.url, "http://localhost").pathname;
    if (name !== "/" && !name.startsWith("/_expo/static/js/web/"))
      throw Error();
    const file = resolve(root, "." + (name === "/" ? "/index.html" : name));
    if (!file.startsWith(root + sep) || !(await stat(file)).isFile())
      throw Error();
    res.writeHead(200, {
      "Content-Type":
        extname(file) === ".js"
          ? "application/javascript"
          : "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
    });
    createReadStream(file)
      .on("error", () => res.destroy())
      .pipe(res);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
const ws = new WebSocketServer({ server: http, maxPayload: 8192 });
function send(sock, data) {
  if (sock.readyState === WebSocket.OPEN) sock.send(JSON.stringify(data));
}
function snapshot(sock) {
  const u = sock.member;
  send(sock, {
    state: {
      ...state,
      user: u,
      prefs: { [u]: state.prefs[u] ?? {} },
      inbox: { [u]: state.inbox[u] ?? [] },
      rooms: state.rooms.map((r) => ({
        ...r,
        boards: { [u]: r.boards[u] },
        answers: Object.fromEntries(
          Object.keys(r.answers).map((n) => [n, true]),
        ),
      })),
    },
  });
}
function broadcast() {
  for (const s of ws.clients)
    if (s.member) {
      if (db.prepare("SELECT 1 FROM invites WHERE digest=?").get(s.digest))
        snapshot(s);
      else s.close(1008, "Convite substituído");
    }
}
ws.on("connection", (sock) => {
  const authTimer = setTimeout(() => {
    if (!sock.member) sock.close(1008, "Convite necessário");
  }, 5000);
  sock.on("error", () => sock.terminate());
  sock.on("close", () => clearTimeout(authTimer));
  sock.on("message", (raw) => {
    let a;
    try {
      a = JSON.parse(raw);
      if (!sock.member) {
        const hit = db
          .prepare("SELECT member FROM invites WHERE digest=?")
          .get(digest(String(a.invite)));
        if (!hit) {
          sock.close(1008, "Convite inválido");
          return;
        }
        sock.member = hit.member;
        sock.digest = digest(a.invite);
        clearTimeout(authTimer);
        snapshot(sock);
        return;
      }
      if (
        !db.prepare("SELECT 1 FROM invites WHERE digest=?").get(sock.digest)
      ) {
        sock.close(1008, "Convite substituído");
        return;
      }
      if (typeof a.key !== "string" || !/^[-a-zA-Z0-9]{12,100}$/.test(a.key))
        throw Error("Ação inválida.");
      if (
        !db
          .prepare("SELECT 1 FROM applied WHERE member=? AND key=?")
          .get(sock.member, a.key)
      ) {
        const next = applyAction(state, sock.member, a);
        db.exec("BEGIN IMMEDIATE");
        try {
          db.prepare("INSERT INTO applied VALUES(?,?)").run(sock.member, a.key);
          save.run(JSON.stringify(next));
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
        state = next;
        broadcast();
      }
      send(sock, { ack: a.key });
    } catch (e) {
      send(sock, { error: e.message, key: a?.key });
    }
  });
});
setInterval(() => {
  let next = state;
  for (const r of state.rooms)
    if (r.kind === "Quiz" && r.stage === "Jogando" && Date.now() >= r.deadline)
      next = applyAction(next, r.host, {
        op: "room.play",
        id: r.id,
        play: { op: "next", round: r.round },
      });
  if (next !== state) {
    save.run(JSON.stringify(next));
    state = next;
    broadcast();
  }
}, 500).unref();
http.listen(
  Number(process.env.PORT ?? 8787),
  process.env.HOST ?? "0.0.0.0",
  () => console.log("Servidor VPB pronto."),
);
