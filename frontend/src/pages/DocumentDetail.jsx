import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getDocument, viewDocument, downloadDocument, likeDocument, getDocuments,
  getDocumentViewFile, fetchDocumentViewBlob, getDocumentShareLink, createDocumentShareLink,
  toggleFavorite
} from "../api/documents";
import { summarizeDocument, translateText } from "../api/ai";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FileText, Heart, Eye, Download, Calendar, User, ChevronRight, Share2, Maximize2, Mail, Lock, Shield, Bookmark, Flag, Sparkles, Loader2, Languages, MessageCircle } from "lucide-react";
import { formatSize, formatDate } from "../utils/format";
import { ReadingProgress } from "../components/ui";
import ContactModal from "../components/contact/ContactModal";
import CommentsSection from "../components/comments/CommentsSection";
import { DocumentCard } from "../components/documents/DocumentCard";
import WhatsAppPublishButton from "../components/documents/WhatsAppPublishButton";
import ReportModal from "../components/reports/ReportModal";
import ShareModal from "../components/documents/ShareModal";
import { getCategoryColor, formatCategoryName } from "../utils/document";
import useSeo from "../hooks/useSeo";
import { getPublicShareUrl } from "../api/share";
import { SALES_ENABLED } from "../config/features";
import { useLiveVersion } from "../context/LiveUpdatesContext";

const PdfPreview = lazy(() => import("../components/documents/PdfPreview"));

