import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "./i18n";
import { AuthProvider } from "./context/AuthContext.jsx";
import { QuickPreviewProvider } from "./context/QuickPreviewContext.jsx";
import { SiteSettingsProvider } from "./context/SiteSettingsContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteSettingsProvider>
        <ThemeProvider>
          <AuthProvider>
            <QuickPreviewProvider>
              <App />
            </QuickPreviewProvider>
          </AuthProvider>
        </ThemeProvider>
      </SiteSettingsProvider>
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
