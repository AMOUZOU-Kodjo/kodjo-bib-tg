import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">{title}</h2>
      <div className="space-y-2 text-gray-700 dark:text-slate-300 leading-relaxed">{children}</div>
    </section>
  );
}

export default function LegalPage({ title, updatedAt = "25 octobre 2026", children }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400 sm:text-sm">
        <Link to="/" className="hover:text-teal-700 dark:hover:text-teal-300">{t("legal.home")}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-slate-100">{title}</span>
      </nav>

      <header className="mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 mb-4">
          <ShieldCheck className="w-6 h-6 text-teal-700 dark:text-teal-300" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">{t("legal.updatedAt")} : {updatedAt}</p>
      </header>

      <div className="space-y-7 break-words rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
