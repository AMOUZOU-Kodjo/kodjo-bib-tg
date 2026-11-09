import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, Mail, Cookie } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import InstallPWA from "./InstallPWA";
import SocialLinks from "./SocialLinks";

const linkClass =
  "text-sm text-white/80 transition-colors duration-200 hover:text-white";

export default function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { siteName, siteTagline, allowRegistrations } = useSiteSettings();
  const reopenCookies = () => {
    window.dispatchEvent(new Event("open-cookie-consent"));
  };

  return (
    <footer className="mt-20 border-t border-white/10 bg-gradient-to-b from-teal-700 to-teal-800 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 text-center sm:text-left lg:grid-cols-12 lg:gap-8">
          <div className="col-span-2 lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src="/logo.png"
                alt={siteName}
                className="h-11 w-auto shrink-0 rounded-xl object-contain ring-1 ring-white/15 sm:h-12"
              />
              <span className="font-sans text-3xl font-semibold leading-none tracking-[0.02em] text-white sm:text-4xl">
                {siteName}
              </span>
            </Link>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/80 sm:mx-0">
              {siteTagline || t("footer.tagline")}
            </p>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-white/75 sm:justify-start">
              {t("footer.madeWith")} <Heart className="h-4 w-4 text-rose-300 fill-rose-300/30" /> {t("footer.forCommunity")}
            </p>
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">{t("footer.followUs")}</p>
              <SocialLinks className="justify-center sm:justify-start" />
            </div>
            <div className="mt-4 flex justify-center sm:justify-start">
              <InstallPWA />
            </div>
          </div>

          <div className="lg:col-span-2 lg:col-start-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{t("footer.navigation")}</h3>
            <ul className="mt-4 space-y-3">
              <li><Link to="/" className={linkClass}>{t("footer.home")}</Link></li>
              <li><Link to="/documents" className={linkClass}>{t("footer.catalog")}</Link></li>
              <li><Link to="/upload" className={linkClass}>{t("footer.upload")}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{t("footer.account")}</h3>
            <ul className="mt-4 space-y-3">
              {user ? (
                <>
                  <li><Link to="/profile" className={linkClass}>{t("footer.profile")}</Link></li>
                  <li><Link to="/favorites" className={linkClass}>{t("nav.favorites")}</Link></li>
                  <li><Link to="/downloads" className={linkClass}>{t("nav.downloads")}</Link></li>
                  {!user.email_verified && (
                    <li><Link to="/verify-email" state={{ email: user.email }} className={linkClass}>{t("nav.verifyEmail")}</Link></li>
                  )}
                  {user.role === "admin" && (
                    <li><Link to="/admin" className={linkClass}>{t("nav.admin")}</Link></li>
                  )}
                </>
              ) : (
                <>
                  <li><Link to="/login" className={linkClass}>{t("footer.login")}</Link></li>
                  {allowRegistrations && <li><Link to="/register" className={linkClass}>{t("footer.register")}</Link></li>}
                </>
              )}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{t("footer.legal")}</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:max-w-sm lg:grid-cols-1">
              <li><Link to="/a-propos" className={linkClass}>{t("footer.about")}</Link></li>
              <li><Link to="/mentions-legales" className={linkClass}>{t("footer.legalNotice")}</Link></li>
              {/* <li><Link to="/confidentialite" className={linkClass}>{t("footer.privacy")}</Link></li> */}
              {/* <li><Link to="/cgu" className={linkClass}>{t("footer.terms")}</Link></li> */}
              {/* <li>
                <Link to="/contact" className={`inline-flex items-center gap-2 ${linkClass}`}>
                  <Mail className="h-3.5 w-3.5" />{t("footer.contact")}
                </Link>
              </li> */}
              <li className="col-span-2 flex justify-center lg:col-span-1 lg:justify-start">
                <button type="button" onClick={reopenCookies} className={`inline-flex items-center gap-2 ${linkClass}`}>
                  <Cookie className="h-3.5 w-3.5" />{t("footer.cookies")}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 sm:flex-row">
          <p className="text-center text-sm text-white/70 sm:text-left">
            © {new Date().getFullYear()} <span className="font-bold text-sky-200">{siteName}</span>. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link to="/confidentialite" className="text-white/70 transition-colors hover:text-white">{t("footer.privacy")}</Link>
            <Link to="/cgu" className="text-white/70 transition-colors hover:text-white">{t("footer.terms")}</Link>
            <Link to="/contact" className="text-white/70 transition-colors hover:text-white">{t("footer.contact")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
