import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Newspaper } from "lucide-react";
import { getNews } from "../../api/news";

function TickerItems({ articles, duplicate = false }) {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {articles.map((article) => (
        <Link
          key={`${article.id}-${duplicate ? "copy" : "main"}`}
          to={`/actualites/article?url=${encodeURIComponent(article.url)}`}
          state={{ article }}
          tabIndex={duplicate ? -1 : undefined}
          aria-hidden={duplicate || undefined}
          className="inline-flex max-w-[min(80vw,28rem)] items-center gap-2 whitespace-nowrap text-sm text-gray-700 transition-colors hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
          <span className="truncate">{article.title}</span>
          <span className="shrink-0 text-[11px] font-medium text-teal-700/70 dark:text-teal-300/70">
            {article.source}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function NewsTicker() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getNews({ images: 0 });
        if (active) setArticles((res.data.articles || []).slice(0, 12));
      } catch {
        // Le fil reste masqué si les flux sont indisponibles.
      }
    };
    load();
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (articles.length === 0) return null;

  return (
    <section
      className="full-bleed border-y border-teal-100 bg-teal-50/80 dark:border-slate-800 dark:bg-slate-900/80"
      aria-label={t("news.tickerLabel")}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <span className="flex shrink-0 items-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
          <Newspaper className="h-4 w-4" />
          <span className="hidden sm:inline">{t("nav.news")}</span>
        </span>
        <div className="news-ticker relative min-w-0 flex-1 overflow-hidden py-2.5">
          <div className="news-ticker-track flex w-max items-center">
            <TickerItems articles={articles} />
            <TickerItems articles={articles} duplicate />
          </div>
        </div>
      </div>
    </section>
  );
}
