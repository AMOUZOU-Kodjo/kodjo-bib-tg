import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import photo1 from "../assets/photo1.png";
import photo2 from "../assets/photo2.jpeg";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function About() {
  const { siteName, siteTagline } = useSiteSettings();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${siteName} – ${t("about.title", { siteName })}`;
  }, [siteName, t]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 sm:text-5xl mb-3">
            {t("about.title", { siteName })}
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 sm:text-2xl">{siteTagline || t("about.taglineFallback")}</p>
        </div>

        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 border-b-2 border-teal-500 pb-2 mb-4">{t("about.mission")}</h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{t("about.missionText")}</p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 border-b-2 border-teal-500 pb-2 mb-4">{t("about.features")}</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400">
            <li>{t("about.feature1")}</li>
            <li>{t("about.feature2")}</li>
            <li>{t("about.feature3")}</li>
            <li>{t("about.feature4")}</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 border-b-2 border-teal-500 pb-2 mb-4">{t("about.contact")}</h2>
          <p className="text-gray-600 dark:text-slate-400">
            {t("about.contactText")} <Link to="/contact" className="text-teal-600 hover:underline">{t("about.contactLink")}</Link>.
          </p>
          <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
            <img src={photo1} alt={t("author.profilePhotoAlt")} className="w-56 h-56 object-cover rounded-xl" />
            <img src={photo2} alt={t("author.profilePhotoAlt")} className="w-56 h-56 object-cover rounded-xl" />
          </section>
          <div className="mt-8 p-6 rounded-xl border border-teal-100 bg-teal-50/30 text-center">
            <h3 className="font-medium text-teal-800">{t("about.team")}</h3>
            <p className="mt-2 text-teal-600">{t("about.teamDesc")}</p>
          </div>
        </section>

        <footer className="mt-10 pt-6 border-t border-teal-100/30">
          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            © {new Date().getFullYear()} {siteName}. {t("about.rights")}
            <div className="mt-3 flex justify-center gap-4">
              <Link to="/mentions-legales" className="text-gray-500 dark:text-slate-400 hover:text-teal-600 transition-colors">{t("footer.legal")}</Link>
              <Link to="/confidentialite" className="text-gray-500 dark:text-slate-400 hover:text-teal-600 transition-colors">{t("footer.privacy")}</Link>
              <Link to="/cgu" className="text-gray-500 dark:text-slate-400 hover:text-teal-600 transition-colors">{t("footer.terms")}</Link>
            </div>
          </p>
        </footer>
      </div>
    </div>
  );
}
