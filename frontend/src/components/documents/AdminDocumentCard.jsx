import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Download, ExternalLink, Eye, FileText, Globe2, HardDrive, Heart, Loader2, Lock, MessageCircle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { formatCategoryName, getCategoryColor } from "../../utils/document";
import { formatDate, formatSize } from "../../utils/format";
import { SALES_ENABLED } from "../../config/features";

function Stat({ icon: Icon, label, value, title }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 text-center" title={title}>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-800 dark:text-slate-200">
        <Icon className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
        {value}
      </span>
      <span className="truncate text-[10px] text-gray-400 dark:text-slate-500">{label}</span>
    </div>
  );
}

export default function AdminDocumentCard({
  doc,
  selected = false,
  onToggleSelect,
  onToggleVisibility,
  onDelete,
  visibilityBusy = false
}) {
  const { t } = useTranslation();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const isPrivate = doc.visibility === "private";
  const showThumbnail = Boolean(doc.thumbnail) && !thumbnailFailed;
  const extension = doc.original_filename
    ? String(doc.original_filename).split(".").pop().toUpperCase()
    : String(doc.mime_type || "").split("/").pop().toUpperCase() || "DOC";
  const hasPrice = SALES_ENABLED && Number(doc.price) > 0;
  const categoryLabel = doc.category ? formatCategoryName(doc.category, t) : t("document.fallback");
  const tags = Array.isArray(doc.tags) ? doc.tags.filter(Boolean) : [];
  const authorInitial = String(doc.author_name || "?").trim().charAt(0).toUpperCase();

  const copyLink = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/documents/${doc.id}`);
      toast.success(t("admin.linkCopied"));
    } catch {
      toast.error(t("admin.copyFailed"));
    }
  };

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-800 ${
        selected ? "border-teal-400 ring-2 ring-teal-400/60 dark:border-teal-500 dark:ring-teal-500/50" : "border-gray-100 dark:border-slate-700"
      }`}
    >
      <div className="relative h-32 shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-gray-800 to-teal-900">
        <Link
          to={`/documents/${doc.id}`}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 block"
          tabIndex={-1}
          aria-hidden="true"
        >
          {showThumbnail ? (
            <img
              src={doc.thumbnail}
              alt=""
              loading="lazy"
              onError={() => setThumbnailFailed(true)}
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.3),transparent_60%)]">
              <FileText className="h-9 w-9 text-white/70" />
              <span className="text-[10px] font-bold tracking-widest text-teal-200/80">{extension}</span>
            </div>
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />
        </Link>

        <label
          className="absolute right-2.5 top-2.5 z-20 cursor-pointer rounded-lg bg-white/95 p-1.5 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-slate-800/95"
          title={t("admin.selectDocAria", { title: doc.title })}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(doc.id)}
            aria-label={t("admin.selectDocAria", { title: doc.title })}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary-600 dark:border-slate-600 dark:text-primary-100"
          />
        </label>

        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur ${
              isPrivate ? "bg-gray-900/85" : "bg-teal-700/90"
            }`}
          >
            {isPrivate ? <Lock className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />}
            {isPrivate ? t("admin.private") : t("admin.public")}
          </span>
          {hasPrice && (
            <span className="rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              {Number(doc.price).toLocaleString("fr-FR")} FCFA
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-10 flex items-end justify-between gap-2">
          <span
            title={categoryLabel}
            className={`max-w-[75%] truncate rounded-full px-2.5 py-1 text-[11px] font-medium text-white shadow-sm ${getCategoryColor(doc.category)}`}
          >
            {categoryLabel}
          </span>
          <span className="rounded-md border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/90 backdrop-blur">
            {extension}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link
          to={`/documents/${doc.id}`}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-gray-900 transition-colors hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-100"
          title={doc.title}
        >
          {doc.title}
        </Link>

        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700 dark:bg-teal-900/60 dark:text-teal-300">
            {authorInitial}
          </span>
          <span className="min-w-0 truncate" title={doc.author_name}>{doc.author_name || t("admin.unknownAuthor")}</span>
          <span className="ml-auto shrink-0 text-[11px] text-gray-400 dark:text-slate-500">{formatDate(doc.created_at)}</span>
        </div>

        <p className="mt-2 line-clamp-2 min-h-[2rem] text-xs leading-relaxed text-gray-500 dark:text-slate-400">
          {doc.description || t("admin.noDescription")}
        </p>

        <div className="mt-2 flex min-h-[1.25rem] flex-wrap items-center gap-1">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
              {t("admin.moreTags", { count: tags.length - 3 })}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-gray-50 px-1.5 py-2 dark:bg-slate-900/60">
          <Stat icon={Eye} label={t("admin.views")} value={doc.view_count || 0} title={t("admin.views")} />
          <Stat icon={Download} label={t("admin.downloadsShort")} value={doc.download_count || 0} title={t("admin.downloads")} />
          <Stat icon={Heart} label={t("admin.likes")} value={doc.like_count || 0} title={t("admin.likes")} />
          <Stat icon={MessageCircle} label={t("admin.commentsShort")} value={doc.comment_count || 0} title={t("admin.statsComments")} />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-400 dark:text-slate-500">
          <span className="inline-flex shrink-0 items-center gap-1" title={t("admin.size")}>
            <HardDrive className="h-3 w-3" />
            {doc.size_bytes ? formatSize(doc.size_bytes) : "-"}
          </span>
          <span className="min-w-0 truncate" title={doc.original_filename}>
            {doc.original_filename || t("admin.file")}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-1 border-t border-gray-100 pt-3 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onToggleVisibility(doc)}
            disabled={visibilityBusy}
            title={isPrivate ? t("admin.togglePublic") : t("admin.togglePrivate")}
            aria-label={isPrivate ? t("admin.togglePublicAria", { title: doc.title }) : t("admin.togglePrivateAria", { title: doc.title })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-teal-950/40 dark:hover:text-teal-300"
          >
            {visibilityBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : isPrivate ? <Lock className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={copyLink}
            title={t("admin.copyLink")}
            aria-label={t("admin.copyLink")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          >
            <Copy className="h-4 w-4" />
          </button>
          <Link
            to={`/documents/${doc.id}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("admin.open")}
          </Link>
          <button
            type="button"
            onClick={() => onDelete(doc)}
            title={t("admin.deleteDoc")}
            aria-label={t("admin.deleteDoc")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
