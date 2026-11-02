import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ExternalLink, FileText, Lock, X } from "lucide-react";
import { fetchDocumentViewBlob } from "../../api/documents";
import { useAuth } from "../../context/AuthContext";
import { formatCategoryName, getCategoryColor } from "../../utils/document";
import { formatDate, formatSize } from "../../utils/format";

function PreviewContent({ mimeType, url }) {
  if (mimeType === "application/pdf") {
    return <iframe src={`${url}#toolbar=0&navpanes=0`} title="Aperçu du document" className="h-full w-full" />;
  }
  if (mimeType?.startsWith("image/")) {
    return <img src={url} alt="Aperçu du document" className="h-full w-full object-contain" />;
  }
  if (mimeType?.startsWith("video/")) {
    return <video src={url} controls className="h-full w-full object-contain" />;
  }
  if (mimeType?.startsWith("audio/")) {
    return <audio src={url} controls className="w-full" />;
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-gray-500 dark:text-slate-400">
      <FileText className="h-10 w-10" />
      <p>Ce format ne peut pas être prévisualisé en ligne.</p>
    </div>
  );
}

export default function QuickPreviewModal({ doc, onClose }) {
  const { user } = useAuth();
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const canPreview = Boolean(user?.email_verified);

  useEffect(() => {
    if (!canPreview) return;
    let active = true;
    let url = null;
    setLoading(true);
    setError(false);
    fetchDocumentViewBlob(doc.id)
      .then((response) => {
        if (!active) return;
        url = URL.createObjectURL(response.data);
        setBlobUrl(url);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc.id, canPreview]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu rapide de ${doc.title}`}
    >
      <button
        type="button"
        aria-label="Fermer l'aperçu"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-slate-900">
        <header className="flex items-start gap-3 border-b border-gray-100 px-4 py-3 dark:border-slate-700 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white ${getCategoryColor(doc.category)}`}>
                {doc.category ? formatCategoryName(doc.category) : "Document"}
              </span>
              {doc.visibility === "private" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/80 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  <Lock className="h-3 w-3" />
                  Privé
                </span>
              )}
            </div>
            <h2 className="truncate text-base font-semibold text-gray-900 dark:text-slate-100 sm:text-lg">{doc.title}</h2>
            <p className="truncate text-xs text-gray-500 dark:text-slate-400">
              {doc.author_name}
              {doc.size_bytes ? ` · ${formatSize(doc.size_bytes)}` : ""}
              {doc.created_at ? ` · ${formatDate(doc.created_at)}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative min-h-[240px] flex-1 overflow-hidden bg-gray-50 dark:bg-slate-950">
          {canPreview ? (
            loading ? (
              <div className="flex h-full min-h-[240px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 px-6 text-center">
                <FileText className="h-10 w-10 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  L’aperçu n’est pas disponible pour le moment.
                </p>
              </div>
            ) : blobUrl ? (
              <div className="h-[58vh] max-h-[640px]">
                <PreviewContent mimeType={doc.mime_type} url={blobUrl} />
              </div>
            ) : null
          ) : (
            <div className="relative h-[46vh] max-h-[520px] min-h-[220px]">
              {doc.thumbnail ? (
                <img src={doc.thumbnail} alt={doc.title} className="h-full w-full object-cover object-top" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900">
                  <FileText className="h-12 w-12 text-white/70" />
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 px-6 text-center backdrop-blur-sm">
                <Lock className="h-8 w-8 text-white/80" />
                <p className="max-w-sm text-sm text-white/90">
                  {user
                    ? "Vérifiez votre adresse e-mail pour consulter l’aperçu en ligne."
                    : "Connectez-vous avec un e-mail vérifié pour consulter l’aperçu en ligne."}
                </p>
                <Link
                  to={user ? "/verify-email" : "/login"}
                  onClick={onClose}
                  className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                >
                  {user ? "Vérifier mon e-mail" : "Se connecter"}
                </Link>
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 dark:border-slate-700 sm:px-5">
          <p className="truncate text-xs text-gray-500 dark:text-slate-400">
            {doc.description || "Aucune description fournie."}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/documents/${doc.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4" />
              Fiche complète
            </Link>
            {canPreview && (
              <Link
                to={`/documents/${doc.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
              >
                <Download className="h-4 w-4" />
                Ouvrir
              </Link>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
