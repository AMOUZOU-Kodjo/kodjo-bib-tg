import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Coins,
  FileSearch,
  GraduationCap,
  Layers,
  Newspaper,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  WifiOff
} from "lucide-react";
import heroImg from "../assets/hero.jpg";
import { getDocuments, getDocumentStats } from "../api/documents";
import { getNews } from "../api/news";
import { DocumentCard } from "../components/documents/DocumentCard";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useLiveVersion } from "../context/LiveUpdatesContext";
import InstallBanner from "../components/layout/InstallBanner";
import useSeo from "../hooks/useSeo";
import useCategories from "../hooks/useCategories";
import { formatCategoryName } from "../utils/document";
import { Reveal, Skeleton, SkeletonCard } from "../components/ui";

const NEWS_LIMIT = 4;
const CATEGORY_LIMIT = 8;

function formatStat(value) {
  const total = Number(value);
  if (!Number.isFinite(total) || total < 0) return null;
  return new Intl.NumberFormat(undefined).format(total);
}

function SectionHeading({ eyebrow, title, description, align = "left" }) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";
  return (
    <div className={`max-w-3xl ${alignClass}`}>
      {eyebrow && (
        <p className="mb-3 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-3xl md:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400 sm:text-base">{description}</p>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading, unavailableLabel }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">
              {value ?? <span className="text-base font-medium text-gray-400 dark:text-slate-500">{unavailableLabel}</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsPreviewCard({ article }) {
  const articlePath = String(article.url || "").startsWith("/")
    ? article.url
    : `/actualites/article?url=${encodeURIComponent(article.url)}`;
  return (
    <Link
      to={articlePath}
      state={{ article }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">
        {article.image ? (
          <img src={article.image} alt={article.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Newspaper className="h-10 w-10 text-white/70" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="mb-2 text-xs font-medium text-teal-700 dark:text-teal-300">{article.source}</span>
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-slate-100 sm:text-base">{article.title}</h3>
        {article.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-slate-400">{article.description}</p>}
      </div>
    </Link>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allowRegistrations, creditsInitiaux } = useSiteSettings();
  const documentsVersion = useLiveVersion("documents");
  const [query, setQuery] = useState("");

  const [recentDocs, setRecentDocs] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);

  const { categories, loading: categoriesLoading } = useCategories();

  useSeo({
    title: t("home.seoTitle"),
    description: t("home.seoDesc"),
    url: `${window.location.origin}/`
  });

  useEffect(() => {
    let active = true;
    setRecentLoading(true);
    getDocuments({ sort: "recent", limit: 12 })
      .then((res) => {
        if (active) setRecentDocs(res.data?.documents || []);
      })
      .catch(() => {
        if (active) setRecentDocs([]);
      })
      .finally(() => {
        if (active) setRecentLoading(false);
      });
    return () => {
      active = false;
    };
  }, [documentsVersion]);

  useEffect(() => {
    let active = true;
    setStatsLoading(true);
    getDocumentStats()
      .then((res) => {
        if (active) setStats(res.data || null);
      })
      .catch(() => {
        if (active) setStats(null);
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [documentsVersion]);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(false);
    try {
      const res = await getNews({ images: 0 });
      setNews((res.data.articles || []).slice(0, NEWS_LIMIT));
    } catch {
      setNews([]);
      setNewsError(true);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const topCategories = useMemo(() => {
    const flat = [];
    for (const cat of categories || []) {
      flat.push(cat);
      for (const child of cat.children || []) flat.push({ ...child, parentName: cat.name });
    }
    return flat
      .sort((a, b) => (b.total_count ?? b.document_count ?? 0) - (a.total_count ?? a.document_count ?? 0))
      .slice(0, CATEGORY_LIMIT);
  }, [categories]);

  const welcomeBonus = Number(creditsInitiaux) > 0 ? Number(creditsInitiaux) : 0;
  const primaryCta = user
    ? { to: "/upload", label: t("home.primaryCtaUpload"), icon: Upload }
    : allowRegistrations
      ? {
          to: "/register",
          label: welcomeBonus ? t("home.primaryCtaBonus", { credits: welcomeBonus }) : t("home.primaryCta"),
          icon: Sparkles
        }
      : { to: "/documents", label: t("home.secondaryCta"), icon: BookOpen };

  const finalPrimary = user
    ? { to: "/upload", label: t("home.finalDeposit"), icon: Upload }
    : allowRegistrations
      ? {
          to: "/register",
          label: welcomeBonus ? t("home.finalPrimaryBonus", { credits: welcomeBonus }) : t("home.finalPrimary"),
          icon: Sparkles
        }
      : { to: "/documents", label: t("home.viewCatalog"), icon: BookOpen };

  const submitSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/documents?q=${encodeURIComponent(trimmed)}` : "/documents");
  };

  const statItems = [
    { icon: BookOpen, label: t("home.statsDocuments"), value: formatStat(stats?.total ?? stats?.public) },
    { icon: Layers, label: t("home.statsCategories"), value: formatStat(stats?.categories) },
    { icon: Users, label: t("home.statsMembers"), value: formatStat(stats?.members) }
  ];

  const howSteps = [
    { icon: Upload, title: t("home.howStep1Title"), desc: t("home.howStep1Desc"), step: "01" },
    { icon: Coins, title: t("home.howStep2Title"), desc: t("home.howStep2Desc"), step: "02" },
    { icon: FileSearch, title: t("home.howStep3Title"), desc: t("home.howStep3Desc"), step: "03" }
  ];

  const whyItems = [
    { icon: ShieldCheck, title: t("home.whyFreeTitle"), desc: t("home.whyFreeDesc") },
    { icon: Coins, title: t("home.whyCreditsTitle"), desc: t("home.whyCreditsDesc") },
    { icon: WifiOff, title: t("home.whyPwaTitle"), desc: t("home.whyPwaDesc") },
    { icon: GraduationCap, title: t("home.whyExamTitle"), desc: t("home.whyExamDesc") }
  ];

  return (
    <div className="pb-10 sm:pb-14">
      {/* 1. Hero */}
      <section className="full-bleed relative mt-4 overflow-hidden border-y border-slate-800/60 bg-slate-950 sm:mt-6">
        <img src={heroImg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/55 to-slate-950 sm:bg-gradient-to-r sm:from-slate-950 sm:via-slate-950/70 sm:to-slate-950/35" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">
              <GraduationCap className="h-3.5 w-3.5" />
              {t("home.free")} · {t("home.noAds")}
            </p>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-[3.4rem]">
              {t("home.heroTitle")}
              <span className="mt-1 block text-teal-300">{t("home.heroAccent")}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base md:text-lg">
              {t("home.heroDesc")}
            </p>

            <form onSubmit={submitSearch} className="mt-6 max-w-2xl">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/95 p-1.5 shadow-xl backdrop-blur dark:bg-slate-900/90">
                <Search className="ml-2 h-5 w-5 shrink-0 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("home.searchPlaceholder")}
                  aria-label={t("home.searchAria")}
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none dark:text-slate-100 dark:placeholder-slate-400 sm:text-base"
                />
                <button type="submit" className="shrink-0 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 sm:px-5">
                  {t("home.searchBtn")}
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={primaryCta.to}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition-all hover:bg-teal-500 sm:text-base"
              >
                <primaryCta.icon className="h-4 w-4" />
                {primaryCta.label}
              </Link>
              <Link
                to="/documents"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15 sm:text-base"
              >
                <BookOpen className="h-4 w-4" />
                {t("home.secondaryCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-4 flex items-start gap-2 text-sm text-slate-300">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
              <span>{t("home.reassurance")}</span>
            </p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300 sm:text-sm">
              {[t("home.free"), t("home.noAds"), t("home.fairShare")].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-teal-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <InstallBanner />

      {/* 2. Recent documents */}
      {(recentLoading || recentDocs.length > 0) && (
        <Reveal>
          <section className="py-12 sm:py-14">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <SectionHeading title={t("home.recentTitle")} description={t("home.recentDesc")} />
              <Link to="/documents" className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium text-teal-700 hover:underline dark:text-teal-300 sm:self-auto">
                {t("common.seeAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {recentLoading ? (
              <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="relative -mx-4 overflow-hidden px-4 sm:mx-0 sm:px-0">
                <div className="home-news-marquee flex w-max gap-4 pb-2">
                  {[...recentDocs, ...recentDocs].map((doc, index) => (
                    <div key={`${doc.id}-${index}`} className="w-64 shrink-0 sm:w-72">
                      <DocumentCard doc={doc} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </Reveal>
      )}

      {/* 3. How it works */}
      <Reveal>
        <section className="py-14 sm:py-16">
          <SectionHeading align="center" eyebrow={t("home.howTitle")} title={t("home.howTitle")} description={t("home.howDesc")} />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {howSteps.map(({ icon: Icon, title, desc, step }) => (
              <article key={step} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80">
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-3xl font-bold text-teal-100 dark:text-teal-900/60">{step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{desc}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      {/* 4. Why Archivia */}
      <Reveal>
        <section className="py-4 sm:py-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 dark:border-slate-700 dark:bg-slate-800/30 sm:p-8 lg:p-10">
            <SectionHeading title={t("home.whyTitle")} description={t("home.whyDesc")} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {whyItems.map(({ icon: Icon, title, desc }) => (
                <article key={title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:ring-slate-700">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* 5. News & Discovery */}
      <Reveal>
        <section className="py-14 sm:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading title={t("home.discoverTitle")} description={t("home.discoverDesc")} />
            <div className="flex flex-wrap gap-2">
              <Link to="/documents" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                <BookOpen className="h-4 w-4" /> {t("home.viewCatalog")}
              </Link>
              <Link to="/actualites" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                <Newspaper className="h-4 w-4" /> {t("home.viewNews")}
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t("home.newsTitle")}</h3>
                <Link to="/actualites" className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300">{t("common.seeAll")}</Link>
              </div>

              {newsLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                      <Skeleton className="aspect-[16/9] w-full rounded-none" />
                      <div className="space-y-2 p-4">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : newsError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                  <p>{t("home.newsError")}</p>
                  <button type="button" onClick={loadNews} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 font-medium hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60">
                    <RefreshCw className="h-4 w-4" /> {t("home.newsRetry")}
                  </button>
                </div>
              ) : news.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                  {t("home.newsEmpty")}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {news.map((article) => <NewsPreviewCard key={article.id || article.url} article={article} />)}
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t("home.categoriesTitle")}</h3>
                  <Layers className="h-5 w-5 text-teal-600 dark:text-teal-300" />
                </div>

                {categoriesLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-full" />)}
                  </div>
                ) : topCategories.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t("home.categoriesEmpty")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {topCategories.map((cat) => (
                      <Link
                        key={cat.id || cat.slug}
                        to={`/documents?category=${encodeURIComponent(cat.slug || cat.name)}`}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:bg-teal-950/30 dark:hover:text-teal-200"
                      >
                        {formatCategoryName(cat.name, t)}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Link to="/documents" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800">
                    <Search className="h-4 w-4" /> {t("home.viewCatalog")}
                  </Link>
                  <Link to="/actualites" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                    <Newspaper className="h-4 w-4" /> {t("home.viewNews")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* 6. Social proof / Stats */}
      <Reveal>
        <section className="py-4 sm:py-6">
          <div className="rounded-3xl bg-slate-900 px-6 py-8 text-white dark:bg-slate-800/60 sm:px-8 sm:py-10">
            <SectionHeading
              align="center"
              title={t("home.statsTitle")}
              description={t("home.statsDesc")}
            />
            <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
              {statItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm text-slate-300">{item.label}</p>
                      {statsLoading ? (
                        <Skeleton className="mt-2 h-7 w-20 bg-white/10" />
                      ) : (
                        <p className="text-2xl font-bold text-white sm:text-3xl">
                          {item.value ?? <span className="text-sm font-medium text-slate-400">{t("home.statsUnavailable")}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* 7. Final CTA */}
      <Reveal>
        <section className="py-14 sm:py-16">
          <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-slate-50 p-6 shadow-sm dark:border-teal-900/50 dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-3xl md:text-4xl">{t("home.finalCtaTitle")}</h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-slate-400 sm:text-base">
                {welcomeBonus && allowRegistrations && !user ? t("home.finalCtaDesc") : t("home.finalCtaDescNoBonus")}
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to={finalPrimary.to}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 sm:w-auto sm:text-base"
                >
                  <finalPrimary.icon className="h-4 w-4" />
                  {finalPrimary.label}
                </Link>
                {!user && (
                  <Link
                    to={allowRegistrations ? "/upload" : "/documents"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto sm:text-base"
                  >
                    <Upload className="h-4 w-4" />
                    {allowRegistrations ? t("home.finalDeposit") : t("home.viewCatalog")}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
