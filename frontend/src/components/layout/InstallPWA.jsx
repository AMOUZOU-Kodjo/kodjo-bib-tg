import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Share2, Smartphone, X } from "lucide-react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPWA({ className = "" }) {
  const { t } = useTranslation();
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
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
    if (!helpOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen]);

  if (installed) return null;

  const handleClick = async () => {
    if (!promptEvent) {
      setHelpOpen(true);
      return;
    }
    promptEvent.prompt();
    try {
      await promptEvent.userChoice;
    } finally {
      setPromptEvent(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        }
      >
        <Download className="h-4 w-4" />
        {t("install.installApp")}
      </button>

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-pwa-title"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 px-5 py-4">
              <h2 id="install-pwa-title" className="font-semibold text-gray-900 dark:text-slate-100">
                {t("install.title")}
              </h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label={t("install.close")}
                className="rounded-lg p-1.5 text-gray-500 dark:text-slate-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300"
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
