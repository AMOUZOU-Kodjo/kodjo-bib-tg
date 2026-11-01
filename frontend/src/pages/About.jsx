import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import photo1 from "../assets/photo1.png";
import photo2 from "../assets/photo2.jpeg";
import { Globe, Users, Shield, Download, Heart, Book } from "lucide-react";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function About() {
  const { siteName, siteTagline } = useSiteSettings();
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);

  useEffect(() => {
    document.title = `${siteName} – À propos`;
  }, [siteName]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 sm:text-5xl mb-3">
            À propos de {siteName}
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 sm:text-2xl">{siteTagline || "Plateforme collaborative gratuite d'archivage et de partage de documents."}</p>
        </div>

        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 border-b-2 border-teal-500 pb-2 mb-4">Mission</h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            Notre mission est de fournir une plateforme ouverte et gratuite où chacun peut archiver, partager et découvrir des documents dans un esprit de communauté et d'entraide.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 border-b-2 border-teal-500 pb-2 mb-4">Fonctionnalités</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-slate-400">
            <li>Dépose et archivez vos documents en toute simplicité</li>
            <li>Parcourez la bibliothèque par catégories, auteurs ou popularité</li>
            <li>Système de crédits pour encourager la contribution</li>
            <li>Accès public ou privé selon les préférences de l administrateur</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 border-b-2 border-teal-500 pb-2 mb-4">Contact</h2>
<p className="text-gray-600 dark:text-slate-400">
              Pour toute question, suggestion ou signalement, vous pouvez nous joindre via le formulaire de <Link to="/contact" className="text-teal-600 hover:underline">contact</Link>.
            </p>
            <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
              <img src={photo1} alt="Photo personnelle" className="w-56 h-56 object-cover rounded-xl" />
              <img src={photo2} alt="Photo personnelle" className="w-56 h-56 object-cover rounded-xl" />
            </section>
            <div className="mt-8 p-6 rounded-xl border border-teal-100 bg-teal-50/30 text-center">
            <h3 className="font-medium text-teal-800">Nous contacter</h3>
            <p className="mt-2 text-teal-600">
              Équipe de développement — kodjo-bib-tg
            </p>
          </div>
        </section>

        <footer className="mt-10 pt-6 border-t border-teal-100/30">
          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            © {new Date().getFullYear()} {siteName}. Tous droits réservés.
            {/* Links */}
            <div className="mt-3 flex justify-center gap-4">
              <Link to="/mentions-legales" className="text-gray-500 dark:text-slate-400 hover:text-teal-600 transition-colors">
                Mentions légales
              </Link>
              <Link to="/confidentialite" className="text-gray-500 dark:text-slate-400 hover:text-teal-600 transition-colors">
                Confidentialité
              </Link>
              <Link to="/cgu" className="text-gray-500 dark:text-slate-400 hover:text-teal-600 transition-colors">
                CGU
              </Link>
            </div>
          </p>
        </footer>
      </div>
    </div>
  );
}