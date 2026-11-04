import { useEffect, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

const DISMISS_KEY = "pwa-install-banner-dismissed";

export default function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);

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
    } catch {
      /* ignore */
    }
  };

  if (installed || dismissed) return null;

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
      <div className="sticky top-0 z-40 w-full">
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white shadow-lg dark:from-teal-800 dark:via-teal-700 dark:to-emerald-700">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  Installer Archives de Documents
                </p>
                <p className="text-xs text-white/80">
                  Accès plus rapide, hors-ligne et depuis votre écran d'accueil
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
                Installer
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Masquer cette bannière"
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
                Installer l'application
              </h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Fermer"
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
                    Sur iPhone ou iPad (Safari)
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-5">
                    <li>Ouvre ce site dans Safari.</li>
                    <li>Touche le bouton Partager.</li>
                    <li>Choisis « Sur l'écran d'accueil ».</li>
                    <li>Valide avec « Ajouter ».</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 font-medium text-gray-800 dark:text-slate-200">
                    <Smartphone className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                    Depuis ton navigateur
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-5">
                    <li>Ouvre le menu du navigateur (les trois points).</li>
                    <li>Choisis « Installer l'application » ou « Ajouter à l'écran d'accueil ».</li>
                    <li>Confirme l'installation.</li>
                  </ol>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Sur ordinateur, l'icône d'installation apparaît aussi dans la barre d'adresse.
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
