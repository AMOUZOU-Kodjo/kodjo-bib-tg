import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
    </div>
  );
}
