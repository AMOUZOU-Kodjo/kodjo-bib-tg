import { createContext, useContext, useEffect, useRef, useState } from "react";
import client from "../api/client";

const LiveUpdatesContext = createContext({ connected: false });
const THROTTLE_MS = 300;

function getEventsUrl() {
  const base = String(client.defaults.baseURL || "").replace(/\/+$/, "");
  return base ? `${base}/events` : null;
}

export function LiveUpdatesProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [reconnectKey, setReconnectKey] = useState(0);
  const timersRef = useRef(new Map());

  useEffect(() => {
    const reconnect = () => setReconnectKey((value) => value + 1);
    window.addEventListener("live:reconnect", reconnect);
    return () => window.removeEventListener("live:reconnect", reconnect);
  }, []);

  useEffect(() => {
    const url = getEventsUrl();
    if (!url || typeof window === "undefined" || typeof EventSource === "undefined") return undefined;

    const source = new EventSource(url, { withCredentials: true });
    const timers = timersRef.current;

    const dispatchScope = (scope, detail) => {
      const existing = timers.get(scope);
      if (existing) clearTimeout(existing);
      timers.set(scope, setTimeout(() => {
        timers.delete(scope);
        window.dispatchEvent(new CustomEvent(`live:${scope}`, { detail }));
      }, THROTTLE_MS));
    };

    const onChange = (event) => {
      let payload = {};
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = {};
      }
      dispatchScope(payload.scope || "all", payload);
    };

    source.addEventListener("ready", () => setConnected(true));
    source.addEventListener("change", onChange);
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    return () => {
      source.close();
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      setConnected(false);
    };
  }, [reconnectKey]);

  return (
    <LiveUpdatesContext.Provider value={{ connected }}>
      {children}
    </LiveUpdatesContext.Provider>
  );
}

export function useLiveVersion(scopes = "all") {
  const [version, setVersion] = useState(0);
  const scopeKey = Array.isArray(scopes) ? scopes.join("|") : scopes;

  useEffect(() => {
    const names = (Array.isArray(scopes) ? scopes : [scopes]).map((scope) => `live:${scope}`);
    const handleChange = () => setVersion((value) => value + 1);
    for (const name of names) window.addEventListener(name, handleChange);
    return () => {
      for (const name of names) window.removeEventListener(name, handleChange);
    };
  }, [scopeKey]);

  return version;
}

export function useLiveConnection() {
  return useContext(LiveUpdatesContext).connected;
}
