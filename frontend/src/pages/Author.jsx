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
import { useLiveVersion } from "../context/LiveUpdatesContext";

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
  const liveVersion = useLiveVersion(["documents", "users"]);

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
  }, [id, t, liveVersion]);

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
  }, [id, page, liveVersion]);

  const totalPages = Math.max(1, Math.ceil(total / DOCUMENTS_PER_PAGE));

  const goToPage = (nextPage) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  };

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

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }
  if (!author) {
    return <EmptyState message={t("author.notFound")} icon={FileText} />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="h-28 bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 sm:h-36" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-teal-50 text-3xl font-bold text-teal-700 shadow-sm dark:border-slate-800 dark:bg-teal-950/40 dark:text-teal-300 sm:h-28 sm:w-28 sm:text-4xl">
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt={t("author.profilePhotoAlt")} className="h-full w-full object-cover" />
                ) : (
                  (author.display_name || "?").charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                  {t("author.profileLabel", { defaultValue: "Auteur" })}
                </p>
                <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">
                  {author.display_name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                  <Calendar className="h-4 w-4" />
                  {t("author.memberSince", { date: formatDate(author.created_at) })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                    <BookOpen className="h-3.5 w-3.5" />
                    {author.document_count} {t(author.document_count > 1 ? "author.docCount_plural" : "author.docCount")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-slate-700 dark:text-slate-200">
                    {author.follower_count} {t(author.follower_count > 1 ? "author.followers_plural" : "author.followers")}
                  </span>
                </div>
              </div>
            </div>

            {author.is_self ? (
              <Link to="/profile" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto">
                {t("author.myProfile")}
              </Link>
            ) : user ? (
              <button
                onClick={follow}
                disabled={followingBusy || !user.email_verified}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
                  author.is_following
                    ? "border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200 dark:hover:bg-teal-900/40"
                    : "bg-teal-700 text-white hover:bg-teal-800"
                }`}
              >
                {author.is_following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {author.is_following ? t("author.following") : t("author.follow")}
              </button>
            ) : (
              <Link to="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 sm:w-auto">
                <UserPlus className="h-4 w-4" />
                {t("author.loginToFollow")}
              </Link>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-900/60">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{t("author.publications")}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">{total}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-900/60">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{t(author.document_count > 1 ? "author.docCount_plural" : "author.docCount")}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">{author.document_count}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-900/60">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{t(author.follower_count > 1 ? "author.followers_plural" : "author.followers")}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">{author.follower_count}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 sm:text-xl">{t("author.publications")}</h2>
        <span className="text-sm text-gray-500 dark:text-slate-400">{total}</span>
      </div>

      {docsLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : docs.length === 0 ? (
        <EmptyState message={t("author.noPublicDocs")} icon={FileText} />
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
