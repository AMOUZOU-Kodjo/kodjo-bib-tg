import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import {
  getDocument, viewDocument, downloadDocument, likeDocument, getDocuments,
  getDocumentViewFile, fetchDocumentViewBlob, getDocumentShareLink, createDocumentShareLink,
  toggleFavorite
} from "../api/documents";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FileText, Heart, Eye, Download, Calendar, User, ChevronRight, Share2, Maximize2, Mail, Lock, Shield, Bookmark, Flag } from "lucide-react";
import { formatSize, formatDate } from "../utils/format";
import ContactModal from "../components/contact/ContactModal";
import CommentsSection from "../components/comments/CommentsSection";
import { DocumentCard } from "../components/documents/DocumentCard";
import WhatsAppPublishButton from "../components/documents/WhatsAppPublishButton";
import ReportModal from "../components/reports/ReportModal";
import ShareModal from "../components/documents/ShareModal";
import { getCategoryColor, formatCategoryName } from "../utils/document";
import useSeo from "../hooks/useSeo";

export default function DocumentDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const { user, setUser } = useAuth();

  useSeo({
    title: doc ? doc.title : "Document",
    description: doc?.description || (doc ? `Consultez et téléchargez « ${doc.title} » sur Archives de Documents.` : "Consultez un document de la bibliothèque numérique."),
    image: doc?.thumbnail,
    url: doc ? `${window.location.origin}/documents/${doc.id}` : undefined,
    type: "article",
    noIndex: doc?.visibility === "private"
  });

  useEffect(() => {
    setLoading(true);
    setShowPreview(false);
    setPreviewLoading(false);
    setThumbnailFailed(false);
    setShareOpen(false);
    setReportOpen(false);
    setCreditsOpen(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
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
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  useEffect(() => {
    if (!previewLoading) return;
    const timer = setTimeout(() => setPreviewLoading(false), 15000);
    return () => clearTimeout(timer);
  }, [previewLoading]);

  const promptLogin = (message) => {
    toast.error(message);
    navigate("/login", { state: { from: location } });
  };

  const loadPreview = async () => {
    if (!user) {
      promptLogin("Connectez-vous pour consulter en ligne");
      return;
    }
    if (!user.email_verified) {
      toast.error("Vérifiez votre email pour consulter en ligne");
      return;
    }
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewLoading(true);
    setShowPreview(true);
    try {
      const res = await fetchDocumentViewBlob(id);
      const blobUrl = URL.createObjectURL(res.data);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors du chargement de l'aperçu");
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const download = async () => {
    if (!user) {
      promptLogin("Connectez-vous pour télécharger");
      return;
    }
    try {
      const res = await downloadDocument(id);
      if (typeof res.data.credits === "number") {
        setUser((current) => (current ? { ...current, credits: res.data.credits } : current));
      }
      const link = document.createElement("a");
      link.href = res.data.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(res.data.charged ? "Téléchargement lancé (-1 crédit)" : "Téléchargement lancé");
    } catch (err) {
      if (err.response?.data?.error?.code === "INSUFFICIENT_CREDITS") {
        setCreditsOpen(true);
      } else {
        toast.error(err.response?.data?.error?.message || "Erreur lors du téléchargement");
      }
    }
  };

  const like = async () => {
    if (!user) {
      promptLogin("Connectez-vous pour aimer ce document");
      return;
    }
    const previous = { likedByMe: doc.likedByMe, like_count: doc.like_count || 0 };
    const optimistic = !previous.likedByMe;
    setDoc((d) => ({ ...d, likedByMe: optimistic, like_count: Math.max(0, (d.like_count || 0) + (optimistic ? 1 : -1)) }));
    try {
      const res = await likeDocument(id);
      setDoc((d) => ({ ...d, likedByMe: res.data.liked, like_count: Math.max(0, previous.like_count + (res.data.liked ? 1 : 0) - (previous.likedByMe ? 1 : 0)) }));
    } catch (err) {
      setDoc((d) => ({ ...d, ...previous }));
      toast.error(err.response?.data?.error?.message || "Impossible de mettre à jour le like");
    }
  };

  const favorite = async () => {
    if (!user) {
      promptLogin("Connectez-vous pour ajouter ce document aux favoris");
      return;
    }
    try {
      const res = await toggleFavorite(id);
      setDoc((d) => ({ ...d, favoritedByMe: res.data.favorited }));
      toast.success(res.data.favorited ? "Ajouté à votre liste de lecture" : "Retiré de votre liste de lecture");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible de mettre à jour les favoris");
    }
  };

  const openReport = () => {
    if (!user) {
      promptLogin("Connectez-vous pour signaler ce contenu");
      return;
    }
    if (!user.email_verified) {
      toast.error("Vérifiez votre email pour signaler ce contenu");
      return;
    }
    setReportOpen(true);
  };

  const share = async () => {
    if (!user) {
      promptLogin("Connectez-vous pour partager ce document");
      return;
    }
    if (!user.email_verified) {
      toast.error("Vérifiez votre email pour partager ce document");
      return;
    }
    try {
      const res = doc.shareEnabled
        ? await getDocumentShareLink(doc.id)
        : await createDocumentShareLink(doc.id);
      const shareUrl = res?.data?.url || window.location.href;
      if (res?.data?.url) {
        setDoc((current) => ({ ...current, shareEnabled: true }));
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible de copier le lien");
    }
  };

  const openContact = () => {
    if (!user) {
      promptLogin("Connectez-vous pour contacter l'auteur");
      return;
    }
    if (!user.email_verified) {
      toast.error("Vérifiez votre email pour contacter l'auteur");
      return;
    }
    setContactOpen(true);
  };

  const previewSrc = showPreview ? previewBlobUrl : null;

  if (loading) return <div className="text-center py-12">Chargement...</div>;
  if (!doc) return <div className="text-center py-12">Document introuvable</div>;

  const isAdmin = user?.role === "admin" && !doc.isOwner;
  const showViewCount = doc.visibility !== "private" && !doc.isOwner;

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
          {showViewCount && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
              <Eye className="w-4 h-4" />
              <span>{doc.view_count || 0} en lecture</span>
            </div>
          )}
          <button onClick={loadPreview} disabled={previewLoading || !user?.email_verified} className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-800 transition-colors mb-3 disabled:opacity-50">
            <FileText className="w-5 h-5" />
            {previewLoading ? "Chargement..." : showPreview ? "Actualiser l'aperçu" : user?.email_verified ? "Consulter en ligne" : "Vérifiez votre email"}
          </button>
          <button onClick={download} className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 border border-gray-200 transition-colors mb-3">
            <Download className="w-5 h-5" />
            Télécharger
          </button>
          <button
            onClick={share}
            disabled={!user?.email_verified}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-4 h-4" />
            {user && !user.email_verified ? "Vérifiez votre email pour partager" : "Partager le lien"}
          </button>
          {doc.visibility === "public" && (
            <button
              onClick={() => setShareOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 border border-gray-200 transition-colors mb-3"
            >
              <Share2 className="w-4 h-4" />
              Partager sur les réseaux
            </button>
          )}
          <button
            onClick={favorite}
            className={`w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors mb-3 ${
              doc.favoritedByMe
                ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${doc.favoritedByMe ? "fill-current" : ""}`} />
            {doc.favoritedByMe ? "Dans ma liste de lecture" : "Ajouter à ma liste"}
          </button>
          {(doc.isOwner || user?.role === "admin") && (
            <WhatsAppPublishButton doc={doc} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#1ebe5b] disabled:cursor-not-allowed disabled:opacity-50" />
          )}
          {!doc.isOwner && !isAdmin && (
            <button onClick={openContact} className="w-full flex items-center justify-center gap-2 bg-white text-teal-700 px-6 py-2.5 rounded-xl font-medium hover:bg-teal-50 border border-teal-200 transition-colors">
              <Mail className="w-4 h-4" />
              Contacter l'auteur
            </button>
          )}
          {!doc.isOwner && (
            <button onClick={openReport} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600">
              <Flag className="w-4 h-4" />
              Signaler ce document
            </button>
          )}
        </aside>

        <main>
          <header className="mb-6">
            <h1 className="mb-3 text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">{doc.title}</h1>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="text-base text-gray-600 sm:text-lg">
                par{" "}
                <Link to={`/authors/${doc.owner_id}`} className="font-medium text-teal-700 hover:underline">
                  {doc.author_name}
                </Link>
              </p>
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
              {(doc.tags || []).map((tag) => (
                <Link
                  key={tag}
                  to={`/documents?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-teal-700"
                >
                  #{tag}
                </Link>
              ))}
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
                  <Link to={`/authors/${doc.owner_id}`} className="font-medium text-teal-700 break-words hover:underline">
                    {doc.author_name}
                  </Link>
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
                <a href={previewSrc || getDocumentViewFile(id)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline">
                  <Maximize2 className="w-4 h-4" />
                  Plein écran
                </a>
              )}
            </div>
            {showPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
                {previewSrc ? (
                  <object
                    data={previewSrc}
                    type={doc.mime_type || "application/pdf"}
                    className="h-[65vh] min-h-[380px] w-full md:h-[900px]"
                    aria-label={doc.title}
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                      <FileText className="h-10 w-10 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        L’aperçu ne s’affiche pas correctement sur ce navigateur.
                      </p>
                      <a
                        href={previewSrc}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                      >
                        Ouvrir dans un nouvel onglet
                      </a>
                    </div>
                  </object>
                ) : null}
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

      {reportOpen && (
        <ReportModal
          documentId={doc.id}
          targetLabel={doc.title}
          onClose={() => setReportOpen(false)}
        />
      )}

      {shareOpen && (
        <ShareModal
          url={`${window.location.origin}/documents/${doc.id}`}
          title={doc.title}
          description={doc.description}
          onClose={() => setShareOpen(false)}
        />
      )}

      {creditsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="credits-dialog-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Download className="h-5 w-5" />
            </div>
            <h2 id="credits-dialog-title" className="text-lg font-semibold text-gray-900">Crédits insuffisants</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Chaque document déposé vous offre 2 téléchargements gratuits. Déposez un document pour continuer à télécharger.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <Link
                to="/upload"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
              >
                Déposer un document
              </Link>
              <button
                type="button"
                onClick={() => setCreditsOpen(false)}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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
