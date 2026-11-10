import React, { createContext, useContext, useEffect, useState } from "react";
import { me } from "../api/auth";
import { useLiveVersion } from "./LiveUpdatesContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userVersion = useLiveVersion("user");

  useEffect(() => {
    me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userVersion) return;
    me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, [userVersion]);

  useEffect(() => {
    window.dispatchEvent(new Event("live:reconnect"));
  }, [user?.id]);

  const value = { user, setUser, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
