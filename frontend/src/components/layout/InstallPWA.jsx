import { useEffect, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPWA({ className = "" }) {
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
        Installer l'application
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
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 id="install-pwa-title" className="font-semibold text-gray-900">
                Installer l'application
              </h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5 text-sm text-gray-600">
              {isIos ? (
                <>
                  <p className="flex items-center gap-2 font-medium text-gray-800">
                    <Share2 className="h-4 w-4 text-teal-700" />
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
                  <p className="flex items-center gap-2 font-medium text-gray-800">
                    <Smartphone className="h-4 w-4 text-teal-700" />
                    Depuis ton navigateur
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-5">
                    <li>Ouvre le menu du navigateur (les trois points).</li>
                    <li>Choisis « Installer l'application » ou « Ajouter à l'écran d'accueil ».</li>
                    <li>Confirme l'installation.</li>
                  </ol>
                  <p className="text-xs text-gray-500">
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
