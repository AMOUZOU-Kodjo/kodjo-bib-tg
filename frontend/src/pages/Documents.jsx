import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getDocuments, getDocumentCategories } from "../api/documents";
import { enhanceSearch } from "../api/ai";
import { DocumentCard } from "../components/documents/DocumentCard";
import { Search, FileText, Tag, Sparkles, Loader2 } from "lucide-react";
import { Input, SkeletonCard, EmptyState, Pagination, Reveal } from "../components/ui";
import { formatCategoryName } from "../utils/document";
import { findCategoryByName, findCategoryBySlug, findCategoryParent } from "../utils/categories";
import useCategories from "../hooks/useCategories";
import useSeo from "../hooks/useSeo";
import { useLiveVersion } from "../context/LiveUpdatesContext";

const CATALOG_DOCUMENTS_PER_PAGE = 12;

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
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
  const { categories } = useCategories();
  const [tagOptions, setTagOptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [page, setPage] = useState(pageParam);
  const [enhancing, setEnhancing] = useState(false);
  const documentsVersion = useLiveVersion(["documents", "categories"]);

  useSeo({
    title: t("documents.title"),
    description: t("documents.seoDesc", { count: total }),
    url: `${window.location.origin}/documents`
  });

  useEffect(() => {
    getDocumentCategories()
      .then((res) => {
        setTagOptions(res.data.tags || []);
        setCatalogTotal(res.data.total || 0);
      })
      .catch(() => {
        setTagOptions([]);
        setCatalogTotal(0);
      });
  }, [documentsVersion]);

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
    getDocuments({ q: qParam || undefined, category: categoryParam || undefined, tag: tagParam || undefined, sort, page, limit: CATALOG_DOCUMENTS_PER_PAGE })
      .then((res) => {
        setDocs(res.data.documents || []);
        if (res.data.total !== undefined) setTotal(res.data.total);
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [qParam, categoryParam, tagParam, sort, page, documentsVersion]);

  const applySearchParam = (next) => {
    const trimmed = search.trim();
    if (trimmed) next.set("q", trimmed);
    else next.delete("q");
    return next;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = applySearchParam(new URLSearchParams(searchParams));
    next.set("page", "1");
    setSearchParams(next);
    setPage(1);
  };

  const handleEnhanceSearch = async () => {
    if (!search.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await enhanceSearch({ q: search.trim() });
      const improved = res.data?.query?.trim();
      if (improved) {
        setSearch(improved);
        const next = new URLSearchParams(searchParams);
        next.set("q", improved);
        next.set("page", "1");
        setSearchParams(next);
        setPage(1);
        toast.success(t("documents.aiImproved"));
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("documents.aiFailed"));
    } finally {
      setEnhancing(false);
    }
  };

  const setCategory = (cat) => {
    const next = applySearchParam(new URLSearchParams(searchParams));
    if (cat) next.set("category", cat);
    else next.delete("category");
    next.set("page", "1");
    setSearchParams(next);
    setPage(1);
  };

  const setTag = (tag) => {
    const next = applySearchParam(new URLSearchParams(searchParams));
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

  const featured = useMemo(() => (page === 1 ? docs.slice(0, 6) : []), [docs, page]);
  const list = useMemo(() => (page === 1 ? docs.slice(6) : docs), [docs, page]);
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_DOCUMENTS_PER_PAGE));
  const selectedCategory = useMemo(
    () => findCategoryBySlug(categories, categoryParam) || findCategoryByName(categories, categoryParam),
    [categories, categoryParam]
  );
  const activeRoot = useMemo(
    () => (selectedCategory ? findCategoryParent(categories, selectedCategory.id) || selectedCategory : null),
    [categories, selectedCategory]
  );

  const sortOptions = [
    { value: "recent", label: t("documents.sortRecent") },
    { value: "views", label: t("documents.sortViews") },
    { value: "downloads", label: t("documents.sortDownloads") }
  ];

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">{t("documents.title")}</h1>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 sm:text-base">{t("documents.count", { count: total })}</p>
        <form onSubmit={handleSearchSubmit} className="mb-4 flex max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder={t("documents.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            type="button"
            onClick={handleEnhanceSearch}
            disabled={!search.trim() || enhancing}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm font-medium text-teal-800 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-200 dark:hover:bg-teal-950/50"
            title={t("documents.aiImprove")}
          >
            {enhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="hidden sm:inline">IA</span>
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const next = applySearchParam(new URLSearchParams(searchParams));
                next.set("sort", opt.value);
                next.set("page", "1");
                setSearchParams(next);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${sort === opt.value ? "bg-teal-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <nav className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-1 sm:px-1">
        <button
          onClick={() => setCategory("")}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${!categoryParam ? "bg-teal-700 text-white shadow-sm" : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"}`}
        >
          {t("documents.all")} {catalogTotal || total}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.slug)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${activeRoot?.id === c.id ? "bg-teal-700 text-white shadow-sm" : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"}`}
          >
            {formatCategoryName(c.name, t)} {c.total_count ?? c.document_count ?? 0}
          </button>
        ))}
      </nav>

      {activeRoot?.children?.length > 0 && (
        <nav className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-1 sm:px-1">
          <button
            onClick={() => setCategory(activeRoot.slug)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${selectedCategory?.id === activeRoot.id ? "bg-teal-50 text-teal-800 ring-1 ring-teal-300 dark:bg-teal-950/40 dark:text-teal-200 dark:ring-teal-800" : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"}`}
          >
            {t("documents.all")} · {formatCategoryName(activeRoot.name, t)}
          </button>
          {activeRoot.children.map((child) => (
            <button
              key={child.id}
              onClick={() => setCategory(child.slug)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${selectedCategory?.id === child.id ? "bg-teal-700 text-white" : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"}`}
            >
              {formatCategoryName(child.name, t)} {child.document_count ?? 0}
            </button>
          ))}
        </nav>
      )}
      {!activeRoot?.children?.length && <div className="mb-5" />}

      {tagOptions.length > 0 && (
        <nav className="-mx-4 mb-8 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:-mx-1 sm:px-1">
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500 dark:text-slate-400">
            <Tag className="h-3.5 w-3.5" />
            {t("documents.keywords")}
          </span>
          {tagParam && (
            <button
              onClick={() => setTag("")}
              className="whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 text-xs font-medium text-teal-800 dark:text-teal-200"
            >
              #{formatCategoryName(tagParam, t)} ×
            </button>
          )}
          {tagOptions
            .filter((option) => option.tag !== tagParam)
            .map((option) => (
              <button
                key={option.tag}
                onClick={() => setTag(option.tag)}
                className="whitespace-nowrap rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 transition-all hover:bg-gray-200 dark:hover:bg-slate-700"
                title={t("documents.allKeywords")}
              >
                #{formatCategoryName(option.tag, t)} {option.count}
              </button>
            ))}
        </nav>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState icon={FileText} title={t("documents.none")} description={t("documents.noneDesc")} />
      ) : (
        <>
          {page === 1 && featured.length > 0 && (
            <Reveal>
              <section className="mb-10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl">{t("documents.featured")}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
                  {featured.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
                </div>
              </section>
            </Reveal>
          )}

          {list.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl">{t("documents.results")}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
                {list.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
              </div>
            </section>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}
