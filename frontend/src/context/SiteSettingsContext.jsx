import { createContext, useCallback, useContext, useEffect, useState } from "react";
import client from "../api/client";

const DEFAULTS = {
  siteName: "Archives",
  contactEmail: "",
  creditsParUpload: 2,
  maxUploadSizeMb: 10
};

const SiteSettingsContext = createContext({ ...DEFAULTS, refreshSettings: async () => {} });

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

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
  }, [refreshSettings]);

  useEffect(() => {
    document.title = settings.siteName === "Archives" ? "Archives de Documents" : settings.siteName;
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
