import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MessageCircle, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import useSeo from "../hooks/useSeo";

export default function UserArticle() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const id = params.get("id");
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSeo({ title: article?.title || t("news.title"), description: article?.description || "", url: `${window.location.origin}/actualites/article-utilisateur?id=${id}` });

  useEffect(() => {
    if (!id) { setError(t("news.articleError")); setLoading(false); return; }
    client.get("/news/user-article", { params: { id } })
      .then((res) => setArticle(res.data.article))
      .catch(() => setError(t("news.articleError")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10 text-center">{t("common.loading")}</div>;
  if (error || !article) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error || t("news.articleError")}</div>
      <Link to="/actualites" className="mt-4 inline-block text-teal-700 hover:underline">{t("news.back")}</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/actualites" className="mb-4 inline-flex items-center gap-1.5 text-sm text-teal-700 hover:underline">← {t("news.back")}</Link>
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">{article.title}</h1>
      <p className="mb-6 text-xs text-gray-500 dark:text-slate-400">
        {article.author} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(i18n.resolvedLanguage === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""}
      </p>
      {article.image && <img src={article.image} alt={article.title} className="mb-6 w-full rounded-2xl" />}
      <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-800 dark:text-slate-200">{article.content}</div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${article.title} - https://archivia.onrender.com/share/news?id=${encodeURIComponent(params.get("id") || "")}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white hover:bg-[#1ebe5b]"
        >
          <MessageCircle className="h-4 w-4" />
          {t("news.shareWhatsApp")}
        </a>
        <button
          type="button"
          onClick={async () => { try { await navigator.clipboard.writeText(`https://archivia.onrender.com/share/news?id=${encodeURIComponent(params.get("id") || "")}`); } catch {} }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Copy className="h-4 w-4" />
          {t("news.copyLink")}
        </button>
      </div>
    </div>
  );
}
