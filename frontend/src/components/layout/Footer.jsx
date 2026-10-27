import { Link } from "react-router-dom";
import { Archive, Heart, Mail, Cookie } from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Footer() {
  const { siteName } = useSiteSettings();
  const reopenCookies = () => {
    window.dispatchEvent(new Event("open-cookie-consent"));
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-5 md:gap-8">
          <div className="col-span-2 md:col-span-2">
            <div className="flex min-w-0 items-center gap-2.5 mb-4">
              <div className="shrink-0 bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-lg">
                <Archive className="w-6 h-6 text-white" />
              </div>
              <span className="truncate font-bold text-xl text-gray-900">{siteName}</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Plateforme collaborative gratuite d'archivage et de partage de documents.
              Partagez vos connaissances, accédez à des ressources utiles.
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              Fait avec <Heart className="w-4 h-4 text-red-500" /> pour la communauté
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors">Accueil</Link></li>
              <li><Link to="/documents" className="text-gray-600 hover:text-primary-600 transition-colors">Catalogue</Link></li>
              <li><Link to="/upload" className="text-gray-600 hover:text-primary-600 transition-colors">Déposer un document</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Compte</h3>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-gray-600 hover:text-primary-600 transition-colors">Connexion</Link></li>
              <li><Link to="/register" className="text-gray-600 hover:text-primary-600 transition-colors">Inscription</Link></li>
              <li><Link to="/profile" className="text-gray-600 hover:text-primary-600 transition-colors">Mon profil</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Informations légales</h3>
            <ul className="space-y-2">
              <li><Link to="/mentions-legales" className="text-gray-600 hover:text-primary-600 transition-colors">Mentions légales</Link></li>
              <li><Link to="/confidentialite" className="text-gray-600 hover:text-primary-600 transition-colors">Confidentialité</Link></li>
              <li><Link to="/cgu" className="text-gray-600 hover:text-primary-600 transition-colors">Conditions d'utilisation</Link></li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Nous contacter
                </Link>
              </li>
              <li>
                <button onClick={reopenCookies} className="text-gray-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1.5">
                  <Cookie className="w-3.5 h-3.5" />
                  Gérer les cookies
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2026 {siteName}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
