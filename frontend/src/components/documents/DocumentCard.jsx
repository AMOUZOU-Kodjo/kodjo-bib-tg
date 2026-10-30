import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Lock, Pencil, Share2, Trash2 } from "lucide-react";
import { getCategoryColor, formatCategoryName } from "../../utils/document";

export function DocumentCard({ doc, onEdit, onDelete, onShare, deleting = false }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const hasActions = Boolean(onEdit || onDelete || onShare);
  const isPrivate = doc.visibility === "private";
  const showThumbnail = Boolean(doc.thumbnail) && !thumbnailFailed;

  return (
    <article className="group relative h-64 md:h-72 overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl">
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
            {doc.category ? formatCategoryName(doc.category) : "Document"}
          </span>
          {isPrivate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Lock className="h-3 w-3" />
              Privé
            </span>
          )}
        </div>

        <div className="doc-overlay absolute inset-x-0 bottom-0 p-5">
          <p className="mb-1 line-clamp-2 text-sm font-medium text-white">{doc.title}</p>
          <p className="text-xs text-gray-300">{doc.author_name}</p>
          {doc.tags?.length > 0 && (
            <p className="mt-1 line-clamp-1 text-[10px] font-medium text-teal-200">
              #{doc.tags.slice(0, 3).join(" #")}
            </p>
          )}
        </div>
      </Link>

      {hasActions && (
        <div className="absolute right-4 top-4 z-10 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          {onShare && isPrivate && (
            <button
              type="button"
              onClick={onShare}
              aria-label={`Partager ${doc.title}`}
              title="Partager le lien privé"
              className="rounded-lg bg-white/95 p-2 text-gray-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white hover:text-teal-700"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Modifier ${doc.title}`}
              title="Modifier"
              className="rounded-lg bg-white/95 p-2 text-gray-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white hover:text-teal-700"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label={`Supprimer ${doc.title}`}
              title="Supprimer"
              className="rounded-lg bg-white/95 p-2 text-red-600 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
