import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye, FileText, Lock, Pencil, Share2, Trash2 } from "lucide-react";
import { getCategoryColor, formatCategoryName } from "../../utils/document";
import { useQuickPreview } from "../../context/QuickPreviewContext";

export function DocumentCard({ doc, onEdit, onDelete, onShare, deleting = false }) {
  const { t } = useTranslation();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const { openPreview } = useQuickPreview();
  const isPrivate = doc.visibility === "private";
  const showThumbnail = Boolean(doc.thumbnail) && !thumbnailFailed;
  const views = doc.view_count || 0;
  const downloads = doc.download_count || 0;

  return (
    <article className="group relative h-64 md:h-72 overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/documents/${doc.id}`} className="block h-full">
        {showThumbnail ? (
          <img
            src={doc.thumbnail}
            alt={doc.title}
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="lazy"
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.25),transparent_55%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <FileText className="mb-3 h-10 w-10 text-white/80" />
              <p className="line-clamp-3 text-sm font-medium text-white/90">{doc.title}</p>
            </div>
          </div>
        )}

        <div className="doc-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="doc-overlay absolute left-4 top-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium text-white ${getCategoryColor(doc.category)}`}>
            {doc.category ? formatCategoryName(doc.category, t) : t("document.fallback")}
          </span>
          {isPrivate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Lock className="h-3 w-3" />
              {t("common.private")}
            </span>
          )}
        </div>

        <div className="doc-overlay absolute inset-x-0 bottom-0 p-5">
          <p className="mb-1 line-clamp-2 text-sm font-medium text-white">{doc.title}</p>
          <p className="text-xs text-gray-300">{doc.author_name}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-200">
            <span className="inline-flex items-center gap-1" title={t("document.viewCount", { count: views })}>
              <Eye className="h-3.5 w-3.5" />
              {views}
            </span>
            <span className="inline-flex items-center gap-1" title={t("document.downloadCount", { count: downloads })}>
              <Download className="h-3.5 w-3.5" />
              {downloads}
            </span>
          </div>
          {doc.tags?.length > 0 && (
            <p className="mt-1 line-clamp-1 text-[10px] font-medium text-teal-200">
              #{doc.tags.slice(0, 3).join(" #")}
            </p>
          )}
        </div>
      </Link>

        <div className="doc-stats-badge pointer-events-none absolute bottom-4 right-4 z-10 items-center gap-2 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur transition-opacity">
          <span className="inline-flex items-center gap-1" title={t("document.viewCount", { count: views })}>
            <Eye className="h-3 w-3" />
            {views}
          </span>
          <span className="inline-flex items-center gap-1" title={t("document.downloadCount", { count: downloads })}>
            <Download className="h-3 w-3" />
            {downloads}
          </span>
        </div>

        <div className="absolute right-4 top-4 z-10 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openPreview(doc);
            }}
            aria-label={t("document.quickPreviewAria", { title: doc.title })}
            title={t("document.quickPreview")}
            className="rounded-lg bg-white/95 dark:bg-slate-800/95 p-2 text-gray-700 dark:text-slate-300 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300"
          >
            <Eye className="h-4 w-4" />
          </button>
          {onShare && isPrivate && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onShare(event);
              }}
              aria-label={t("document.shareAria", { title: doc.title })}
              title={t("document.sharePrivateLink")}
              className="rounded-lg bg-white/95 dark:bg-slate-800/95 p-2 text-gray-700 dark:text-slate-300 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onEdit(event);
              }}
              aria-label={t("document.editAria", { title: doc.title })}
              title={t("common.edit")}
              className="rounded-lg bg-white/95 dark:bg-slate-800/95 p-2 text-gray-700 dark:text-slate-300 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white dark:hover:bg-slate-800 hover:text-teal-700 dark:hover:text-teal-300"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(event);
              }}
              disabled={deleting}
              aria-label={t("document.deleteAria", { title: doc.title })}
              title={t("common.delete")}
              className="rounded-lg bg-white/95 dark:bg-slate-800/95 p-2 text-red-600 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white dark:hover:bg-slate-800 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
    </article>
  );
}
