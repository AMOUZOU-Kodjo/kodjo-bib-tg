import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CalendarDays, Copy, ExternalLink, Loader2, MessageCircle, Newspaper } from "lucide-react";
import { getNewsArticle } from "../api/news";
import useSeo from "../hooks/useSeo";

function formatNewsDate(value, locale = "fr") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewsArticle() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const url = searchParams.get("url") || "";
  const preview = location.state?.article || null;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSeo({
    title: article?.title || preview?.title || t("news.seoTitle"),
    description: article?.description || preview?.description || t("news.seoDesc"),
    image: article?.image || preview?.image,
    url: `${window.location.origin}/actualites/article?url=${encodeURIComponent(url)}`
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!url) {
        setError(t("news.articleError"));
        setLoading(false);
        return;
      }
      try {
        const res = await getNewsArticle(url);
        if (!cancelled) setArticle(res.data.article);
      } catch {
        if (!cancelled) setError(t("news.articleError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [url, t]);

  const sourceUrl = article?.url || preview?.url || url;
  const sourceName = article?.source || preview?.source;
  const publishedAt = article?.publishedAt || preview?.publishedAt;
  const image = article?.image || preview?.image;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link to="/actualites" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-300">
        <ArrowLeft className="h-4 w-4" />
        {t("news.back")}
      </Link>

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-9 w-full animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-56 w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-700" />
          <div className="flex items-center justify-center py-10 text-gray-500 dark:text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t("news.articleLoading")}
          </div>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <p>{error}</p>
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-medium underline">
              {t("news.openSource")}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ) : article ? (
        <article className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-teal-50 px-2.5 py-1 font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              {sourceName}
            </span>
            {publishedAt && (
              <span className="inline-flex items-center gap-1 text-gray-500 dark:text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatNewsDate(publishedAt, i18n.resolvedLanguage)}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-slate-100 sm:text-3xl">
            {article.title}
          </h1>

          {image && (
            <img
              src={image}
              alt={article.title}
              className="mt-5 w-full rounded-2xl object-cover"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          )}

          {article.fallback && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              {t("news.fallbackNotice")}
            </div>
          )}

          <div
            className="news-article-content mt-6"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${article.title} - https://archivia.onrender.com/share/news?url=${encodeURIComponent(url)}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white hover:bg-[#1ebe5b]"
            >
              <MessageCircle className="h-4 w-4" />
              {t("news.shareWhatsApp")}
            </a>
            <button
              type="button"
              onClick={async () => {
                try { await navigator.clipboard.writeText(`https://archivia.onrender.com/share/news?url=${encodeURIComponent(url)}`); } catch {}
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Copy className="h-4 w-4" />
              {t("news.copyLink")}
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <Newspaper className="h-4 w-4" />
              {t("news.sourceNotice", { source: sourceName })}
            </p>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700">
              {t("news.openSource")}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </article>
      ) : null}
    </div>
  );
}
