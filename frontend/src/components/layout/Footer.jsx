import { Link } from "react-router-dom";
import { Heart, Mail, Cookie } from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import InstallPWA from "./InstallPWA";
import SocialLinks from "./SocialLinks";

export default function Footer() {
  const { siteName } = useSiteSettings();
  const reopenCookies = () => {
    window.dispatchEvent(new Event("open-cookie-consent"));
  };

  return (
    <footer className="mt-20 border-t border-white/10 bg-gradient-to-b from-teal-700 to-teal-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-12 lg:gap-8">
          <div className="col-span-2 lg:col-span-5">
            <div className="mb-5 flex min-w-0 items-center gap-3">
              <img
                src="/logo.png"
                alt={siteName}
                className="h-11 w-auto shrink-0 rounded-xl object-contain shadow-sm ring-1 ring-white/20 sm:h-12"
              />
              <span
                className="truncate text-3xl text-white sm:text-4xl"
                style={{ fontFamily: "'Caveat', cursive", letterSpacing: "0.01em", fontWeight: 600 }}
              >
                {siteName}
              </span>
            </div>
            <p className="text-white/80 leading-relaxed mb-5 max-w-lg">
              Plateforme collaborative gratuite d'archivage et de partage de documents.
              Partagez vos connaissances, accédez à des ressources utiles.
            </p>
            <p className="text-sm text-white/70 flex items-center gap-1.5">
              Fait avec <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" /> pour la communauté
            </p>
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-white/90">Suivez-nous</p>
              <SocialLinks />
            </div>
            <div className="mt-4">
              <InstallPWA />
            </div>
          </div>

          <div className="col-span-1 min-w-0 lg:col-span-2">
            <h3 className="mb-3 text-base font-semibold tracking-wide text-white lg:mb-4">Navigation</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="inline-flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:w-auto lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/documents" className="inline-flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:w-auto lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent">
                  Catalogue
                </Link>
              </li>
              <li>
                <Link to="/upload" className="inline-flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:w-auto lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent">
                  Déposer un document
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1 min-w-0 lg:col-span-2">
            <h3 className="mb-3 text-base font-semibold tracking-wide text-white lg:mb-4">Compte</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/login" className="inline-flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:w-auto lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/register" className="inline-flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:w-auto lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent">
                  Inscription
                </Link>
              </li>
              <li>
                <Link to="/profile" className="inline-flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:w-auto lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent">
                  Mon profil
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-3">
            <h3 className="mb-3 text-center text-base font-semibold tracking-wide text-white lg:mb-4 lg:text-left">Informations légales</h3>
            <ul className="flex flex-wrap justify-center gap-2 lg:block lg:space-y-2.5">
              <li>
                <Link to="/mentions-legales" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/cgu" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Nous contacter
                </Link>
              </li>
              <li>
                <button
                  onClick={reopenCookies}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white lg:bg-transparent lg:px-0 lg:py-0 lg:hover:bg-transparent"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  Gérer les cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15 mt-10 pt-6">
          <p className="text-center text-sm text-white/60">
            © 2026 {siteName}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
