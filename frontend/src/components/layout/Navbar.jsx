import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { logout } from "../../api/auth";
import {
  Archive, Upload, User, LogOut, LogIn, UserPlus, Shield, BookOpen, Mail, Menu, X
} from "lucide-react";

const desktopLink =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white";
const mobileLink =
  "flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white";
const mobileAccentLink =
  "flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium transition-colors";

export default function Navbar() {
  const { user, setUser } = useAuth();
  const { siteName } = useSiteSettings();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-teal-700 backdrop-blur supports-[backdrop-filter]:bg-teal-700/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3">
          <Link to="/" onClick={closeMenu} className="flex min-w-0 items-center gap-2.5 group">
            <div className="shrink-0 rounded-lg bg-teal-600 p-2 transition-all group-hover:bg-teal-500">
              <Archive className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg leading-tight text-white sm:text-xl" style={{ fontFamily: "'Caveat', cursive", letterSpacing: "0.01em", fontWeight: 600 }}>{siteName}</div>
              <div className="hidden truncate text-xs leading-tight text-white/80 sm:block">Plateforme de documents</div>
            </div>
          </Link>

          <div className="hidden items-center gap-1 lg:flex xl:gap-2">
            <Link to="/documents" className={desktopLink}>
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Catalogue</span>
            </Link>
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-red-500/10 px-2.5 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20">
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>Administration</span>
                  </Link>
                )}
                {user.email_verified ? (
                  <>
                    <Link to="/upload" className={desktopLink}>
                      <Upload className="h-4 w-4 shrink-0" />
                      <span>Déposer</span>
                    </Link>
                    <Link to="/profile" className={desktopLink}>
                      <User className="h-4 w-4 shrink-0" />
                      <span>Mon profil ({user.credits} cr.)</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/verify-email" state={{ email: user.email }} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500/10 px-2.5 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/20">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span>Vérifier mon email</span>
                    </Link>
                    <Link to="/profile" className={desktopLink}>
                      <User className="h-4 w-4 shrink-0" />
                      <span>Mon profil</span>
                    </Link>
                  </>
                )}
                <button onClick={handleLogout} className={desktopLink}>
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={desktopLink}>
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span>Connexion</span>
                </Link>
                <Link to="/register" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20">
                  <UserPlus className="h-4 w-4 shrink-0" />
                  <span>Inscription</span>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-white/20 pb-3 lg:hidden">
            <div className="flex flex-col gap-1 pt-3">
              <Link to="/documents" onClick={closeMenu} className={mobileLink}>
                <BookOpen className="h-4 w-4 shrink-0" />
                Catalogue
              </Link>

              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link to="/admin" onClick={closeMenu} className={`${mobileAccentLink} bg-red-500/10 text-red-400 hover:bg-red-500/20`}>
                      <Shield className="h-4 w-4 shrink-0" />
                      Administration
                    </Link>
                  )}

                  {user.email_verified ? (
                    <>
                      <Link to="/upload" onClick={closeMenu} className={mobileLink}>
                        <Upload className="h-4 w-4 shrink-0" />
                        Déposer un document
                      </Link>
                      <Link to="/profile" onClick={closeMenu} className={mobileLink}>
                        <User className="h-4 w-4 shrink-0" />
                        Mon profil
                        <span className="ml-auto rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-300">
                          {user.credits} cr.
                        </span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/verify-email" state={{ email: user.email }} onClick={closeMenu} className={`${mobileAccentLink} bg-amber-500/10 text-amber-300 hover:bg-amber-500/20`}>
                        <Mail className="h-4 w-4 shrink-0" />
                        Vérifier mon email
                      </Link>
                      <Link to="/profile" onClick={closeMenu} className={mobileLink}>
                        <User className="h-4 w-4 shrink-0" />
                        Mon profil
                      </Link>
                    </>
                  )}

                  <button onClick={handleLogout} className={`${mobileAccentLink} text-red-400 hover:bg-red-500/10`}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu} className={mobileLink}>
                    <LogIn className="h-4 w-4 shrink-0" />
                    Connexion
                  </Link>
                  <Link to="/register" onClick={closeMenu}                     className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20">
                    <UserPlus className="h-4 w-4" />
                    Inscription gratuite
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
