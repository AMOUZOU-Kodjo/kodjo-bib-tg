import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { MessageSquare, ChevronDown } from "lucide-react";
import { getComments, addComment, deleteComment } from "../../api/comments";
import { useAuth } from "../../context/AuthContext";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";
import { Spinner } from "../ui";
import ReportModal from "../reports/ReportModal";

const PAGE_SIZE = 10;

export default function CommentsSection({ documentId, initialCount = 0, isOwner = false }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(initialCount);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [reportComment, setReportComment] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setComments([]);
    setPage(1);
    setTotal(initialCount);
    getComments(documentId, { page: 1, limit: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setComments(res.data.comments || []);
        if (typeof res.data.total === "number") setTotal(res.data.total);
      })
      .catch(() => {
        if (active) toast.error(t("comments.loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [documentId, initialCount, t]);

  const submit = async (content) => {
    try {
      const res = await addComment(documentId, { content });
      setComments((prev) => [res.data.comment, ...prev]);
      setTotal((n) => n + 1);
      toast.success(t("comments.published"));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("comments.publishError"));
      throw err;
    }
  };

  const remove = async (commentId) => {
    if (!window.confirm(t("comments.deleteConfirm"))) return;
    setDeletingId(commentId);
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((n) => Math.max(0, n - 1));
      toast.success(t("comments.deleted"));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("comments.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await getComments(documentId, { page: nextPage, limit: PAGE_SIZE });
      setComments((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...(res.data.comments || []).filter((c) => !seen.has(c.id))];
      });
      if (typeof res.data.total === "number") setTotal(res.data.total);
      setPage(nextPage);
    } catch (err) {
      toast.error(t("comments.loadMoreError"));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-teal-700 dark:text-teal-300" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 sm:text-xl">{t("comments.title")}</h2>
        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-xs font-medium text-gray-600 dark:text-slate-400">{total}</span>
      </div>

      {user?.email_verified ? (
        <CommentForm onSubmit={submit} />
      ) : (
        <div className="mb-6 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-4 text-sm text-gray-600 dark:text-slate-400">
          {user ? (
            <>
              {t("comments.verifyToComment")}{" "}
              <Link to="/verify-email" state={{ email: user.email }} className="font-medium text-teal-700 dark:text-teal-300 hover:underline">
                {t("comments.verifyEmail")}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" state={{ from: location }} className="font-medium text-teal-700 dark:text-teal-300 hover:underline">
                {t("comments.login")}
              </Link>{" "}
              {t("comments.toComment")}
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      ) : (
        <>
          <CommentList
            comments={comments}
            currentUserId={user?.id}
            isOwner={isOwner}
            onDelete={remove}
            deletingId={deletingId}
            onReport={setReportComment}
          />
          {comments.length < total && (
            <div className="text-center mt-5">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors disabled:opacity-50"
              >
                <ChevronDown className="w-4 h-4" />
                {loadingMore ? t("comments.loading") : t("comments.loadMore")}
              </button>
            </div>
          )}
        </>
      )}

      {reportComment && (
        <ReportModal
          commentId={reportComment.id}
          targetLabel={reportComment.content}
          onClose={() => setReportComment(null)}
        />
      )}
    </section>
  );
}
