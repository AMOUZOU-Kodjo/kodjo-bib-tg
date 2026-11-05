import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { getMyDownloads } from "../api/users";
import { DocumentCard } from "../components/documents/DocumentCard";
import useSeo from "../hooks/useSeo";
import { SkeletonCard } from "../components/ui";

export default function MyDownloads() {
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSeo({
    title: "Mes téléchargements",
    description: "Retrouvez l'historique de vos téléchargements sur Archives de Documents.",
    url: `${window.location.origin}/downloads`
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getMyDownloads()
      .then((res) => {
        if (!active) return;
        const data = res.data?.downloads || [];
        setDownloads(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) {
          navigate("/login?next=/downloads");
          return;
        }
        setError(err.response?.data?.error?.message || "Impossible de charger vos téléchargements");
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
          <Download className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">Mes téléchargements</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Retrouvez tous les documents que vous avez téléchargés.
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
      ) : downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <Download className="mb-3 h-10 w-10 text-gray-400 dark:text-slate-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Aucun téléchargement</h2>
          <p className="mt-1 max-w-md text-sm text-gray-600 dark:text-slate-400">
            Parcourez la bibliothèque et téléchargez des documents pour les retrouver ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {downloads.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
