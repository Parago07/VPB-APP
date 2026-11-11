import { roomView } from "../_shared/impostor.mjs";
import { applyAction, visiblePixKeys } from "../_shared/features.mjs";
const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const headers = {
  authorization: "Bearer " + key,
  apikey: key,
  "content-type": "application/json",
};
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey,content-type,x-vpb-invite",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const response = (status: number, data: unknown) =>
  Response.json(data, { status, headers: cors });
async function rpc(name: string, args: object) {
  const r = await fetch(url + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
  });
  if (!r.ok) throw Error("Falha na operação do banco.");
  return r.json();
}
function visible(s: any, u: string) {
  return {
    ...s,
    pixKeys: visiblePixKeys(s, u),
    user: u,
    prefs: { [u]: s.prefs[u] ?? {} },
    inbox: { [u]: s.inbox[u] ?? [] },
    rooms: s.rooms.map((r: any) => roomView(r, u)),
  };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return response(405, { error: "Use POST." });
  const token = req.headers.get("x-vpb-invite") ?? "";
  if (!/^[a-f0-9]{64}$/.test(token))
    return response(403, { error: "Convite inválido." });
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    ),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
  try {
    const text = await req.text();
    if (text.length > 8192)
      return response(413, { error: "Ação muito grande." });
    const { action } = JSON.parse(text);
    if (action && !/^[-a-zA-Z0-9]{12,100}$/.test(action.key ?? ""))
      return response(400, { error: "Identificador inválido." });
    for (let attempt = 0; attempt < 10; attempt++) {
      const g = await rpc("vpb_read", {
        token_hash: hash,
        action_id: action?.key ?? "",
      });
      if (!g)
        return response(403, { error: "Convite inválido ou substituído." });
      if (!action || g.applied)
        return response(200, {
          revision: g.revision,
          topic: g.topic,
          state: visible(g.data, g.member),
        });
      let data;
      try {
        data = applyAction(g.data, g.member, action);
      } catch (e) {
        return response(400, {
          error: e instanceof Error ? e.message : "Ação inválida.",
        });
      }
      if (
        !(await rpc("vpb_write", {
          token_hash: hash,
          action_id: action.key,
          expected: g.revision,
          new_data: data,
        }))
      )
        continue;
      await fetch(url + "/realtime/v1/api/broadcast", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [
            {
              topic: g.topic,
              event: "refresh",
              payload: { revision: g.revision + 1 },
              private: false,
            },
          ],
        }),
      }).catch(() => {});
      return response(200, {
        revision: g.revision + 1,
        topic: g.topic,
        state: visible(data, g.member),
      });
    }
    return response(409, { error: "A agenda está ocupada. Tente novamente." });
  } catch {
    return response(503, {
      error: "Falha ao acessar o grupo. Tente novamente.",
    });
  }
});
