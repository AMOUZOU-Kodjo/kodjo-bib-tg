import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";

export default function CommentForm({ onSubmit }) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } catch (err) {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6">
      <label htmlFor="new-comment" className="sr-only">{t("comments.yourComment")}</label>
      <textarea
        id="new-comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={t("comments.placeholder")}
        className="w-full resize-y rounded-xl border border-gray-200 dark:border-slate-700 px-3.5 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-600 sm:px-4"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="shrink-0 text-xs text-gray-400">{content.length}/1000</span>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          {submitting ? t("comments.sending") : t("comments.publish")}
        </button>
      </div>
    </form>
  );
}
