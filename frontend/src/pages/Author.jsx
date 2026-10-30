import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  const [author, setAuthor] = useState(null);
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [followingBusy, setFollowingBusy] = useState(false);

  useSeo({
    title: author ? `${author.display_name} — Auteur` : "Auteur",
    description: author
      ? `Découvrez les ${author.document_count} document${author.document_count > 1 ? "s" : ""} public${author.document_count > 1 ? "s" : ""} publiés par ${author.display_name}.`
      : "Découvrez les publications d'un auteur de la bibliothèque.",
    url: `${window.location.origin}/authors/${id}`
  });

  useEffect(() => {
    setLoading(true);
    setAuthor(null);
    getAuthor(id)
      .then((res) => setAuthor(res.data.author))
      .catch((err) => {
        toast.error(err.response?.data?.error?.message || "Auteur introuvable");
      })
      .finally(() => setLoading(false));
  }, [id]);

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
      toast.error("Vérifiez votre email pour suivre cet auteur");
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
      toast.success(res.data.following ? "Vous suivez cet auteur" : "Vous ne suivez plus cet auteur");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible de suivre cet auteur");
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
    return <EmptyState message="Auteur introuvable" icon={FileText} />;
  }

  return (
    <div>
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-600 sm:h-32" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-teal-50 text-2xl font-bold text-teal-700 shadow-sm sm:h-24 sm:w-24 sm:text-3xl">
                {(author.display_name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">{author.display_name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 sm:text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  Membre depuis {formatDate(author.created_at)}
                </p>
              </div>
            </div>

            {author.is_self ? (
              <Link to="/profile" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto">
                Mon profil
              </Link>
            ) : user ? (
              <button
                onClick={follow}
                disabled={followingBusy || !user.email_verified}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
                  author.is_following
                    ? "border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
                    : "bg-teal-700 text-white hover:bg-teal-800"
                }`}
              >
                {author.is_following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {author.is_following ? "Abonné" : "Suivre"}
              </button>
            ) : (
              <Link to="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 sm:w-auto">
                <UserPlus className="h-4 w-4" />
                Se connecter pour suivre
              </Link>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-gray-600">
              <BookOpen className="h-4 w-4 text-teal-700" />
              <strong className="text-gray-900">{author.document_count}</strong> document{author.document_count > 1 ? "s" : ""} public{author.document_count > 1 ? "s" : ""}
            </span>
            <span className="text-gray-600">
              <strong className="text-gray-900">{author.follower_count}</strong> abonné{author.follower_count > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </section>

      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Publications</h2>
        <span className="text-sm text-gray-500">{total} document{total > 1 ? "s" : ""}</span>
      </div>

      {docsLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : docs.length === 0 ? (
        <EmptyState message="Cet auteur n'a publié aucun document public" icon={FileText} />
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
