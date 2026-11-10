import { createContext, useCallback, useContext, useEffect, useState } from "react";
import client from "../api/client";
import { useLiveVersion } from "./LiveUpdatesContext";

const DEFAULTS = {
  siteName: "Archives",
  siteTagline: "Plateforme de documents",
  contactEmail: "",
  creditsParUpload: 2,
  maxUploadSizeMb: 10,
  allowRegistrations: true,
  publicBrowsing: true,
  creditPacks: [],
  tMoneyNumber: "",
  moovNumber: "",
  beneficiaryName: ""
};

const SiteSettingsContext = createContext({ ...DEFAULTS, refreshSettings: async () => {} });

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const settingsVersion = useLiveVersion("settings");

  const refreshSettings = useCallback(async () => {
    try {
      const res = await client.get("/settings");
      setSettings((prev) => ({ ...prev, ...res.data }));
    } catch {
      // garde les valeurs par défaut si l'API est indisponible
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings, settingsVersion]);

  useEffect(() => {
    const baseTitle = settings.siteName === "Archives" ? "Archives de Documents" : settings.siteName;
    if (!baseTitle) return;
    const current = document.title;
    const isBaseTitle = !current || current === "Archives" ||
      current === "Archives de Documents" ||
      current === "Archives de Documents — Partage et archivage collaboratif";
    if (isBaseTitle) document.title = baseTitle;
  }, [settings.siteName]);

  return (
    <SiteSettingsContext.Provider value={{ ...settings, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
