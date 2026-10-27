import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setVisible(true);
    }
    const reopen = () => setVisible(true);
    window.addEventListener("open-cookie-consent", reopen);
    return () => window.removeEventListener("open-cookie-consent", reopen);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const refuse = () => {
    localStorage.setItem("cookie_consent", "refused");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="text-sm text-gray-700 leading-relaxed">
          <p>
            Nous utilisons des cookies pour mesurer l'audience et améliorer ce contenu éducatif gratuit. Vous gardez le contrôle, et pouvez changer d'avis à tout moment.{" "}
            <Link to="/mentions-legales" className="text-teal-700 hover:underline font-medium">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refuse}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-sm"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
