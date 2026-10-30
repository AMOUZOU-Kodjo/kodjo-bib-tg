import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDocuments, getDocumentCategories } from "../api/documents";
import { DocumentCard } from "../components/documents/DocumentCard";
import { Search, FileText, Tag } from "lucide-react";
import { Input, Spinner, EmptyState, Pagination } from "../components/ui";
import { formatCategoryName } from "../utils/document";
import { DOCUMENTS_PER_PAGE } from "../utils/pagination";
import useSeo from "../hooks/useSeo";

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const tagParam = searchParams.get("tag") || "";
  const pageParam = Number(searchParams.get("page")) || 1;
  const qParam = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort");
  const validSorts = ["recent", "likes", "views", "downloads"];

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(qParam);
  const [sort, setSort] = useState(validSorts.includes(sortParam) ? sortParam : "recent");
  const [categories, setCategories] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pageParam);

  useSeo({
    title: "Bibliothèque numérique",
    description: `${total} documents disponibles à consulter et télécharger gratuitement. Explorez les catégories et les nouveautés de la bibliothèque.`,
    url: `${window.location.origin}/documents`
  });

  useEffect(() => {
    getDocumentCategories()
      .then((res) => {
        setCategories(res.data.categories || []);
        setTagOptions(res.data.tags || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {
        setCategories([]);
        setTagOptions([]);
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
    getDocuments({ q: search, category: categoryParam || undefined, tag: tagParam || undefined, sort, page, limit: DOCUMENTS_PER_PAGE })
      .then((res) => {
        setDocs(res.data.documents || []);
        if (res.data.total !== undefined) setTotal(res.data.total);
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [search, categoryParam, tagParam, sort, page]);

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

  const setTag = (tag) => {
    const next = new URLSearchParams(searchParams);
    if (tag) next.set("tag", tag);
    else next.delete("tag");
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

  const totalPages = Math.max(1, Math.ceil(total / DOCUMENTS_PER_PAGE));

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Bibliothèque numérique</h1>
        <p className="text-sm text-gray-600 mb-4 sm:text-base">{total} livre{total > 1 ? "s" : ""} dans la bibliothèque</p>
        <form onSubmit={handleSearchSubmit} className="mb-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher un titre, un auteur, un mot-clé..."
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

      {tagOptions.length > 0 && (
        <nav className="-mx-4 mb-8 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:-mx-1 sm:px-1">
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500">
            <Tag className="h-3.5 w-3.5" />
            Mots-clés
          </span>
          {tagParam && (
            <button
              onClick={() => setTag("")}
              className="whitespace-nowrap rounded-full bg-teal-700 px-3 py-1.5 text-xs font-medium text-white"
            >
              #{tagParam} ×
            </button>
          )}
          {tagOptions
            .filter((item) => item.tag !== tagParam)
            .map((item) => (
              <button
                key={item.tag}
                onClick={() => setTag(item.tag)}
                className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                #{item.tag} {item.count}
              </button>
            ))}
        </nav>
      )}

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
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          )}

          {list.length > 0 && (
            <section className="mb-10">
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                {list.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}
