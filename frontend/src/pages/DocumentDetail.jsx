import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getDocument, viewDocument, downloadDocument, likeDocument, getDocuments,
  getDocumentViewFile, getDocumentShareLink, createDocumentShareLink
} from "../api/documents";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FileText, Heart, Eye, Download, Calendar, User, ChevronRight, Share2, Maximize2, Mail, Lock, Shield } from "lucide-react";
import { formatSize, formatDate } from "../utils/format";
import ContactModal from "../components/contact/ContactModal";
import CommentsSection from "../components/comments/CommentsSection";
import { DocumentCard } from "../components/documents/DocumentCard";
import { getCategoryColor, formatCategoryName } from "../utils/document";

export default function DocumentDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setShowPreview(false);
    setPreviewLoading(false);
    setThumbnailFailed(false);
    getDocument(id)
      .then((res) => {
        setDoc(res.data.document);
        if (res.data.document?.category) {
          getDocuments({ category: res.data.document.category, limit: 6 })
            .then((r) => {
              const items = (r.data.documents || []).filter((d) => d.id !== id).slice(0, 3);
              setRelated(items);
            })
            .catch(() => setRelated([]));
        }
      })
      .catch(() => toast.error("Document introuvable"))
      .finally(() => setLoading(false));
    viewDocument(id).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!previewLoading) return;
    const timer = setTimeout(() => setPreviewLoading(false), 15000);
    return () => clearTimeout(timer);
  }, [previewLoading, previewNonce]);

  const loadPreview = () => {
    if (!user) {
      toast.error("Connectez-vous pour consulter en ligne");
      return;
    }
    if (!user.email_verified) {
      toast.error("Vérifiez votre email pour consulter en ligne");
      return;
    }
    setPreviewLoading(true);
    setShowPreview(true);
    setPreviewNonce((value) => value + 1);
  };

  const download = async () => {
    if (!user) {
      toast.error("Connectez-vous pour télécharger");
      return;
    }
    try {
      const res = await downloadDocument(id);
      window.open(res.data.url, "_blank");
      toast.success("Téléchargement lancé");
    } catch (err) {
      if (err.response?.data?.error?.code === "INSUFFICIENT_CREDITS") {
        toast.error(err.response?.data?.error?.message);
      } else {
        toast.error("Erreur lors du téléchargement");
      }
    }
  };

  const like = async () => {
    if (!user) {
      toast.error("Connectez-vous pour aimer");
      return;
    }
    try {
      const res = await likeDocument(id);
      setDoc((d) => ({ ...d, like_count: d.like_count + (res.data.liked ? 1 : -1), likedByMe: res.data.liked }));
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const share = async () => {
    try {
      let shareUrl = window.location.href;
      if (doc.visibility === "private") {
        const res = doc.shareEnabled
          ? await getDocumentShareLink(doc.id)
          : await createDocumentShareLink(doc.id);
        shareUrl = res.data.url;
        setDoc((current) => ({ ...current, shareEnabled: true }));
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success(doc.visibility === "private" ? "Lien privé copié" : "Lien copié");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible de copier le lien");
    }
  };

  const openContact = () => {
    if (!user) {
      toast.error("Connectez-vous pour contacter l'auteur");
      return;
    }
    if (!user.email_verified) {
      toast.error("Vérifiez votre email pour contacter l'auteur");
      return;
    }
    setContactOpen(true);
  };

  const previewSrc = showPreview ? `${getDocumentViewFile(id)}?v=${previewNonce}` : null;

  if (loading) return <div className="text-center py-12">Chargement...</div>;
  if (!doc) return <div className="text-center py-12">Document introuvable</div>;

  const isAdmin = user?.role === "admin" && !doc.isOwner;

  return (
    <div>
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:mb-6 sm:text-sm">
        <Link to="/" className="hover:text-teal-700">Accueil</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/documents" className="hover:text-teal-700">Livres</Link>
        {doc.category && (
          <>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/documents?category=${encodeURIComponent(doc.category)}`} className="hover:text-teal-700">
              {formatCategoryName(doc.category)}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 line-clamp-1">{doc.title}</span>
      </nav>

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
        <aside>
          <div className="mx-auto mb-4 w-full max-w-[240px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:max-w-[280px] lg:max-w-none">
            <div className="relative aspect-[3/4] bg-gray-100">
              {doc.thumbnail && !thumbnailFailed ? (
                <img
                  src={doc.thumbnail}
                  alt={doc.title}
                  className="w-full h-full object-cover object-top"
                  onError={() => setThumbnailFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-slate-50 via-white to-teal-50">
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-teal-700" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-4 px-2">{doc.title}</p>
                  <p className="mt-4 text-[10px] uppercase tracking-widest text-gray-400">{doc.original_filename?.split('.').pop() || "DOC"}</p>
                </div>
              )}
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium text-white bg-teal-700">
                Gratuit
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
            <Eye className="w-4 h-4" />
            <span>{doc.view_count || 0} en lecture</span>
          </div>
          <button onClick={loadPreview} disabled={previewLoading || !user?.email_verified} className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-800 transition-colors mb-3 disabled:opacity-50">
            <FileText className="w-5 h-5" />
            {previewLoading ? "Chargement..." : showPreview ? "Actualiser l'aperçu" : user?.email_verified ? "Consulter en ligne" : "Vérifiez votre email"}
          </button>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 border border-gray-200 transition-colors mb-3">
            <Download className="w-5 h-5" />
            Télécharger (PDF)
          </button>
          {(doc.visibility !== "private" || doc.isOwner) && (
            <button onClick={share} className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors mb-3">
              <Share2 className="w-4 h-4" />
              {doc.visibility === "private" ? "Copier le lien privé" : "Partager ce livre"}
            </button>
          )}
          {!doc.isOwner && !isAdmin && (
            <button onClick={openContact} className="w-full flex items-center justify-center gap-2 bg-white text-teal-700 px-6 py-2.5 rounded-xl font-medium hover:bg-teal-50 border border-teal-200 transition-colors">
              <Mail className="w-4 h-4" />
              Contacter l'auteur
            </button>
          )}
        </aside>

        <main>
          <header className="mb-6">
            <h1 className="mb-3 text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">{doc.title}</h1>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="text-base text-gray-600 sm:text-lg">par {doc.author_name}</p>
              {doc.visibility === "private" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                  <Lock className="w-3 h-3" />
                  Document privé
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                  <Shield className="w-3 h-3" />
                  Vue administrateur
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {doc.category && (
                <Link to={`/documents?category=${encodeURIComponent(doc.category)}`} className={`px-3 py-1 rounded-full text-sm text-white ${getCategoryColor(doc.category)}`}>
                  {formatCategoryName(doc.category)}
                </Link>
              )}
              <button onClick={like} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors ${doc.likedByMe ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                <Heart className={`w-4 h-4 ${doc.likedByMe ? "fill-current" : ""}`} />
                {doc.like_count || 0}
              </button>
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
                  <p className="text-sm text-gray-500">Auteur</p>
                  <p className="font-medium text-gray-900 break-words">{doc.author_name}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <FileText className="w-5 h-5 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">Catégorie</p>
                  <p className="font-medium text-gray-900">{doc.category ? formatCategoryName(doc.category) : "-"}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <Download className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">Disponibilité</p>
                  <p className="font-medium text-gray-900">Gratuit</p>
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
          </section>

          {doc.description && (
            <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">À propos de ce livre</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{doc.description}</p>
            </section>
          )}

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Aperçu du livre</h2>
              {showPreview && (
                <a href={getDocumentViewFile(id)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline">
                  <Maximize2 className="w-4 h-4" />
                  Plein écran
                </a>
              )}
            </div>
            {showPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
                <iframe
                  src={previewSrc}
                  onLoad={() => setPreviewLoading(false)}
                  onError={() => setPreviewLoading(false)}
                  className="h-[60vh] min-h-[420px] w-full md:h-[900px]"
                  title={doc.title}
                />
                {previewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-gray-600" aria-live="polite">
                    Chargement de l’aperçu…
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-100">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <FileText className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-4">{user?.email_verified ? "Cliquez sur \"Consulter en ligne\" pour afficher l'aperçu" : "Vérifiez votre email pour consulter l'aperçu en ligne"}</p>
                  <button onClick={loadPreview} disabled={previewLoading || !user?.email_verified} className="px-4 py-2 bg-teal-700 text-white rounded-lg shadow-sm hover:bg-teal-800 disabled:opacity-50">
                    {previewLoading ? "Chargement..." : user?.email_verified ? "Charger l'aperçu" : "Vérifier mon email"}
                  </button>
                </div>
              </div>
            )}
            {doc.size_bytes && (
              <p className="text-sm text-gray-500 mt-3">Taille : {formatSize(doc.size_bytes)} • Format : {doc.mime_type?.split("/")[1]?.toUpperCase() || "-"}</p>
            )}
          </section>

          <div className="mt-6">
            <CommentsSection
              documentId={doc.id}
              initialCount={doc.comment_count || 0}
              isOwner={doc.isOwner}
            />
          </div>
        </main>
      </div>

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        documentId={doc.id}
        documentTitle={doc.title}
        authorName={doc.author_name}
      />

      {related.length > 0 && (
        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">Dans la même catégorie</h2>
          <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {related.map((item) => (
              <DocumentCard key={item.id} doc={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
