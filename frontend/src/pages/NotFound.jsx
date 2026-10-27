import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
          <FileQuestion className="h-8 w-8 text-teal-700" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Erreur 404</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Page introuvable</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-600 sm:text-base">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800">
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
