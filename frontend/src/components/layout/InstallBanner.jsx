import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, Share2, Smartphone, X } from "lucide-react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

const DISMISS_KEY = "pwa-install-banner-dismissed";
const DISMISS_TS_KEY = "pwa-install-banner-dismissed-at";
const REMIND_DAYS = 7;

export default function InstallBanner() {
  const location = useLocation();
  const { t } = useTranslation();
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const dismissedAt = localStorage.getItem(DISMISS_TS_KEY);
      if (!dismissedAt) return localStorage.getItem(DISMISS_KEY) === "true";
      const diffDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      return diffDays < REMIND_DAYS;
    } catch {
      return false;
    }
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const onPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const media = window.matchMedia?.("(display-mode: standalone)");
    const onDisplayChange = () => {
      if (media?.matches) setInstalled(true);
    };
    media?.addEventListener?.("change", onDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media?.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  useEffect(() => {
    if (installed || dismissed || location.pathname !== "/") {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [installed, dismissed, location.pathname]);

  useEffect(() => {
    if (!helpOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen]);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
      localStorage.setItem(DISMISS_TS_KEY, Date.now().toString());
    } catch {
      /* ignore */
    }
  };

  if (installed || dismissed || location.pathname !== "/" || !visible) return null;

  const handleClick = async () => {
    if (!promptEvent) {
      setHelpOpen(true);
      return;
    }
    try {
      promptEvent.prompt();
      await promptEvent.userChoice;
    } finally {
      setPromptEvent(null);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 w-full animate-[fadeIn_0.4s_ease-in-out]">
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white shadow-lg dark:from-teal-800 dark:via-teal-700 dark:to-emerald-700">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  {t("install.title")}
                </p>
                <p className="text-xs text-white/80">
                  {t("install.desc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleClick}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-white/90 dark:text-teal-800"
              >
                <Download className="h-4 w-4" />
                {t("install.install")}
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label={t("install.hideAria")}
                className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-banner-title"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-700">
              <h2 id="install-banner-title" className="font-semibold text-gray-900 dark:text-slate-100">
                {t("install.modalTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label={t("install.close")}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5 text-sm text-gray-600 dark:text-slate-400">
              {isIos ? (
                <>
                  <p className="flex items-center gap-2 font-medium text-gray-800 dark:text-slate-200">
                    <Share2 className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                    {t("install.iosTitle")}
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-5">
                    <li>{t("install.ios1")}</li>
                    <li>{t("install.ios2")}</li>
                    <li>{t("install.ios3")}</li>
                    <li>{t("install.ios4")}</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 font-medium text-gray-800 dark:text-slate-200">
                    <Smartphone className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                    {t("install.browserTitle")}
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-5">
                    <li>{t("install.browser1")}</li>
                    <li>{t("install.browser2")}</li>
                    <li>{t("install.browser3")}</li>
                  </ol>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {t("install.desktopNote")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
