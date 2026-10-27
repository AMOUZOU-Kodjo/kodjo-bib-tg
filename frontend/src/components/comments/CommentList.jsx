import { Trash2, MessageSquare } from "lucide-react";
import { formatDate } from "../../utils/format";

export default function CommentList({ comments, currentUserId, isOwner, onDelete, deletingId }) {
  if (comments.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-2">
        <MessageSquare className="w-8 h-8 text-gray-300" />
        <p className="text-sm">Aucun commentaire pour le moment. Soyez le premier !</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => {
        const canDelete = currentUserId === comment.user_id || isOwner;
        return (
          <li key={comment.id} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-sm font-semibold shrink-0">
              {(comment.author_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate">{comment.author_name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(comment.created_at)}</span>
                </div>
                {canDelete && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
                    aria-label="Supprimer le commentaire"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words mt-1">
                {comment.content}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
