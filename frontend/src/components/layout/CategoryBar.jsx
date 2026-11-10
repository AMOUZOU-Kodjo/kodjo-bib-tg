import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Atom,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderTree,
  Globe2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Library,
  Puzzle,
  X
} from "lucide-react";
import useCategories from "../../hooks/useCategories";
import { findCategoryByName, findCategoryBySlug, findCategoryParent } from "../../utils/categories";
import { formatCategoryName } from "../../utils/document";

const HIDDEN_PREFIXES = [
  "/admin",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/share/"
];

const ICONS = {
  Atom,
  BookOpen,
  BriefcaseBusiness,
  FolderTree,
  Globe2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Puzzle
};

const ICON_BY_SLUG = {
  "education-examens": GraduationCap,
  "sciences-techniques": Atom,
  "lettres-culture": BookOpen,
  "histoire-geographie": Globe2,
  "societe-politique": Landmark,
  "sante-bien-etre": HeartPulse,
  "enfance-loisirs": Puzzle,
  "vie-pratique-administration": BriefcaseBusiness
};

const ICON_RULES = [
  [/éducation|education|examen|scolaire|cours/i, GraduationCap],
  [/science|technique|physique|math|informatique/i, Atom],
  [/lettre|culture|philo|littéra|art|divert/i, BookOpen],
  [/histoire|géo/i, Globe2],
  [/société|politique|droit/i, Landmark],
  [/santé|bien-être|médecine/i, HeartPulse],
  [/enfance|bébé|loisir|sport|jeu/i, Puzzle],
  [/pratique|administration|emploi|cv/i, BriefcaseBusiness]
];

function getCategoryIcon(category) {
  const configured = ICONS[String(category.icon || "").trim()];
  if (configured) return configured;
  if (ICON_BY_SLUG[category.slug]) return ICON_BY_SLUG[category.slug];
  const match = ICON_RULES.find(([pattern]) => pattern.test(category.name || ""));
  return match ? match[1] : FolderTree;
}

function countOf(category) {
  return category?.total_count ?? category?.document_count ?? 0;
}

function documentsHref(slug) {
  return `/documents?category=${encodeURIComponent(slug)}`;
}

