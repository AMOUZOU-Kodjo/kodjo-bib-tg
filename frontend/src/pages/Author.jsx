import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { BookOpen, Calendar, FileText, UserCheck, UserPlus } from "lucide-react";
import { getAuthor, getAuthorDocuments, toggleFollow } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { DocumentCard } from "../components/documents/DocumentCard";
import { EmptyState, Pagination, Spinner } from "../components/ui";
import { formatDate } from "../utils/format";
import { DOCUMENTS_PER_PAGE } from "../utils/pagination";
import useSeo from "../hooks/useSeo";

export default function Author() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [author, setAuthor] = useState(null);
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [followingBusy, setFollowingBusy] = useState(false);

  useSeo({
    title: author ? t("author.seoTitle", { name: author.display_name }) : "Author",
    description: author ? t("author.seoDesc", { name: author.display_name }) : "",
    url: `${window.location.origin}/authors/${id}`
  });

  useEffect(() => {
    setLoading(true);
    setAuthor(null);
    getAuthor(id)
      .then((res) => setAuthor(res.data.author))
      .catch((err) => {
        toast.error(err.response?.data?.error?.message || t("author.notFoundToast"));
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    let active = true;
    setDocsLoading(true);
    getAuthorDocuments(id, { page, limit: DOCUMENTS_PER_PAGE })
      .then((res) => {
        if (!active) return;
        setDocs(res.data.documents || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {
        if (active) setDocs([]);
      })
      .finally(() => {
        if (active) setDocsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, page]);

  const follow = async () => {
    if (!user) return;
    if (!user.email_verified) {
      toast.error(t("author.verifyToFollow"));
      return;
    }
    setFollowingBusy(true);
    try {
      const res = await toggleFollow(id);
      setAuthor((current) => ({
        ...current,
        is_following: res.data.following,
        follower_count: res.data.follower_count
      }));
      toast.success(res.data.following ? t("author.followed") : t("author.unfollowed"));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("author.followError"));
    } finally {
      setFollowingBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / DOCUMENTS_PER_PAGE));
  const goToPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }
  if (!author) {
    return <EmptyState message={t("author.notFound")} icon={FileText} />;
  }

  return (
    <div>
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="h-24 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-600 sm:h-32" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-teal-50 dark:bg-teal-950/40 text-2xl font-bold text-teal-700 dark:text-teal-300 shadow-sm sm:h-24 sm:w-24 sm:text-3xl">
                {(author.display_name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl">{author.display_name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 sm:text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("author.memberSince", { date: formatDate(author.created_at) })}
                </p>
              </div>
            </div>

            {author.is_self ? (
              <Link to="/profile" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900 sm:w-auto">
                {t("author.myProfile")}
              </Link>
            ) : user ? (
              <button
                onClick={follow}
                disabled={followingBusy || !user.email_verified}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
                  author.is_following
                    ? "border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/40"
                    : "bg-teal-700 text-white hover:bg-teal-800"
                }`}
              >
                {author.is_following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {author.is_following ? t("author.following") : t("author.follow")}
              </button>
            ) : (
              <Link to="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 sm:w-auto">
                <UserPlus className="h-4 w-4" />
                {t("author.loginToFollow")}
              </Link>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 dark:border-slate-700 pt-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
              <BookOpen className="h-4 w-4 text-teal-700 dark:text-teal-300" />
              <strong className="text-gray-900 dark:text-slate-100">{author.document_count}</strong> {t(author.document_count > 1 ? "author.docCount_plural" : "author.docCount")}
            </span>
            <span className="text-gray-600 dark:text-slate-400">
              <strong className="text-gray-900 dark:text-slate-100">{author.follower_count}</strong> {t(author.follower_count > 1 ? "author.followers_plural" : "author.followers")}
            </span>
          </div>
        </div>
      </section>

      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 sm:text-xl">{t("author.publications")}</h2>
        <span className="text-sm text-gray-500 dark:text-slate-400">{total}</span>
      </div>

      {docsLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : docs.length === 0 ? (
        <EmptyState message={t("author.noPublicDocs")} icon={FileText} />
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5">
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-7">
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </div>
      )}
    </div>
  );
}
