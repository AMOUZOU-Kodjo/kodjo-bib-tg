import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Flag, X } from "lucide-react";
import { createReport } from "../../api/reports";

export default function ReportModal({ documentId, commentId, targetLabel, onClose }) {
  const { t } = useTranslation();
  const reasons = [
    { value: "spam", label: t("report.spam") },
    { value: "inappropriate", label: t("report.inappropriate") },
    { value: "copyright", label: t("report.copyright") },
    { value: "misleading", label: t("report.misleading") },
    { value: "other", label: t("report.other") }
  ];
  const [reason, setReason] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await createReport({ ...(documentId ? { documentId } : {}), ...(commentId ? { commentId } : {}), reason, details: details.trim() });
      toast.success(t("report.sent"));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("report.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white dark:bg-slate-800 p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40"><Flag className="h-5 w-5 text-red-600" /></div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{t("report.title")}</h2>
              {targetLabel && <p className="line-clamp-1 text-sm text-gray-500 dark:text-slate-400">{targetLabel}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300" aria-label={t("common.close")}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="report-reason" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{t("report.reason")}</label>
            <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-600">
              {reasons.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="report-details" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{t("report.details")}</label>
            <textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={4} maxLength={1000} placeholder={t("report.detailsPlaceholder")} className="w-full resize-y rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-600" />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="w-full rounded-lg bg-gray-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 sm:w-auto">{t("common.cancel")}</button>
            <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 sm:w-auto"><Flag className="h-4 w-4" />{sending ? t("report.sending") : t("report.submit")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