export default function CategoryBar() {
  const { categories, loading } = useCategories();
  const { t } = useTranslation();
  const location = useLocation();
  const [openIndex, setOpenIndex] = useState(null);
  const [mobileRootId, setMobileRootId] = useState(null);
  const closeTimeout = useRef(null);
  const barRef = useRef(null);

  const hidden = HIDDEN_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  const activeRootId = useMemo(() => {
    const reference = new URLSearchParams(location.search).get("category");
    if (!reference) return null;
    const selected = findCategoryBySlug(categories, reference) || findCategoryByName(categories, reference);
    if (!selected) return null;
    return (findCategoryParent(categories, selected.id) || selected).id;
  }, [categories, location.search]);

  const activeRoot = openIndex === null ? null : categories[openIndex] || null;
  const mobileRoot = categories.find((category) => category.id === mobileRootId) || null;
  const mobileOpen = Boolean(mobileRoot);

  useEffect(() => {
    setOpenIndex(null);
    setMobileRootId(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") {
        setOpenIndex(null);
        setMobileRootId(null);
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    if (openIndex === null) return undefined;
    const handleOutside = (event) => {
      if (!barRef.current?.contains(event.target)) setOpenIndex(null);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openIndex]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => () => clearTimeout(closeTimeout.current), []);

  const openMenu = (index) => {
    clearTimeout(closeTimeout.current);
    setOpenIndex(index);
  };

  const scheduleClose = () => {
    clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setOpenIndex(null), 140);
  };

  const toggleMenu = (index) => {
    if (openIndex === index) setOpenIndex(null);
    else openMenu(index);
  };

  if (hidden) return null;

  if (loading && categories.length === 0) {
    return (
      <>
        <div aria-hidden="true" className="h-12" />
        <div className="fixed inset-x-0 top-[65px] z-40 h-12 border-b border-slate-200/80 bg-white/95 pt-1 backdrop-blur sm:top-[69px] lg:top-[65px] dark:border-slate-700 dark:bg-slate-900/95">
          <div className="mx-auto flex h-full max-w-7xl items-center gap-2 overflow-hidden px-3 sm:px-6 lg:px-8">
            {Array.from({ length: 7 }).map((_, index) => (
              <span key={index} className="h-8 w-28 shrink-0 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (categories.length === 0) return null;

  return (
    <>
      <div aria-hidden="true" className="h-12" />
      <div
        ref={barRef}
        className="fixed inset-x-0 top-[65px] z-40 h-12 border-b border-slate-200/80 bg-white/95 pt-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:top-[69px] lg:top-[65px] dark:border-slate-700 dark:bg-slate-900/95"
      >
        <div className="mx-auto h-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div
            className="hidden h-full items-center justify-start gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden lg:flex xl:justify-center"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            role="navigation"
            aria-label={t("categoryBar.title")}
          >
            {categories.map((root, index) => {
              const Icon = getCategoryIcon(root);
              const isOpen = openIndex === index;
              const isActive = activeRootId === root.id || isOpen;
              return (
                <button
                  key={root.id}
                  type="button"
                  onMouseEnter={() => openMenu(index)}
                  onMouseLeave={scheduleClose}
                  onClick={() => toggleMenu(index)}
                  aria-expanded={isOpen}
                  aria-controls={`category-menu-${root.id}`}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{formatCategoryName(root.name, t)}</span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              );
            })}
          </div>

          <div
            className="flex h-full items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden lg:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            role="navigation"
            aria-label={t("categoryBar.title")}
          >
            {categories.map((root) => {
              const Icon = getCategoryIcon(root);
              const isActive = activeRootId === root.id;
              return (
                <button
                  key={root.id}
                  type="button"
                  onClick={() => setMobileRootId(root.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {formatCategoryName(root.name, t)}
                </button>
              );
            })}
          </div>
        </div>

        {activeRoot && (
          <div
            id={`category-menu-${activeRoot.id}`}
            onMouseEnter={() => openMenu(openIndex)}
            onMouseLeave={scheduleClose}
            className="absolute inset-x-0 top-full hidden border-t border-slate-100 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.28)] lg:block dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
              <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5 dark:border-teal-900/50 dark:from-teal-950/40 dark:to-slate-900">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">
                    {(() => {
                      const Icon = getCategoryIcon(activeRoot);
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                      {formatCategoryName(activeRoot.name, t)}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {t("categoryBar.documents", { count: countOf(activeRoot) })}
                    </p>
                  </div>
                </div>
                <Link
                  to={documentsHref(activeRoot.slug)}
                  onClick={() => setOpenIndex(null)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
                >
                  {t("common.seeAll")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/documents"
                  onClick={() => setOpenIndex(null)}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Library className="h-4 w-4" />
                  {t("categoryBar.allDocuments")}
                </Link>
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {t("categoryBar.subcategories")}
                  </p>
                  <span className="text-xs text-slate-400">
                    {t("categoryBar.documents", { count: countOf(activeRoot) })}
                  </span>
                </div>

                {activeRoot.children?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                    {activeRoot.children.map((child) => (
                      <Link
                        key={child.id}
                        to={documentsHref(child.slug)}
                        onClick={() => setOpenIndex(null)}
                        className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-teal-100 group-hover:text-teal-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-teal-500/15 dark:group-hover:text-teal-200">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-700 group-hover:text-teal-800 dark:text-slate-200 dark:group-hover:text-teal-200">
                            {formatCategoryName(child.name, t)}
                          </span>
                          <span className="block text-xs text-slate-400">
                            {t("categoryBar.documents", { count: countOf(child) })}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600 dark:text-slate-600" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
                    {t("categoryBar.noSubcategories")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {mobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex flex-col bg-white lg:hidden dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMobileRootId(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={t("common.close")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {t("categoryBar.title")}
                </p>
                <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                  {formatCategoryName(mobileRoot.name, t)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileRootId(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden border-b border-slate-100 px-4 py-3 dark:border-slate-800"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {categories.map((root) => {
                const Icon = getCategoryIcon(root);
                const isActive = root.id === mobileRoot.id;
                return (
                  <button
                    key={root.id}
                    type="button"
                    onClick={() => setMobileRootId(root.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-teal-700 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {formatCategoryName(root.name, t)}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <Link
                to={documentsHref(mobileRoot.slug)}
                onClick={() => setMobileRootId(null)}
                className="flex items-center gap-3 rounded-2xl bg-teal-50 px-4 py-3 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200"
              >
                <Library className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {t("common.seeAll")} · {formatCategoryName(mobileRoot.name, t)}
                  </span>
                  <span className="block text-xs opacity-80">
                    {t("categoryBar.documents", { count: countOf(mobileRoot) })}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>

              <div className="mt-5 space-y-1.5">
                {mobileRoot.children?.length > 0 ? (
                  mobileRoot.children.map((child) => (
                    <Link
                      key={child.id}
                      to={documentsHref(child.slug)}
                      onClick={() => setMobileRootId(null)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                          {formatCategoryName(child.name, t)}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {t("categoryBar.documents", { count: countOf(child) })}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                    </Link>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
                    {t("categoryBar.noSubcategories")}
                  </p>
                )}
              </div>

              <Link
                to="/documents"
                onClick={() => setMobileRootId(null)}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                <Library className="h-4 w-4" />
                {t("categoryBar.allDocuments")}
              </Link>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
