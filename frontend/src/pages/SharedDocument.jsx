import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Calendar, Copy, Download, FileText, Lock, User } from "lucide-react";
import { getSharedDocument, downloadSharedDocument, getSharedFileUrl } from "../api/share";
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
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const res = await downloadSharedDocument(token);
      window.open(res.data.url, "_blank", "noopener,noreferrer");
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
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Lien indisponible</h1>
        <p className="text-gray-600 mb-6">{error || "Ce lien de partage n'est plus valide."}</p>
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
          <div className="mx-auto mb-4 w-full max-w-[240px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:max-w-[280px] lg:max-w-none">
            <div className="relative aspect-[3/4] bg-gray-100">
              {doc.thumbnail && !thumbnailFailed ? (
                <img
                  src={doc.thumbnail}
                  alt={doc.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                  onError={() => setThumbnailFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-slate-50 via-white to-teal-50">
                  <FileText className="w-12 h-12 text-teal-700 mb-3" />
                  <p className="text-sm font-semibold text-gray-800 line-clamp-4">{doc.title}</p>
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
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copier le lien
          </button>

          <p className="mt-4 text-xs text-gray-500 leading-relaxed">
            Ce lien donne accès au fichier sans compte. Ne le partagez qu'avec des personnes de confiance.
          </p>
        </aside>

        <main>
          <header className="mb-6">
            <h1 className="mb-3 text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">{doc.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              {doc.category && (
                <span className={`px-3 py-1 rounded-full text-sm text-white ${getCategoryColor(doc.category)}`}>
                  {formatCategoryName(doc.category)}
                </span>
              )}
            </div>
          </header>

          <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">Informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50">
                  <User className="w-5 h-5 text-teal-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">Partagé par</p>
                  <p className="font-medium text-gray-900 break-words">{doc.author_name}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">Fichier</p>
                  <p className="font-medium text-gray-900 break-all">{doc.original_filename}</p>
                  <p className="text-xs text-gray-500">{formatSize(doc.size_bytes)}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
                  <Calendar className="w-5 h-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">Ajouté</p>
                  <p className="font-medium text-gray-900">{formatDate(doc.created_at)}</p>
                </div>
              </div>
            </div>
            {doc.description && (
              <p className="mt-5 text-gray-700 whitespace-pre-line">{doc.description}</p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">Aperçu</h2>
            {canPreview ? (
              <iframe
                src={fileUrl}
                title={doc.title}
                referrerPolicy="no-referrer"
                className="h-[60vh] min-h-[360px] w-full rounded-xl border border-gray-200 bg-gray-50 sm:h-[70vh]"
              />
            ) : (
              <p className="text-sm text-gray-600">
                L'aperçu n'est pas disponible pour ce format. Utilisez le bouton de téléchargement.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
