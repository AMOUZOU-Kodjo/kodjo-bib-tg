import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, CalendarDays, ExternalLink, FlaskConical, Globe2, Newspaper, RefreshCw, Users } from "lucide-react";
import { getNews, getScienceNews, getWorldNews, getResearchNews } from "../api/news";
import { Pagination } from "../components/ui";
import useSeo from "../hooks/useSeo";
import { Reveal, SkeletonCard } from "../components/ui";

const CATEGORY_SLUGS = [
  "all",
  "litterature",
  "sciences",
  "education",
  "art",
  "societe",
  "politique",
  "sante",
  "sport",
  "divertissement",
  "philosophie",
  "histoire"
];

const PAGE_SIZE = 12;

function formatNewsDate(value, locale = "fr") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function NewsCard({ article, isFavorite, onToggleFavorite }) {
  const { t, i18n } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(article.image) && !imageFailed;
  const articlePath = `/actualites/article?url=${encodeURIComponent(article.url)}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <Link to={articlePath} state={{ article }} className="block aspect-[16/9] overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">
        {showImage ? (
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Newspaper className="h-10 w-10 text-white/70" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-teal-50 px-2.5 py-1 font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            {article.source}
          </span>
          <button
            type="button"
            onClick={() => onToggleFavorite(article.url)}
            aria-label={isFavorite ? t("news.removeFavorite") : t("news.addFavorite")}
            className={`ml-auto inline-flex items-center justify-center rounded-full p-1 text-sm transition-colors ${isFavorite ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}`}
          >
            {isFavorite ? "★" : "☆"}
          </button>
          {article.publishedAt && (
            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatNewsDate(article.publishedAt, i18n.resolvedLanguage)}
            </span>
          )}
        </div>
        <h2 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 dark:text-slate-100">
          <Link to={articlePath} state={{ article }} className="hover:text-teal-700 dark:hover:text-teal-300">
            {article.title}
          </Link>
        </h2>
        {article.description && (
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
            {article.description}
          </p>
        )}
        <Link to={articlePath} state={{ article }} className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-300">
          {t("news.readMore")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function PublicationCard({ publication }) {
  const { t, i18n } = useTranslation();
  const authors = publication.authors?.filter(Boolean) || [];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          {t("news.publicationBadge")}
        </span>
        {publication.publishedAt && (
          <span className="inline-flex items-center gap-1 text-gray-500 dark:text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatNewsDate(publication.publishedAt, i18n.resolvedLanguage)}
          </span>
        )}
      </div>
      <h3 className="mb-2 line-clamp-3 text-base font-semibold text-gray-900 dark:text-slate-100">
        <a href={publication.url} target="_blank" rel="noopener noreferrer" className="hover:text-teal-700 dark:hover:text-teal-300">
          {publication.title}
        </a>
      </h3>
      {authors.length > 0 && (
        <p className="mb-2 inline-flex items-start gap-1.5 text-xs text-gray-600 dark:text-slate-400">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{authors.join(", ")}</span>
        </p>
      )}
      <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span className="line-clamp-1">{publication.source}</span>
      </p>
      {publication.description && (
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
          {publication.description}
        </p>
      )}
      <a
        href={publication.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
      >
        {t("news.openPublication")}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}

function categoryLabel(t, slug) {
  if (slug === "all") return t("news.allCategories");
  return t(`news.categories.${slug}`, { defaultValue: slug });
}

export default function News() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const selectedCategory = searchParams.get("category") || "all";
  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("archivia_news_favorites") || "[]"));
    } catch {
      return new Set();
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedSource, setSelectedSource] = useState("all");

  useSeo({
    title: t("news.seoTitle"),
    description: t("news.seoDesc"),
    url: `${window.location.origin}/actualites${selectedCategory !== "all" ? `?category=${selectedCategory}` : ""}`
  });

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const params = refresh ? { refresh: 1 } : undefined;
      const [togoRes, scienceRes, worldRes, researchRes] = await Promise.all([
        getNews(params),
        getScienceNews(params),
        getWorldNews(params).catch(() => ({ data: { articles: [], sources: [] } })),
        getResearchNews(params).catch(() => ({ data: { articles: [], sources: [] } }))
      ]);
      const togoArticles = togoRes.data.articles || [];
      const scienceArticles = scienceRes.data.articles || [];
      const publications = scienceRes.data.publications || [];
      const worldArticles = worldRes.data.articles || [];
      const researchArticles = researchRes.data.articles || [];
      const merged = [...togoArticles, ...scienceArticles, ...publications, ...worldArticles, ...researchArticles];
      const seen = new Set();
      const unique = merged.filter((item) => {
        const key = item.id || item.url;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

      setArticles(unique);
      const sourceMap = new Map();
      for (const src of [...(togoRes.data.sources || []), ...(scienceRes.data.sources || []), ...(worldRes.data.sources || []), ...(researchRes.data.sources || [])]) {
        sourceMap.set(src.name, src);
      }
      setSources(Array.from(sourceMap.values()));
      setUpdatedAt(togoRes.data.updatedAt || scienceRes.data.updatedAt || null);
      setPage(1);
    } catch {
      setError(t("news.error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = articles;
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory);
    }
    if (selectedSource !== "all") {
      result = result.filter((item) => item.source === selectedSource);
    }
    if (showFavoritesOnly) {
      result = result.filter((item) => favorites.has(item.url));
    }
    return result;
  }, [articles, selectedCategory, selectedSource, showFavoritesOnly, favorites]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const counts = useMemo(() => {
    const result = { all: articles.length };
    for (const slug of CATEGORY_SLUGS) {
      if (slug === "all") continue;
      result[slug] = articles.filter((item) => item.category === slug).length;
    }
    return result;
  }, [articles]);

  const changeCategory = (slug) => {
    if (slug === "all") setSearchParams({}, { replace: true });
    else setSearchParams({ category: slug }, { replace: true });
    setPage(1);
  };

  const toggleFavorite = (url) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      try {
        localStorage.setItem("archivia_news_favorites", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            <Globe2 className="h-3.5 w-3.5" />
            {t("news.badge")}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">{t("news.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-slate-400 sm:text-base">{t("news.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {t("news.refresh")}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_SLUGS.map((slug) => {
          const count = counts[slug] || 0;
          const active = selectedCategory === slug;
          if (slug !== "all" && count === 0) return null;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => changeCategory(slug)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-teal-700 bg-teal-700 text-white dark:border-teal-500 dark:bg-teal-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-500 dark:hover:text-teal-300"
              }`}
            >
              {categoryLabel(t, slug)}
              {slug !== "all" && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? "bg-white/20" : "bg-gray-100 dark:bg-slate-700"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={selectedSource}
          onChange={(e) => { setSelectedSource(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">{t("news.allSources")}</option>
          {sources.map((source) => (
            <option key={source.name} value={source.name}>{source.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => { setShowFavoritesOnly((v) => !v); setPage(1); }}
          aria-pressed={showFavoritesOnly}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            showFavoritesOnly
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-gray-200 bg-white text-gray-700 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          ★ {t("news.favoritesOnly")}
        </button>
      </div>

      {updatedAt && (
        <p className="mb-6 text-xs text-gray-500 dark:text-slate-400">
          {t("news.updated", { date: formatNewsDate(updatedAt, i18n.resolvedLanguage) })}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          {t("news.empty")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((item, index) => (
              <Reveal key={item.id || item.url} delay={Math.min(index * 40, 240)}>
                {item.kind === "publication" || item.external ? (
                  <PublicationCard publication={item} />
                ) : (
                  <NewsCard article={item} isFavorite={favorites.has(item.url)} onToggleFavorite={toggleFavorite} />
                )}
              </Reveal>
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {sources.length > 0 && (
        <div className="mt-10 border-t border-gray-200 pt-6 dark:border-slate-700">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{t("news.sources")}</p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <a key={source.name} href={source.site} target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-teal-500 dark:hover:text-teal-300">
                {source.name}
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-slate-500">{t("news.disclaimer")}</p>
        </div>
      )}
    </div>
  );
}
