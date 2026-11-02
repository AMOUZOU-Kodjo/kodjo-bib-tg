import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Calendar, Copy, Download, ExternalLink, FileText, Lock, User } from "lucide-react";
import { getSharedDocument, downloadSharedDocument, getSharedFileUrl, getPublicShareUrl } from "../api/share";
import { formatSize, formatDate } from "../utils/format";
import { getCategoryColor, formatCategoryName } from "../utils/document";
import { Spinner } from "../components/ui";

export default function SharedDocument() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);

  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    const referrer = document.createElement("meta");
    referrer.name = "referrer";
    referrer.content = "no-referrer";
    document.head.appendChild(robots);
    document.head.appendChild(referrer);
    return () => {
      robots.remove();
      referrer.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const previousTitle = document.title;
    setLoading(true);
    setError("");
    setFullPreview(false);
    setThumbnailFailed(false);
    getSharedDocument(token)
      .then((res) => {
        if (!active) return;
        setDoc(res.data.document);
        document.title = `${res.data.document.title} - Document partagé`;
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.error?.message || "Lien de partage invalide ou expiré");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      document.title = previousTitle;
    };
  }, [token]);

  const copyLink = async () => {
    try {
      const url = doc?.visibility === "public" ? getPublicShareUrl(doc.id) : window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const res = await downloadSharedDocument(token);
      const link = document.createElement("a");
      link.href = res.data.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Téléchargement lancé");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors du téléchargement");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (error || !doc) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Lien indisponible</h1>
        <p className="text-gray-600 dark:text-slate-400 mb-6">{error || "Ce lien de partage n'est plus valide."}</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-800">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const fileUrl = getSharedFileUrl(token);
  const canPreview = doc.mime_type === "application/pdf" || doc.mime_type?.startsWith("image/");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 text-white px-3 py-1 text-xs font-medium mb-5">
        <Lock className="w-3.5 h-3.5" />
        Document partagé
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
        <aside>
          <div className="mx-auto mb-4 w-full max-w-[240px] overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm sm:max-w-[280px] lg:max-w-none">
            <div className="relative aspect-[3/4] bg-gray-100 dark:bg-slate-800">
              {doc.thumbnail && !thumbnailFailed ? (
                <img
                  src={doc.thumbnail}
                  alt={doc.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                  onError={() => setThumbnailFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-slate-50 dark:from-slate-900 via-white to-teal-50">
                  <FileText className="w-12 h-12 text-teal-700 dark:text-teal-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 line-clamp-4">{doc.title}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-widest text-gray-400">{doc.original_filename?.split(".").pop() || "DOC"}</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={download}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-800 transition-colors mb-3 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {downloading ? "Préparation..." : "Télécharger"}
          </button>
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-900 border border-gray-200 dark:border-slate-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copier le lien
          </button>

          <p className="mt-4 text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            Ce lien donne accès au fichier sans compte. Ne le partagez qu'avec des personnes de confiance.
          </p>
        </aside>

        <main>
          <header className="mb-6">
            <h1 className="mb-3 text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl md:text-3xl lg:text-4xl">{doc.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              {doc.category && (
                <span className={`px-3 py-1 rounded-full text-sm text-white ${getCategoryColor(doc.category)}`}>
                  {formatCategoryName(doc.category)}
                </span>
              )}
            </div>
          </header>

          <section className="mb-6 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-slate-100 sm:text-xl">Informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/40">
                  <User className="w-5 h-5 text-teal-700 dark:text-teal-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Partagé par</p>
                  <p className="font-medium text-gray-900 dark:text-slate-100 break-words">{doc.author_name}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Fichier</p>
                  <p className="font-medium text-gray-900 dark:text-slate-100 break-all">{doc.original_filename}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{formatSize(doc.size_bytes)}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
                  <Calendar className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Ajouté</p>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{formatDate(doc.created_at)}</p>
                </div>
              </div>
            </div>
            {doc.description && (
              <p className="mt-5 text-gray-700 dark:text-slate-300 whitespace-pre-line">{doc.description}</p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 sm:text-xl">Aperçu</h2>
              {canPreview && fullPreview && (
                <button
                  onClick={() => setFullPreview(false)}
                  className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
                >
                  Réduire l’aperçu
                </button>
              )}
            </div>
            {canPreview ? (
              fullPreview ? (
                <iframe
                  src={fileUrl}
                  title={doc.title}
                  referrerPolicy="no-referrer"
                  className="h-[60vh] min-h-[360px] w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 sm:h-[70vh]"
                />
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                  {doc.thumbnail && !thumbnailFailed ? (
                    <img
                      src={doc.thumbnail}
                      alt={doc.title}
                      referrerPolicy="no-referrer"
                      className="h-[60vh] min-h-[360px] w-full object-cover object-top sm:h-[70vh]"
                      onError={() => setThumbnailFailed(true)}
                    />
                  ) : (
                    <div className="flex h-[40vh] min-h-[240px] flex-col items-center justify-center gap-3 px-6 text-center">
                      <FileText className="h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        L’aperçu de la première page n’est pas disponible pour ce format.
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <p className="text-sm text-white/90">Aperçu de la première page</p>
                    <button
                      onClick={() => setFullPreview(true)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Afficher le document
                    </button>
                  </div>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-600 dark:text-slate-400">
                L'aperçu n'est pas disponible pour ce format. Utilisez le bouton de téléchargement.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
