import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload, Search, ArrowRight, CheckCircle } from "lucide-react";
import heroImg from "../assets/hero.jpg";
import { getDocuments } from "../api/documents";
import { DocumentCard } from "../components/documents/DocumentCard";
import useSeo from "../hooks/useSeo";

function DocumentSection({ title, subtitle, docs, to = "/documents" }) {
  if (!docs.length) return null;
  return (
    <section className="py-10 sm:py-12">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">{subtitle}</p>
        </div>
        <Link to={to} className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium text-teal-700 hover:underline sm:self-auto">
          Tout voir <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
        {docs.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [popular, setPopular] = useState([]);

  useSeo({
    title: "Bibliothèque numérique collaborative",
    description: "Déposez, archivez et partagez gratuitement vos documents. Découvrez des ressources utiles et contribuez à une bibliothèque numérique collaborative.",
    url: `${window.location.origin}/`
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      getDocuments({ sort: "recent", limit: 5 }),
      getDocuments({ sort: "views", limit: 5 })
    ])
      .then(([recentRes, popularRes]) => {
        if (!active) return;
        setRecent(recentRes.data.documents || []);
        setPopular(popularRes.data.documents || []);
      })
      .catch(() => {
        if (!active) return;
        setRecent([]);
        setPopular([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/documents?q=${encodeURIComponent(trimmed)}` : "/documents");
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="mb-8 sm:mb-10 overflow-hidden max-w-full rounded-2xl sm:rounded-3xl border border-slate-800/60 bg-slate-950">
        <div className="grid lg:grid-cols-2">
          <div className="relative px-3 py-5 min-[360px]:px-4 min-[360px]:py-6 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="relative min-w-0 max-w-full">
              <h1 className="text-base min-[360px]:text-lg sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 sm:mb-2.5 leading-tight break-words">
                Partagez et découvrez
                <span className="text-teal-300 block">des documents gratuitement</span>
              </h1>
              <p className="text-[11px] min-[360px]:text-xs sm:text-sm md:text-base text-gray-200 mb-3 sm:mb-4 leading-relaxed break-words">
                Une archive collaborative au service du partage du savoir. Déposez, gagnez des crédits, téléchargez librement.
              </p>

              <form onSubmit={submitSearch} className="w-full mb-3 sm:mb-4 max-w-full sm:max-w-md lg:max-w-lg">
                <div className="flex items-center gap-1 bg-white/95 rounded-lg p-0.5 min-[360px]:p-1 shadow-lg w-full max-w-full">
                  <Search className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 text-gray-400 ml-1 min-[360px]:ml-2 shrink-0" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher..."
                    aria-label="Rechercher un document"
                    className="flex-1 min-w-0 w-0 bg-transparent px-0.5 py-1 min-[360px]:px-1 min-[360px]:py-1.5 text-[11px] min-[360px]:text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 bg-teal-700 text-white text-[10px] min-[360px]:text-[11px] sm:text-sm px-2 min-[360px]:px-2.5 sm:px-3.5 py-1 min-[360px]:py-1.5 rounded-md hover:bg-teal-800 transition-colors font-medium"
                  >
                    Rechercher
                  </button>
                </div>
              </form>

              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                <Link to="/documents" className="flex w-full items-center justify-center gap-1.5 rounded-md bg-teal-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-teal-700 sm:w-auto sm:text-sm">
                  <Search className="w-3.5 h-3.5" />
                  Explorer la bibliothèque
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/register" className="flex w-full items-center justify-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/20 sm:w-auto sm:text-sm">
                  <Upload className="w-3.5 h-3.5" />
                  Créer un compte
                </Link>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-gray-300 text-[11px] sm:text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>100% Gratuit</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>Sans publicité</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>Partage équitable</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-40 sm:h-48 lg:h-auto">
            <img src={heroImg} alt="Bibliothèque de documents" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-slate-950 lg:via-slate-950/10 lg:to-transparent" />
          </div>
        </div>
      </section>

      <DocumentSection
        title="Derniers ajouts"
        subtitle="Les documents fraîchement partagés par la communauté"
        docs={recent}
        to="/documents"
      />

      <DocumentSection
        title="Les plus consultés"
        subtitle="Les documents que la communauté consulte le plus"
        docs={popular}
        to="/documents?sort=views"
      />

    </div>
  );
}
