import { roomView } from "./supabase/functions/_shared/impostor.mjs";
import { useEffect, useRef, useState } from "react";
import Storage from "@react-native-async-storage/async-storage";
import { cloudConnection, projectURL } from "./cloud";
import { migrate, seed } from "./supabase/functions/_shared/domain.mjs";
import { applyAction, visiblePixKeys } from "./supabase/functions/_shared/features.mjs";
const localKey = "vpb:prototype:v1",
  inviteKey = "vpb:connection:v1";
export function useGroup(err) {
  const [local, setLocal] = useState(null),
    [invite, setInvite] = useState(null),
    [remote, setRemote] = useState(null),
    [connected, online] = useState(false);
  const current = useRef(null),
    socket = useRef(null),
    cloud = useRef(null),
    pending = useRef(new Map()),
    writes = useRef(Promise.resolve());
  useEffect(() => {
    Promise.all([Storage.getItem(localKey), Storage.getItem(inviteKey)])
      .then(async ([raw, link]) => {
        if (
          typeof window !== "undefined" &&
          /^#[a-f0-9]{64}$/.test(window.location?.hash ?? "")
        ) {
          link =
            window.location.origin.replace(/^http/, "ws") +
            window.location.hash;
          await Storage.setItem(inviteKey, link);
          window.history.replaceState(null, "", window.location.pathname);
        }
        current.current = raw ? migrate(JSON.parse(raw)) : seed();
        setLocal(current.current);
        setInvite(link);
      })
      .catch(() => err("Falha ao carregar este aparelho."));
  }, []);
  useEffect(() => {
    if (local)
      writes.current = writes.current
        .then(() => Storage.setItem(localKey, JSON.stringify(local)))
        .catch(() => err("Falha ao salvar neste aparelho."));
  }, [local]);
  useEffect(() => {
    if (!invite) return;
    if (invite.startsWith(projectURL + "#")) {
      const connection = cloudConnection(
        invite.split("#")[1],
        setRemote,
        online,
        err,
      );
      cloud.current = connection;
      return () => {
        cloud.current = null;
        connection.close();
        setRemote(null);
        online(false);
      };
    }
    let active = true,
      timer,
      ws;
    const connect = () => {
      const [url, token] = invite.split("#");
      ws = new WebSocket(url);
      socket.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ invite: token }));
      ws.onmessage = ({ data }) => {
        if (!active) return;
        const msg = JSON.parse(data);
        if (msg.state) {
          setRemote(msg.state);
          online(true);
        }
        if (msg.ack || msg.key) {
          const key = msg.ack ?? msg.key,
            p = pending.current.get(key);
          if (p) {
            pending.current.delete(key);
            msg.error ? p.reject(Error(msg.error)) : p.resolve();
          }
        }
      };
      ws.onerror = () => {};
      ws.onclose = ({ code }) => {
        if (!active) return;
        online(false);
        for (const p of pending.current.values())
          p.reject(
            Error("Conexão interrompida. Confira a lista antes de repetir."),
          );
        pending.current.clear();
        if (code === 1008) err("Convite inválido ou substituído.");
        else timer = setTimeout(connect, 2500);
      };
    };
    connect();
    return () => {
      active = false;
      clearTimeout(timer);
      ws?.close();
      online(false);
      setRemote(null);
      for (const p of pending.current.values())
        p.reject(Error("Conexão encerrada."));
      pending.current.clear();
    };
  }, [invite]);
  async function link(value) {
    if (value) {
      if (/^[a-f0-9]{64}$/.test(value)) value = projectURL + "#" + value;
      if (!value.startsWith(projectURL + "#"))
        value = value.replace(/^http(s?):\/\//, "ws$1://");
      let url;
      try {
        url = new URL(value);
      } catch {
        throw Error("Cole o convite completo.");
      }
      if (
        (!["wss:", "ws:"].includes(url.protocol) &&
          !value.startsWith(projectURL + "#")) ||
        !/^#[a-f0-9]{64}$/.test(url.hash)
      )
        throw Error("Convite inválido.");
      await Storage.setItem(inviteKey, value);
    } else await Storage.removeItem(inviteKey);
    setInvite(value || null);
  }
  function act(a) {
    a = {
      ...a,
      key:
        Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12),
    };
    if (invite) {
      if (cloud.current) return cloud.current.act(a);
      if (!connected || socket.current?.readyState !== 1)
        return Promise.reject(Error("Aguarde a conexão com a turma."));
      return new Promise((resolve, reject) => {
        pending.current.set(a.key, { resolve: () => resolve(a.key), reject });
        socket.current.send(JSON.stringify(a));
      });
    }
    try {
      current.current = applyAction(current.current, current.current.user, a);
      setLocal(current.current);
      return Promise.resolve(a.key);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  function switchUser(user) {
    if (!invite) {
      current.current = { ...current.current, user };
      setLocal(current.current);
    }
  }
  return {
    state: invite
      ? remote
      : local && {
          ...local,
          pixKeys: visiblePixKeys(local, local.user),
          rooms: local.rooms.map((r) => roomView(r, local.user)),
        },
    invite,
    link,
    connected,
    switchUser,
    act,
  };
}
