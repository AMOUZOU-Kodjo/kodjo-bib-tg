import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SiteSettingsProvider } from "./context/SiteSettingsContext.jsx";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteSettingsProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
