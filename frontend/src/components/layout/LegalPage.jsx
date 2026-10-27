import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck } from "lucide-react";

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="space-y-2 text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function LegalPage({ title, updatedAt = "25 octobre 2026", children }) {
  return (
    <div className="max-w-3xl mx-auto">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm">
        <Link to="/" className="hover:text-teal-700">Accueil</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">{title}</span>
      </nav>

      <header className="mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 mb-4">
          <ShieldCheck className="w-6 h-6 text-teal-700" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500">Dernière mise à jour : {updatedAt}</p>
      </header>

      <div className="space-y-7 break-words rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
