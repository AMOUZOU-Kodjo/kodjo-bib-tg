import { useEffect, useState } from "react";
import { MessageCircle, Copy, ExternalLink, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { getDocumentShareLink, createDocumentShareLink } from "../../api/documents";
import { useAuth } from "../../context/AuthContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { WHATSAPP_CHANNEL_URL } from "../../config/links";

export default function WhatsAppPublishButton({ doc, className = "" }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { siteName } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const buildMessage = (shareUrl) => {
    const lines = [t("whatsapp.newDoc", { siteName }), "", doc.title || t("whatsapp.document")];
    if (doc.description) lines.push("", doc.description.slice(0, 280));
    if (doc.author_name) lines.push("", `${t("whatsapp.author")} : ${doc.author_name}`);
    lines.push("", shareUrl);
    return lines.join("\n");
  };

  const prepare = async () => {
    if (!user) { toast.error(t("whatsapp.loginRequired")); return; }
    if (!user.email_verified) { toast.error(t("whatsapp.verifyRequired")); return; }
    if (doc.visibility === "private") { toast.error(t("whatsapp.privateError")); return; }
    setLoading(true);
    try {
      const res = doc.shareEnabled ? await getDocumentShareLink(doc.id) : await createDocumentShareLink(doc.id);
      const shareUrl = res?.data?.url || `${window.location.origin}/documents/${doc.id}`;
      const text = buildMessage(shareUrl);
      setMessage(text);
      setOpen(true);
      try { await navigator.clipboard.writeText(text); toast.success(t("whatsapp.copiedReady")); } catch { toast.success(t("whatsapp.ready")); }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("whatsapp.prepareError"));
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = async () => {
    try { await navigator.clipboard.writeText(message); toast.success(t("whatsapp.copied")); }
    catch { toast.error(t("whatsapp.copyError")); }
  };

  return (
    <>
      <button type="button" onClick={prepare} disabled={loading} className={className || "flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#1ebe5b] disabled:cursor-not-allowed disabled:opacity-50"}>
        <MessageCircle className="h-5 w-5" />
        {loading ? t("whatsapp.preparing") : t("whatsapp.publish")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="whatsapp-publish-title" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 px-5 py-4">
              <h2 id="whatsapp-publish-title" className="font-semibold text-gray-900 dark:text-slate-100">{t("whatsapp.modalTitle")}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("common.close")} className="rounded-lg p-1.5 text-gray-500 dark:text-slate-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-slate-400">
                <li>{t("whatsapp.step1")}</li><li>{t("whatsapp.step2")}</li><li>{t("whatsapp.step3")}</li>
              </ol>
              <textarea readOnly value={message} rows={8} onFocus={(event) => event.target.select()} className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-3 text-sm text-gray-800 dark:text-slate-200 focus:border-teal-500 focus:outline-none" />
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={copyMessage} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-gray-800 dark:text-slate-200 transition-colors hover:bg-gray-200 dark:hover:bg-slate-700"><Copy className="h-4 w-4" />{t("whatsapp.copyMessage")}</button>
                <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"><ExternalLink className="h-4 w-4" />{t("whatsapp.openChannel")}</a>
              </div>
              <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="block text-center text-sm font-medium text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200">{t("whatsapp.shareVia")}</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
