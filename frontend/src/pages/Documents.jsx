import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDocuments, getDocumentCategories } from "../api/documents";
import { DocumentCard } from "../components/documents/DocumentCard";
import { Search, FileText } from "lucide-react";
import { Input, Spinner, EmptyState } from "../components/ui";
import { formatCategoryName } from "../utils/document";

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const pageParam = Number(searchParams.get("page")) || 1;
  const qParam = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort");
  const validSorts = ["recent", "likes", "views", "downloads"];

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(qParam);
  const [sort, setSort] = useState(validSorts.includes(sortParam) ? sortParam : "recent");
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pageParam);
  const limit = 12;

  useEffect(() => {
    getDocumentCategories()
      .then((res) => {
        setCategories(res.data.categories || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {
        setCategories([]);
        setTotal(0);
      });
  }, []);

  useEffect(() => {
    setSearch(qParam);
  }, [qParam]);

  useEffect(() => {
    setPage(pageParam);
  }, [pageParam]);

  useEffect(() => {
    setSort(validSorts.includes(sortParam) ? sortParam : "recent");
  }, [sortParam]);

  useEffect(() => {
    setLoading(true);
    getDocuments({ q: search, category: categoryParam || undefined, sort, page, limit })
      .then((res) => {
        setDocs(res.data.documents || []);
        if (res.data.total !== undefined) setTotal(res.data.total);
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [search, categoryParam, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set("q", search.trim());
    else next.delete("q");
    next.set("page", "1");
    setSearchParams(next);
    setPage(1);
  };

  const setCategory = (cat) => {
    const next = new URLSearchParams(searchParams);
    if (cat) next.set("category", cat);
    else next.delete("category");
    next.set("page", "1");
    setSearchParams(next);
    setPage(1);
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const featured = useMemo(() => docs.slice(0, 3), [docs]);
  const list = useMemo(() => (docs.length > 3 ? docs.slice(3) : []), [docs]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showPagination = totalPages > 1;

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Bibliothèque numérique</h1>
        <p className="text-sm text-gray-600 mb-4 sm:text-base">{total} livre{total > 1 ? "s" : ""} dans la bibliothèque</p>
        <form onSubmit={handleSearchSubmit} className="mb-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Chercher"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>
        <div className="text-xs text-gray-600 sm:text-sm">
          {total} livres · {categories.length} catégories
        </div>
      </section>

      <nav className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-1 sm:px-1">
        <button
          onClick={() => setCategory("")}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${!categoryParam ? "bg-teal-700 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Tous {total}
        </button>
        {categories.map((c) => (
          <button
            key={c.category}
            onClick={() => setCategory(c.category)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${categoryParam === c.category ? "bg-teal-700 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {formatCategoryName(c.category)} {c.count}
          </button>
        ))}
      </nav>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">À la une</h2>
        <select
          value={sort}
          onChange={(e) => {
            const nextSort = e.target.value;
            setSort(nextSort);
            const next = new URLSearchParams(searchParams);
            if (nextSort === "recent") next.delete("sort");
            else next.set("sort", nextSort);
            next.set("page", "1");
            setSearchParams(next);
          }}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 sm:w-auto"
        >
          <option value="recent">Plus récents</option>
          <option value="likes">Plus aimés</option>
          <option value="views">Plus vus</option>
          <option value="downloads">Plus téléchargés</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState message="Aucun document trouvé" icon={FileText} />
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          )}

          {list.length > 0 && (
            <section className="mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                {list.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          )}

          {showPagination && (
            <nav className="flex items-center justify-start gap-1 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                aria-label="Page précédente"
                className="shrink-0 px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed sm:px-3"
              >
                « <span className="hidden sm:inline">Précédent</span><span className="sm:hidden">Préc.</span>
              </button>
              {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 10) p = i + 1;
                else if (page <= 5) p = i + 1;
                else if (page >= totalPages - 4) p = totalPages - 9 + i;
                else p = page - 4 + i;
                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`h-8 w-8 shrink-0 rounded-lg text-sm font-medium sm:h-9 sm:w-9 ${p === page ? "bg-teal-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 10 && page < totalPages - 4 && (
                <>
                  <span className="shrink-0 px-2 text-gray-400">...</span>
                  <button onClick={() => goToPage(totalPages)} className="h-8 w-8 shrink-0 rounded-lg text-sm text-gray-700 hover:bg-gray-100 sm:h-9 sm:w-9">{totalPages}</button>
                </>
              )}
              <button
                onClick={() => goToPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                aria-label="Page suivante"
                className="shrink-0 px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed sm:px-3"
              >
                <span className="hidden sm:inline">Suivant</span><span className="sm:hidden">Suiv.</span> »
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
