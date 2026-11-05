import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { logout } from "../../api/auth";
import NotificationBell from "../notifications/NotificationBell";
import {
  Upload, User, LogOut, LogIn, UserPlus, Shield, BookOpen, Mail, Menu, X, Search, Heart, Download, Languages
} from "lucide-react";
import { Moon, Sun } from "lucide-react";

const desktopLink =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white";
const mobileLink =
  "flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white";
const mobileAccentLink =
  "flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium transition-colors";

export default function Navbar() {
  const { user, setUser } = useAuth();
  const { siteName, siteTagline, allowRegistrations } = useSiteSettings();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentLang = (i18n.resolvedLanguage || i18n.language || "fr").startsWith("en") ? "en" : "fr";

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    setUser(null);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-3 py-2.5 sm:py-3">
          <Link to="/" onClick={closeMenu} className="group flex min-w-0 items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <img
              src="/logo.png"
              alt={siteName}
              className="h-8 w-auto shrink-0 rounded-lg object-contain shadow-sm ring-1 ring-slate-200 transition group-hover:ring-teal-300 sm:h-9 lg:h-10 dark:ring-slate-700"
            />
            <div className="min-w-0 hidden sm:block">
              <div className="truncate text-base leading-tight text-slate-900 sm:text-lg lg:text-xl dark:text-white" style={{ fontFamily: "'Caveat', cursive", letterSpacing: "0.01em", fontWeight: 600 }}>{siteName}</div>
              <div className="hidden truncate text-xs leading-tight text-slate-500 md:block dark:text-slate-400">{siteTagline}</div>
            </div>
          </Link>

          <div className="hidden items-center gap-0 lg:flex xl:gap-0.5 2xl:gap-1 flex-shrink min-w-0">
            <Link to="/documents" className={desktopLink}>
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>{t("nav.catalog")}</span>
            </Link>
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-red-50 px-2.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20" title={t("nav.admin")}>
                    <Shield className="h-4 w-4 shrink-0" />
                    <span className="hidden 2xl:inline">{t("nav.admin")}</span>
                  </Link>
                )}
                {user.email_verified ? (
                  <>
                <Link to="/upload" className={desktopLink} title={t("nav.upload")}>
                  <Upload className="h-4 w-4 shrink-0" />
                  <span className="hidden 2xl:inline">{t("nav.upload")}</span>
                </Link>
                <Link to="/favorites" className={desktopLink} title={t("nav.favorites")}>
                  <Heart className="h-4 w-4 shrink-0" />
                  <span className="hidden 2xl:inline">{t("nav.favorites")}</span>
                </Link>
                <Link to="/downloads" className={desktopLink} title={t("nav.downloads")}>
                  <Download className="h-4 w-4 shrink-0" />
                  <span className="hidden 2xl:inline">{t("nav.downloads")}</span>
                </Link>
                <Link to="/profile" className={desktopLink}>
                  <User className="h-4 w-4 shrink-0" />
                  <span className="hidden 2xl:inline">{t("nav.myProfile")} ({t("nav.credits", { count: user.credits })})</span>
                  <span className="2xl:hidden">{t("nav.profile")}</span>
                </Link>
                  </>
                ) : (
                  <>
                    <Link to="/verify-email" state={{ email: user.email }} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-50 px-2.5 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="hidden xl:inline">{t("nav.verifyEmail")}</span>
                    </Link>
                <Link to="/favorites" className={desktopLink} title={t("nav.favorites")}>
                  <Heart className="h-4 w-4 shrink-0" />
                  <span className="hidden 2xl:inline">{t("nav.favorites")}</span>
                </Link>
                <Link to="/downloads" className={desktopLink} title={t("nav.downloads")}>
                  <Download className="h-4 w-4 shrink-0" />
                  <span className="hidden 2xl:inline">{t("nav.downloads")}</span>
                </Link>
                <Link to="/profile" className={desktopLink}>
                  <User className="h-4 w-4 shrink-0" />
                  <span className="hidden 2xl:inline">{t("nav.myProfile")}</span>
                  <span className="2xl:hidden">{t("nav.profile")}</span>
                </Link>
                  </>
                )}
                <button onClick={handleLogout} className={desktopLink} title={t("nav.logout")}>
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="hidden 2xl:inline">{t("nav.logout")}</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={desktopLink}>
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span>{t("nav.login")}</span>
                </Link>
                {allowRegistrations && (
                  <Link to="/register" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700">
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span>{t("nav.register")}</span>
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
              className="hidden items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:inline-flex dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              title={t("nav.search")}
              aria-label={t("nav.search")}
            >
              <Search className="h-4 w-4" />
              <span>{t("nav.search")}</span>
              <kbd className="rounded border border-slate-300 px-1 text-[10px] uppercase dark:border-slate-600">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => i18n.changeLanguage(currentLang === "fr" ? "en" : "fr")}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={t("common.language")}
              title={t("common.language")}
            >
              <Languages className="h-4 w-4" />
              <span>{currentLang.toUpperCase()}</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
              title={theme === "dark" ? "Thème clair" : "Thème sombre"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-slate-200 pb-3 lg:hidden dark:border-slate-700">
            <div className="flex flex-col gap-1 pt-3">
              <Link to="/documents" onClick={closeMenu} className={mobileLink}>
                <BookOpen className="h-4 w-4 shrink-0" />
                {t("nav.catalog")}
              </Link>

              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link to="/admin" onClick={closeMenu} className={`${mobileAccentLink} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20`}>
                      <Shield className="h-4 w-4 shrink-0" />
                      {t("nav.admin")}
                    </Link>
                  )}

                  {user.email_verified ? (
                    <>
                      <Link to="/upload" onClick={closeMenu} className={mobileLink}>
                        <Upload className="h-4 w-4 shrink-0" />
                        {t("nav.uploadDoc")}
                      </Link>
                      <Link to="/favorites" onClick={closeMenu} className={mobileLink}>
                        <Heart className="h-4 w-4 shrink-0" />
                        {t("nav.favorites")}
                      </Link>
                      <Link to="/downloads" onClick={closeMenu} className={mobileLink}>
                        <Download className="h-4 w-4 shrink-0" />
                        {t("nav.downloads")}
                      </Link>
                      <Link to="/profile" onClick={closeMenu} className={mobileLink}>
                        <User className="h-4 w-4 shrink-0" />
                        {t("nav.myProfile")}
                        <span className="ml-auto rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                          {t("nav.credits", { count: user.credits })}
                        </span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/verify-email" state={{ email: user.email }} onClick={closeMenu} className={`${mobileAccentLink} bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20`}>
                        <Mail className="h-4 w-4 shrink-0" />
                        {t("nav.verifyEmail")}
                      </Link>
                      <Link to="/favorites" onClick={closeMenu} className={mobileLink}>
                        <Heart className="h-4 w-4 shrink-0" />
                        {t("nav.favorites")}
                      </Link>
                      <Link to="/downloads" onClick={closeMenu} className={mobileLink}>
                        <Download className="h-4 w-4 shrink-0" />
                        {t("nav.downloads")}
                      </Link>
                      <Link to="/profile" onClick={closeMenu} className={mobileLink}>
                        <User className="h-4 w-4 shrink-0" />
                        {t("nav.myProfile")}
                      </Link>
                    </>
                  )}

                  <button onClick={handleLogout} className={`${mobileAccentLink} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10`}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu} className={mobileLink}>
                    <LogIn className="h-4 w-4 shrink-0" />
                    {t("nav.login")}
                  </Link>
                  {allowRegistrations && (
                    <Link to="/register" onClick={closeMenu} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700">
                      <UserPlus className="h-4 w-4" />
                      {t("nav.registerFree")}
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}