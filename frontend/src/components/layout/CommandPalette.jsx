import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  BookOpen,
  FileText,
  Home,
  Info,
  Loader2,
  Mail,
  Search,
  Shield,
  Upload,
  User,
  X
} from "lucide-react";
import { getDocuments } from "../../api/documents";
import { useAuth } from "../../context/AuthContext";

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const navItems = useMemo(() => {
    const items = [
      { label: "Accueil", to: "/", icon: Home },
      { label: "Bibliothèque", to: "/documents", icon: BookOpen },
      { label: "À propos", to: "/a-propos", icon: Info },
      { label: "Contact", to: "/contact", icon: Mail }
    ];
    if (user) {
      items.splice(2, 0, { label: "Notifications", to: "/notifications", icon: Bell });
      items.splice(2, 0, { label: "Mon profil", to: "/profile", icon: User });
      if (user.email_verified) {
        items.splice(2, 0, { label: "Déposer un document", to: "/upload", icon: Upload });
      }
      if (user.role === "admin") {
        items.push({ label: "Administration", to: "/admin", icon: Shield });
      }
    }
    return items;
  }, [user]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDocs([]);
    setActive(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < 2) {
      setDocs([]);
      setLoading(false);
      return;
    }
    let activeRequest = true;
    setLoading(true);
    const timer = setTimeout(() => {
      getDocuments({ q: term, limit: 6 })
        .then((response) => {
          if (activeRequest) setDocs(response.data.documents || []);
        })
        .catch(() => {
          if (activeRequest) setDocs([]);
        })
        .finally(() => {
          if (activeRequest) setLoading(false);
        });
    }, 250);
    return () => {
      activeRequest = false;
      clearTimeout(timer);
    };
  }, [query, open]);

  const filteredNav = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return navItems;
    return navItems.filter((item) => item.label.toLowerCase().includes(term));
  }, [navItems, query]);

  const results = useMemo(
    () => [
      ...filteredNav.map((item) => ({ type: "nav", ...item })),
      ...docs.map((doc) => ({ type: "doc", ...doc }))
    ],
    [filteredNav, docs]
  );

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const goTo = (item) => {
    onClose();
    navigate(item.type === "nav" ? item.to : `/documents/${item.id}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      goTo(results[active]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[12vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes"
    >
      <button
        type="button"
        aria-label="Fermer la palette"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 dark:border-slate-700">
          <Search className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un document ou naviguer…"
            className="h-14 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-slate-100"
          />
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              {query.trim().length > 0 ? "Aucun résultat" : "Commencez à taper pour rechercher…"}
            </p>
          ) : (
            results.map((item, index) => {
              const Icon = item.type === "nav" ? item.icon : FileText;
              const isActive = index === active;
              return (
                <button
                  key={item.type === "nav" ? item.to : `doc-${item.id}`}
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => goTo(item)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200"
                      : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    {item.type === "nav" ? item.label : item.title}
                  </span>
                  {item.type === "doc" && (
                    <span className="hidden shrink-0 truncate text-xs text-gray-400 sm:block">
                      {item.author_name}
                    </span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 dark:border-slate-700 dark:text-slate-500">
          <span>↑ ↓ naviguer · ↵ ouvrir</span>
          <span className="rounded border border-gray-200 px-1.5 py-0.5 dark:border-slate-700">Échap</span>
        </div>
      </div>
    </div>
  );
}
