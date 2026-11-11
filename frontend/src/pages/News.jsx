import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, ExternalLink, Globe2, Newspaper, RefreshCw } from "lucide-react";
import { getNews } from "../api/news";
import useSeo from "../hooks/useSeo";
import { Reveal, SkeletonCard } from "../components/ui";

function formatNewsDate(value, locale = "fr") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function NewsCard({ article }) {
  const { t, i18n } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(article.image) && !imageFailed;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <a href={article.url} target="_blank" rel="noopener noreferrer" className="block aspect-[16/9] overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">
        {showImage ? (
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Newspaper className="h-10 w-10 text-white/70" />
          </div>
        )}
      </a>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-teal-50 px-2.5 py-1 font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            {article.source}
          </span>
          {article.publishedAt && (
            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatNewsDate(article.publishedAt, i18n.resolvedLanguage)}
            </span>
          )}
        </div>
        <h2 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 dark:text-slate-100">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-teal-700 dark:hover:text-teal-300">
            {article.title}
          </a>
        </h2>
        {article.description && (
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
            {article.description}
          </p>
        )}
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-300">
          {t("news.readMore")}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

export default function News() {
  const { t, i18n } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useSeo({
    title: t("news.seoTitle"),
    description: t("news.seoDesc"),
    url: `${window.location.origin}/actualites`
  });

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const res = await getNews(refresh ? { refresh: 1 } : undefined);
      setArticles(res.data.articles || []);
      setSources(res.data.sources || []);
      setUpdatedAt(res.data.updatedAt || null);
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
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          {t("news.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <Reveal key={article.id} delay={Math.min(index * 40, 240)}>
              <NewsCard article={article} />
            </Reveal>
          ))}
        </div>
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