export default function DocumentDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [translation, setTranslation] = useState("");
  const [translationLang, setTranslationLang] = useState("");
  const [translationLoading, setTranslationLoading] = useState(false);
  const autoPreviewDocRef = useRef(null);
  const liveVersionRef = useRef(0);
  const documentsVersion = useLiveVersion("documents");
  const { user, setUser } = useAuth();

  const seoOrigin = typeof window !== "undefined" ? window.location.origin : "https://archivia.pages.dev";
  useSeo({
    title: doc ? doc.title : t("document.fallback"),
    description: doc?.description || (doc ? t("document.seoDesc", { title: doc.title }) : t("document.seoDescFallback")),
    image: doc?.thumbnail,
    url: doc ? `${seoOrigin}/documents/${doc.id}` : undefined,
    type: "article",
    noIndex: doc?.visibility === "private",
    jsonLd: doc ? {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "DigitalDocument",
          "name": doc.title,
          "description": doc.description || undefined,
          "image": doc.thumbnail || undefined,
          "url": `${seoOrigin}/documents/${doc.id}`,
          "datePublished": doc.created_at,
          "dateModified": doc.created_at,
          "author": { "@type": "Person", "name": doc.author_name || "Auteur inconnu" },
          "publisher": {
            "@type": "Organization",
            "name": "Archivia",
            "logo": { "@type": "ImageObject", "url": `${seoOrigin}/logo.png` }
          },
          "encodingFormat": doc.mime_type || undefined,
          "contentSize": doc.size_bytes || undefined,
          "inLanguage": "fr"
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${seoOrigin}/` },
            { "@type": "ListItem", "position": 2, "name": "Documents", "item": `${seoOrigin}/documents` },
            ...(doc.category ? [{
              "@type": "ListItem",
              "position": 3,
              "name": doc.category,
              "item": `${seoOrigin}/documents?category=${encodeURIComponent(doc.category_slug || doc.category)}`
            }] : []),
            {
              "@type": "ListItem",
              "position": doc.category ? 4 : 3,
              "name": doc.title,
              "item": `${seoOrigin}/documents/${doc.id}`
            }
          ]
        }
      ]
    } : null
  });

  useEffect(() => {
    setLoading(true);
    setShowPreview(false);
    setPreviewLoading(false);
    autoPreviewDocRef.current = null;
    setThumbnailFailed(false);
    setShareOpen(false);
    setReportOpen(false);
    setCreditsOpen(false);
    setSummary("");
    setSummaryLoading(false);
    setTranslation("");
    setTranslationLang("");
    setTranslationLoading(false);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    getDocument(id)
      .then((res) => {
        setDoc(res.data.document);
        if (res.data.document?.category) {
          getDocuments({ category: res.data.document.category_slug || res.data.document.category, limit: 6 })
            .then((r) => {
              const items = (r.data.documents || []).filter((d) => d.id !== id).slice(0, 3);
              setRelated(items);
            })
            .catch(() => setRelated([]));
        }
      })
      .catch(() => toast.error(t("document.notFoundToast")))
      .finally(() => setLoading(false));
    viewDocument(id).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (liveVersionRef.current === documentsVersion) return undefined;
    liveVersionRef.current = documentsVersion;
    let active = true;
    getDocument(id)
      .then((res) => {
        if (active) setDoc(res.data.document);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, documentsVersion]);

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

  const promptLogin = useCallback((message) => {
    toast.error(message);
    navigate("/login", { state: { from: location } });
  }, [navigate, location]);

  const loadPreview = useCallback(async () => {
    if (!user) {
      promptLogin(t("document.loginToPreview"));
      return;
    }
    if (!user.email_verified) {
      toast.error(t("document.verifyToPreview"));
      return;
    }
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewLoading(true);
    setShowPreview(true);
    try {
      const res = await fetchDocumentViewBlob(id);
      const blobUrl = URL.createObjectURL(res.data);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("document.previewLoadError"));
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  }, [id, previewBlobUrl, promptLogin, t, user]);

  useEffect(() => {
    if (!doc?.id || !user?.email_verified) return;
    const previewKey = `${doc.id}:${user.id || "anon"}`;
    if (autoPreviewDocRef.current === previewKey) return;
    autoPreviewDocRef.current = previewKey;
    loadPreview();
  }, [doc?.id, loadPreview, user?.email_verified, user?.id]);

  const download = async () => {
    if (isPaid && !doc.isOwner && user?.role !== "admin") {
      toast.error(t("document.paidDownloadBlocked"));
      return;
    }
    if (!user) {
      promptLogin(t("document.loginToDownload"));
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
      toast.success(res.data.charged ? t("document.downloadCharged") : t("document.downloadStarted"));
    } catch (err) {
      if (err.response?.data?.error?.code === "INSUFFICIENT_CREDITS") {
        setCreditsOpen(true);
      } else {
        toast.error(err.response?.data?.error?.message || t("document.downloadError"));
      }
    }
  };

  const like = async () => {
    if (!user) {
      promptLogin(t("document.loginToLike"));
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
      toast.error(err.response?.data?.error?.message || t("document.likeError"));
    }
  };

  const favorite = async () => {
    if (!user) {
      promptLogin(t("document.loginToFavorite"));
      return;
    }
    try {
      const res = await toggleFavorite(id);
      setDoc((d) => ({ ...d, favoritedByMe: res.data.favorited }));
      toast.success(res.data.favorited ? t("document.favAdded") : t("document.favRemoved"));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("document.favError"));
    }
  };

  const handleSummarize = async () => {
    if (summary || summaryLoading) return;
    setSummaryLoading(true);
    try {
      const res = await summarizeDocument({
        title: doc?.title,
        description: doc?.description,
        category: doc?.category,
        filename: doc?.original_filename
      });
      setSummary(res.data?.summary || "");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("document.summaryError"));
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleTranslate = async (target) => {
    const source = summary || doc?.description || doc?.title || "";
    if (!source.trim()) return;
    if (translationLoading || (translation && translationLang === target)) return;
    setTranslationLoading(true);
    try {
      const res = await translateText({ text: source, target });
      setTranslation(res.data?.translation || "");
      setTranslationLang(target);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("document.translateError"));
    } finally {
      setTranslationLoading(false);
    }
  };

  const openReport = () => {
    if (!user) {
      promptLogin(t("document.loginToReport"));
      return;
    }
    if (!user.email_verified) {
      toast.error(t("document.verifyToReport"));
      return;
    }
    setReportOpen(true);
  };

  const share = async () => {
    if (doc.visibility === "public") {
      try {
        await navigator.clipboard.writeText(getPublicShareUrl(doc.id));
        toast.success(t("share.copied"));
      } catch {
        toast.error(t("share.copyError"));
      }
      return;
    }
    if (!user) {
      promptLogin(t("document.loginToShare"));
      return;
    }
    if (!user.email_verified) {
      toast.error(t("document.verifyToShare"));
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
      toast.success(t("share.copied"));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("share.copyError"));
    }
  };

  const openContact = () => {
    if (!user) {
      promptLogin(t("document.loginToContact"));
      return;
    }
    if (!user.email_verified) {
      toast.error(t("document.verifyToContact"));
      return;
    }
    setContactOpen(true);
  };

  const previewSrc = showPreview ? previewBlobUrl : null;

  if (loading) return <div className="text-center py-12">{t("common.loading")}</div>;
  if (!doc) return <div className="text-center py-12">{t("document.notFound")}</div>;

  const isAdmin = user?.role === "admin" && !doc.isOwner;
  const showViewCount = doc.visibility !== "private" && !doc.isOwner;
  const isPdfDoc = doc.mime_type === "application/pdf" || doc.original_filename?.toLowerCase().endsWith(".pdf");
  const isPaid = SALES_ENABLED && Number(doc.price) > 0;
  const canDownloadPaid = !isPaid || doc.isOwner || user?.role === "admin";

  return (
    <div>
      <ReadingProgress />
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400 sm:mb-6 sm:text-sm">
        <Link to="/" className="hover:text-teal-700 dark:hover:text-teal-300">{t("document.home")}</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/documents" className="hover:text-teal-700 dark:hover:text-teal-300">{t("document.books")}</Link>
        {doc.category && (
          <>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/documents?category=${encodeURIComponent(doc.category_slug || doc.category)}`} className="hover:text-teal-700 dark:hover:text-teal-300">
              {formatCategoryName(doc.category, t)}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-slate-100 line-clamp-1">{doc.title}</span>
      </nav>

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
        <aside>
          <div className="mx-auto mb-4 w-full max-w-[240px] overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm sm:max-w-[280px] lg:max-w-none">
            <div className="relative aspect-[3/4] bg-gray-100 dark:bg-slate-800">
              {doc.thumbnail && !thumbnailFailed ? (
                <img
                  src={doc.thumbnail}
                  alt={doc.title}
                  className="w-full h-full object-cover object-top"
                  onError={() => setThumbnailFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-slate-50 dark:from-slate-900 via-white to-teal-50">
                  <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-teal-700 dark:text-teal-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 line-clamp-4 px-2">{doc.title}</p>
                  <p className="mt-4 text-[10px] uppercase tracking-widest text-gray-400">{doc.original_filename?.split('.').pop() || "DOC"}</p>
                </div>
              )}
              <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium text-white ${isPaid ? "bg-amber-600" : "bg-teal-700"}`}>
                {isPaid ? `${t("document.forSale")} · ${Number(doc.price).toLocaleString("fr-FR")} FCFA` : t("document.free")}
              </span>
            </div>
          </div>
          {showViewCount && (
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-slate-400 mb-4">
              <span className="inline-flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{t("document.views", { count: doc.view_count || 0 })}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>{t("document.downloadCount", { count: doc.download_count || 0 })}</span>
              </span>
            </div>
          )}
          <button onClick={loadPreview} disabled={previewLoading || !user?.email_verified} className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-800 transition-colors mb-3 disabled:opacity-50">
            <FileText className="w-5 h-5" />
            {previewLoading ? t("common.loading") : showPreview ? t("document.refreshPreview") : user?.email_verified ? t("document.loadPreview") : t("document.verifyEmail")}
          </button>
          {canDownloadPaid ? (
            <button onClick={download} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-900 border border-gray-200 dark:border-slate-700 transition-colors mb-3">
              <Download className="w-5 h-5" />
              {t("common.download")}
            </button>
          ) : doc.seller_whatsapp ? (
            <a
              href={`https://wa.me/${String(doc.seller_whatsapp).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour, je suis intéressé par "${doc.title}" au prix de ${Number(doc.price).toLocaleString("fr-FR")} FCFA.\nAperçu: ${getPublicShareUrl(doc.id)}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1ebe5b] transition-colors mb-3"
            >
              <MessageCircle className="w-5 h-5" />
              {t("document.order")}
            </a>
          ) : (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              {t("document.paidDownloadBlocked")}
            </div>
          )}
          <button
            onClick={share}
            disabled={doc.visibility !== "public" && !user?.email_verified}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-4 h-4" />
            {doc.visibility !== "public" && user && !user.email_verified
              ? t("document.verifyToShare")
              : isPaid && doc.isOwner
                ? t("document.shareDownloadLink")
                : t("document.shareLink")}
          </button>
          {doc.visibility === "public" && (
            <button
              onClick={() => setShareOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-900 border border-gray-200 dark:border-slate-700 transition-colors mb-3"
            >
              <Share2 className="w-4 h-4" />
              {t("document.shareOnSocial")}
            </button>
          )}
          <button
            onClick={favorite}
            className={`w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors mb-3 ${
              doc.favoritedByMe
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-900"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${doc.favoritedByMe ? "fill-current" : ""}`} />
            {doc.favoritedByMe ? t("document.inReadingList") : t("document.addToReadingList")}
          </button>
          {(doc.isOwner || user?.role === "admin") && (
            <WhatsAppPublishButton doc={doc} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#1ebe5b] disabled:cursor-not-allowed disabled:opacity-50" />
          )}
            {!doc.isOwner && (
            <button onClick={openContact} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 px-6 py-2.5 rounded-xl font-medium hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-teal-200 dark:border-teal-800 transition-colors">
              <Mail className="w-4 h-4" />
              {t("document.contactAuthor")}
            </button>
          )}
          {!doc.isOwner && (
            <button onClick={openReport} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-2 text-sm font-medium text-gray-500 dark:text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600">
              <Flag className="w-4 h-4" />
              {t("document.reportDocument")}
            </button>
          )}
        </aside>

        <main>
          <header className="mb-6">
            <h1 className="mb-3 text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl md:text-3xl lg:text-4xl">{doc.title}</h1>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="text-base text-gray-600 dark:text-slate-400 sm:text-lg">
                {t("document.by")}{" "}
                <Link to={`/authors/${doc.owner_id}`} className="font-medium text-teal-700 dark:text-teal-300 hover:underline">
                  {doc.author_name}
                </Link>
              </p>
              {doc.visibility === "private" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                  <Lock className="w-3 h-3" />
                  {t("document.privateDoc")}
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200">
                  <Shield className="w-3 h-3" />
                  {t("document.adminView")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {doc.category && (
                <Link to={`/documents?category=${encodeURIComponent(doc.category_slug || doc.category)}`} className={`px-3 py-1 rounded-full text-sm text-white ${getCategoryColor(doc.category)}`}>
                  {formatCategoryName(doc.category, t)}
                </Link>
              )}
              {(doc.tags || []).map((tag) => (
                <Link
                  key={tag}
                  to={`/documents?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm text-gray-700 dark:text-slate-300 transition-colors hover:bg-gray-50 dark:hover:bg-slate-900 hover:text-teal-700 dark:hover:text-teal-300"
                >
                  #{tag}
                </Link>
              ))}
              <button onClick={like} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors ${doc.likedByMe ? "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200 dark:border-red-900" : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-900"}`}>
                <Heart className={`w-4 h-4 ${doc.likedByMe ? "fill-current" : ""}`} />
                {doc.like_count || 0}
              </button>
            </div>
          </header>

          <section className="mb-6 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-slate-100 sm:text-xl">{t("document.info")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/40">
                  <User className="w-5 h-5 text-teal-700 dark:text-teal-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t("document.author")}</p>
                  <Link to={`/authors/${doc.owner_id}`} className="font-medium text-teal-700 dark:text-teal-300 break-words hover:underline">
                    {doc.author_name}
                  </Link>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
                  <FileText className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t("document.category")}</p>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{doc.category ? formatCategoryName(doc.category, t) : "-"}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
                  <Download className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t("document.availability")}</p>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{t("document.free")}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
                  <Calendar className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t("document.added")}</p>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{formatDate(doc.created_at)}</p>
                </div>
              </div>
            </div>
          </section>

          {(doc.description || doc.title || summary || summaryLoading || translation) && (
            <section className="mb-6 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 sm:text-xl">{t("document.about")}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {!summary && !summaryLoading && (doc.description || doc.title) && (
                    <button
                      type="button"
                      onClick={handleSummarize}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-800 transition-colors hover:bg-teal-100 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-200 dark:hover:bg-teal-950/50"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("document.aiSummary")}
                    </button>
                  )}
                  {(doc.description || summary || doc.title) && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTranslate("en")}
                        disabled={translationLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {translationLoading && translationLang !== "fr" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTranslate("fr")}
                        disabled={translationLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {translationLoading && translationLang === "fr" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
                        FR
                      </button>
                    </>
                  )}
                </div>
              </div>
              {summaryLoading && (
                <div className="mb-3 flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("document.generatingSummary")}
                </div>
              )}
              {summary && (
                <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">{t("document.aiSummary")}</p>
                  <p className="text-sm leading-relaxed text-gray-800 dark:text-slate-200">{summary}</p>
                </div>
              )}
              {translation && (
                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-400">{t("document.translation", { lang: translationLang.toUpperCase() })}</p>
                  <p className="text-sm leading-relaxed text-gray-800 dark:text-slate-200">{translation}</p>
                </div>
              )}
              {doc.description ? (
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{doc.description}</p>
              ) : !summary && !summaryLoading ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">{t("document.noDescription")}</p>
              ) : null}
            </section>
          )}

          <section className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 sm:text-xl">{t("document.previewTitle")}</h2>
              {showPreview && (
                <a href={previewSrc || getDocumentViewFile(id)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium text-teal-700 dark:text-teal-300 hover:underline">
                  <Maximize2 className="w-4 h-4" />
                  {t("document.fullScreen")}
                </a>
              )}
            </div>
            {showPreview ? (
              <div className={previewSrc && isPdfDoc ? "relative" : "relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"}>
                {!previewSrc && doc.thumbnail && (
                  <img
                    src={doc.thumbnail}
                    alt={doc.title}
                    className="h-[65vh] min-h-[380px] w-full object-cover object-top md:h-[900px]"
                  />
                )}
                {previewSrc ? (
                  isPdfDoc ? (
                    <Suspense fallback={(
                      <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                        {t("document.loadingFullPreview")}
                      </div>
                    )}>
                      <PdfPreview src={previewSrc} title={doc.title} />
                    </Suspense>
                  ) : doc.mime_type?.startsWith("image/") ? (
                    <img
                      src={previewSrc}
                      alt={doc.title}
                      className="max-h-[75vh] w-full bg-gray-50 object-contain md:max-h-[900px]"
                    />
                  ) : (
                    <object
                      data={previewSrc}
                      type={doc.mime_type || "application/octet-stream"}
                      className="h-[65vh] min-h-[380px] w-full md:h-[900px]"
                      aria-label={doc.title}
                    >
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                        <FileText className="h-10 w-10 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          {t("document.previewFrameError")}
                        </p>
                        <a
                          href={previewSrc}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                        >
                          {t("document.openNewTab")}
                        </a>
                      </div>
                    </object>
                  )
                ) : null}
                {previewLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 dark:bg-slate-800/80 text-sm text-gray-600 dark:text-slate-400" aria-live="polite">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                    {t("document.loadingFullPreview")}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 dark:from-slate-800 to-gray-50 dark:to-slate-900 border border-gray-100 dark:border-slate-700">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <FileText className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-slate-400 mb-4">{user?.email_verified ? t("document.clickToPreview") : t("document.verifyToPreviewOnline")}</p>
                  <button onClick={loadPreview} disabled={previewLoading || !user?.email_verified} className="px-4 py-2 bg-teal-700 text-white rounded-lg shadow-sm hover:bg-teal-800 disabled:opacity-50">
                    {previewLoading ? t("common.loading") : user?.email_verified ? t("document.loadPreview") : t("document.verifyEmailBtn")}
                  </button>
                </div>
              </div>
            )}
            {doc.size_bytes && (
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-3">{t("document.fileMeta", { size: formatSize(doc.size_bytes), format: doc.mime_type?.split("/")[1]?.toUpperCase() || "-" })}</p>
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
          url={getPublicShareUrl(doc.id)}
          title={doc.title}
          description={doc.description}
          onClose={() => setShareOpen(false)}
        />
      )}

      {creditsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="credits-dialog-title">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
              <Download className="h-5 w-5" />
            </div>
            <h2 id="credits-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t("document.insufficientCredits")}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">
              {t("document.creditsInfo")}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                to="/credits"
                className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
              >
                {t("document.buyCredits")}
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center justify-center rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-500/10"
              >
                {t("document.uploadDocument")}
              </Link>
              <button
                type="button"
                onClick={() => setCreditsOpen(false)}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-slate-100 sm:text-xl md:text-2xl">{t("document.sameCategory")}</h2>
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
