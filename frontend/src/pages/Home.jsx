import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Upload, Search, ArrowRight, CheckCircle, Newspaper } from "lucide-react";
import heroImg from "../assets/hero.jpg";
import { getDocuments, getDocumentStats } from "../api/documents";
import { getNews } from "../api/news";
import { DocumentCard } from "../components/documents/DocumentCard";
import InstallBanner from "../components/layout/InstallBanner";
import NewsTicker from "../components/news/NewsTicker";
import useSeo from "../hooks/useSeo";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useAuth } from "../context/AuthContext";
import { useLiveVersion } from "../context/LiveUpdatesContext";
import { SkeletonCard, Reveal } from "../components/ui";

const HOME_DOCUMENTS_LIMIT = 18;

function formatDocumentCount(value) {
  const total = Number(value) || 0;
  if (total < 10) return String(total);
  return `${Math.floor(total / 10) * 10}+`;
}

function DocumentSection({ title, subtitle, docs, to = "/documents", loading = false, seeAll }) {
  if (!loading && !docs.length) return null;
  return (
    <section className="py-10 sm:py-12">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl md:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400 sm:text-base">{subtitle}</p>
        </div>
        <Link to={to} className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium text-teal-700 dark:text-teal-300 hover:underline sm:self-auto">
          {seeAll} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-6">
        {loading
          ? Array.from({ length: HOME_DOCUMENTS_LIMIT }).map((_, index) => <SkeletonCard key={index} />)
          : docs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { allowRegistrations } = useSiteSettings();
  const { user } = useAuth();
  const documentsVersion = useLiveVersion("documents");
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [docStats, setDocStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeNews, setHomeNews] = useState([]);

  useSeo({
    title: t("home.seoTitle"),
    description: t("home.seoDesc"),
    url: `${window.location.origin}/`
  });

  useEffect(() => {
    let active = true;
    getDocuments({ sort: "recent", limit: HOME_DOCUMENTS_LIMIT })
      .then((res) => {
        if (!active) return;
        setRecent(res.data.documents || []);
      })
      .catch(() => {
        if (!active) return;
        setRecent([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [documentsVersion]);

  useEffect(() => {
    let active = true;
    getDocumentStats()
      .then((res) => {
        if (active) setDocStats(res.data);
      })
      .catch(() => {
        if (active) setDocStats(null);
      });
    return () => {
      active = false;
    };
  }, [documentsVersion]);

  useEffect(() => {
    let active = true;
    getNews({ images: 0 })
      .then((res) => {
        if (!active) return;
        setHomeNews((res.data.articles || []).slice(0, 4));
      })
      .catch(() => {
        if (active) setHomeNews([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/documents?q=${encodeURIComponent(trimmed)}` : "/documents");
  };

  return (
    <div>
      <section className="full-bleed relative mt-4 sm:mt-6 mb-8 sm:mb-10 overflow-hidden border-y border-slate-800/60 bg-slate-950">
        <div className="relative">
          <img src={heroImg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/25 sm:bg-gradient-to-r sm:from-slate-950 sm:via-slate-950/25 sm:to-slate-950/20" />
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 min-[360px]:py-6 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
            <div className="relative min-w-0 max-w-full lg:max-w-2xl">
              <h1 className="text-base min-[360px]:text-lg sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 sm:mb-2.5 leading-tight break-words">
                {t("home.heroTitle")}
                <span className="text-teal-300 block">{t("home.heroAccent")}</span>
              </h1>
              <p className="text-[11px] min-[360px]:text-xs sm:text-sm md:text-base text-gray-200 mb-3 sm:mb-4 leading-relaxed break-words">
                {t("home.heroDesc")}
              </p>

              <form onSubmit={submitSearch} className="w-full mb-3 sm:mb-4 max-w-full sm:max-w-md lg:max-w-lg">
                <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-800/95 rounded-lg p-0.5 min-[360px]:p-1 shadow-lg w-full max-w-full">
                  <Search className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 text-gray-400 ml-1 min-[360px]:ml-2 shrink-0" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("home.searchPlaceholder")}
                    aria-label={t("home.searchAria")}
                    className="flex-1 min-w-0 w-0 bg-transparent px-0.5 py-1 min-[360px]:px-1 min-[360px]:py-1.5 text-[11px] min-[360px]:text-xs sm:text-sm text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 bg-teal-700 text-white text-[10px] min-[360px]:text-[11px] sm:text-sm px-2 min-[360px]:px-2.5 sm:px-3.5 py-1 min-[360px]:py-1.5 rounded-md hover:bg-teal-800 transition-colors font-medium"
                  >
                    {t("home.searchBtn")}
                  </button>
                </div>
              </form>

              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                <Link to="/documents" className="flex w-full items-center justify-center gap-1.5 rounded-md bg-teal-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-teal-700 sm:w-auto sm:text-sm">
                  <Search className="w-3.5 h-3.5" />
                  {t("home.explore")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/actualites" className="flex w-full items-center justify-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/20 sm:w-auto sm:text-sm">
                  <Newspaper className="w-3.5 h-3.5" />
                  {t("home.newsCta")}
                </Link>
                {user ? (
                  <Link to="/upload" className="flex w-full items-center justify-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/20 sm:w-auto sm:text-sm">
                    <Upload className="w-3.5 h-3.5" />
                    {t("footer.upload")}
                  </Link>
                ) : allowRegistrations && (
                  <Link to="/register" className="flex w-full items-center justify-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/20 sm:w-auto sm:text-sm">
                    <Upload className="w-3.5 h-3.5" />
                    {t("home.createAccount")}
                  </Link>
                )}
              </div>

              {docStats && docStats.total > 0 && (
                <div className="mb-4 mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2.5 sm:mb-5 sm:gap-3 sm:px-3 sm:py-3">
                  <div className="min-w-0 text-center sm:text-left">
                    <p className="text-sm font-bold leading-none text-white sm:text-base">
                      {formatDocumentCount(docStats.total)}
                    </p>
                    <p className="mt-1 truncate text-[9px] font-medium uppercase tracking-wide text-teal-200 sm:text-[10px]">
                      {t("home.documentsTotalLabel")}
                    </p>
                  </div>
                  <div className="min-w-0 border-l border-white/10 pl-2 text-center sm:pl-3 sm:text-left">
                    <p className="text-sm font-bold leading-none text-white sm:text-base">{docStats.public || 0}</p>
                    <p className="mt-1 truncate text-[9px] font-medium uppercase tracking-wide text-gray-300 sm:text-[10px]">
                      {t("home.documentsPublicLabel")}
                    </p>
                  </div>
                  <div className="min-w-0 border-l border-white/10 pl-2 text-center sm:pl-3 sm:text-left">
                    <p className="text-sm font-bold leading-none text-white sm:text-base">{docStats.private || 0}</p>
                    <p className="mt-1 truncate text-[9px] font-medium uppercase tracking-wide text-gray-300 sm:text-[10px]">
                      {t("home.documentsPrivateLabel")}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-gray-300 text-[11px] sm:text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t("home.free")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t("home.noAds")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t("home.fairShare")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <NewsTicker />

      <InstallBanner />

      <Reveal>
        <DocumentSection
          title={t("home.recentTitle")}
          subtitle={t("home.recentDesc")}
          docs={recent}
          loading={loading}
          to="/documents"
          seeAll={t("common.seeAll")}
        />
      </Reveal>

      {homeNews.length > 0 && (
        <section className="py-10 sm:py-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl md:text-3xl">{t("home.newsTitle")}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400 sm:text-base">{t("home.newsDesc")}</p>
            </div>
            <Link to="/actualites" className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium text-teal-700 dark:text-teal-300 hover:underline sm:self-auto">
              {t("common.seeAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {homeNews.map((article) => (
              <Link
                key={article.id || article.url}
                to={`/actualites/article?url=${encodeURIComponent(article.url)}`}
                state={{ article }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">
                  {article.image ? (
                    <img src={article.image} alt={article.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Newspaper className="h-8 w-8 text-white/70" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="mb-2 text-xs font-medium text-teal-700 dark:text-teal-300">{article.source}</span>
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-slate-100">{article.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
