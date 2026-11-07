import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CookieConsent() {
  const { t } = useTranslation();
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
      <div className="max-w-7xl mx-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
          <p>
            {t("cookies.message")}{" "}
            <Link to="/mentions-legales" className="text-teal-700 dark:text-teal-300 hover:underline font-medium">
              {t("cookies.learnMore")}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refuse}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            {t("cookies.refuse")}
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-sm"
          >
            {t("cookies.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
