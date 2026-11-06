import { RealtimeClient } from "@supabase/realtime-js";
export const projectURL = "https://nxskxdjedahmdszgtarf.supabase.co";
const publicKey = "sb_publishable_Lxqupa9pt_Y615GHhZu5Sg_8QrWTkgy";
export function cloudConnection(token, onState, onStatus, onError) {
  let active = true,
    revision = -1,
    channel,
    client,
    timer,
    inFlight = false,
    dirty = false;
  async function request(action) {
    const res = await fetch(projectURL + "/functions/v1/vpb-group", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: publicKey,
        "x-vpb-invite": token,
      },
      body: JSON.stringify({ action }),
    });
    const msg = await res.json();
    if (!res.ok) {
      if (res.status === 403) {
        onStatus(false);
        onError("Convite inválido ou substituído.");
      }
      throw Error(msg.error ?? "Erro ao acessar a agenda.");
    }
    if (!active) return;
    if (msg.revision >= revision) {
      revision = msg.revision;
      onState(msg.state);
    }
    onStatus(true);
    if (!client) {
      client = new RealtimeClient(
        projectURL.replace("https:", "wss:") + "/realtime/v1",
        { params: { apikey: publicKey } },
      );
      channel = client.channel(msg.topic);
      channel
        .on("broadcast", { event: "refresh" }, () => refresh())
        .subscribe((status) => {
          if (status === "SUBSCRIBED") refresh();
        });
    }
  }
  async function refresh() {
    if (inFlight) {
      dirty = true;
      return;
    }
    inFlight = true;
    try {
      await request();
    } catch (e) {
      if (active) {
        onStatus(false);
        onError(e.message);
      }
    } finally {
      inFlight = false;
      if (dirty && active) {
        dirty = false;
        refresh();
      }
    }
  }
  refresh();
  timer = setInterval(refresh, 30000);
  return {
    act: async (a) => {
      await request(a);
      return a.key;
    },
    close() {
      active = false;
      clearInterval(timer);
      client?.disconnect();
    },
  };
}
