import { Link } from "react-router-dom";
import { Heart, Mail, Cookie } from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Footer() {
  const { siteName } = useSiteSettings();
  const reopenCookies = () => {
    window.dispatchEvent(new Event("open-cookie-consent"));
  };

  return (
    <footer className="mt-20 border-t border-white/10 bg-gradient-to-b from-teal-700 to-teal-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-5">
            <div className="mb-5 inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
              <img
                src="/logo.png"
                alt={siteName}
                className="h-9 w-auto max-w-[200px] object-contain sm:h-10"
              />
            </div>
            <p className="text-white/80 leading-relaxed mb-5 max-w-lg">
              Plateforme collaborative gratuite d'archivage et de partage de documents.
              Partagez vos connaissances, accédez à des ressources utiles.
            </p>
            <p className="text-sm text-white/70 flex items-center gap-1.5">
              Fait avec <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" /> pour la communauté
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-semibold text-white text-base mb-4 tracking-wide">Navigation</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="text-white/75 hover:text-white transition-colors duration-200">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/documents" className="text-white/75 hover:text-white transition-colors duration-200">
                  Catalogue
                </Link>
              </li>
              <li>
                <Link to="/upload" className="text-white/75 hover:text-white transition-colors duration-200">
                  Déposer un document
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-semibold text-white text-base mb-4 tracking-wide">Compte</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/login" className="text-white/75 hover:text-white transition-colors duration-200">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-white/75 hover:text-white transition-colors duration-200">
                  Inscription
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-white/75 hover:text-white transition-colors duration-200">
                  Mon profil
                </Link>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <h3 className="font-semibold text-white text-base mb-4 tracking-wide">Informations légales</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/mentions-legales" className="text-white/75 hover:text-white transition-colors duration-200">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="text-white/75 hover:text-white transition-colors duration-200">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/cgu" className="text-white/75 hover:text-white transition-colors duration-200">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-white/75 hover:text-white transition-colors duration-200 inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Nous contacter
                </Link>
              </li>
              <li>
                <button
                  onClick={reopenCookies}
                  className="text-white/75 hover:text-white transition-colors duration-200 inline-flex items-center gap-1.5"
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
