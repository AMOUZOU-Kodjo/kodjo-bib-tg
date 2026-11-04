import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { getMyFavorites } from "../api/users";
import { DocumentCard } from "../components/documents/DocumentCard";
import useSeo from "../hooks/useSeo";
import { SkeletonCard } from "../components/ui";

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSeo({
    title: "Mes favoris",
    description: "Retrouvez tous vos documents mis en favoris sur Archives de Documents.",
    url: `${window.location.origin}/favorites`
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getMyFavorites()
      .then((res) => {
        if (!active) return;
        const data = res.data?.favorites || res.data?.documents || [];
        setFavorites(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) {
          navigate("/login?next=/favorites");
          return;
        }
        setError(err.response?.data?.error?.message || "Impossible de charger vos favoris");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">Mes favoris</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Retrouvez tous les documents que vous avez ajoutés à vos favoris.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <Heart className="mb-3 h-10 w-10 text-gray-400 dark:text-slate-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Aucun favori pour le moment</h2>
          <p className="mt-1 max-w-md text-sm text-gray-600 dark:text-slate-400">
            Parcourez les documents et cliquez sur le cœur pour les ajouter à vos favoris.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {favorites.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
