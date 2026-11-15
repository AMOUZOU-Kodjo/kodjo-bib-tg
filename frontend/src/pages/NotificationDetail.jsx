import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bell, CheckCheck, Download, ExternalLink, FileText, Flag, Image as ImageIcon, MessageCircle, Paperclip, UserPlus } from "lucide-react";
import { getNotification, markNotificationRead } from "../api/notifications";
import { formatDate, formatSize } from "../utils/format";
import { EmptyState, Spinner } from "../components/ui";
import useSeo from "../hooks/useSeo";

const TYPE_ICONS = {
  new_document: FileText,
  new_comment: MessageCircle,
  new_follower: UserPlus,
  report_update: Flag,
  credit_order: CheckCheck,
  credit_order_update: CheckCheck,
  admin_broadcast: Bell
};

export default function NotificationDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSeo({
    title: t("notifications.detailTitle"),
    description: t("notifications.seoDesc"),
    noIndex: true
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getNotification(id)
      .then((res) => {
        if (!active) return;
        const item = res.data.notification;
        setNotification(item);
        if (!item.read_at) {
          markNotificationRead(item.id).catch(() => {});
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.status === 404 ? t("notifications.notFound") : t("notifications.loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, t]);

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (error || !notification) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState message={error || t("notifications.notFound")} icon={Bell} />
        <div className="mt-4 text-center">
          <Link to="/notifications" className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300">
            {t("notifications.backToList")}
          </Link>
        </div>
      </div>
    );
  }

  const Icon = TYPE_ICONS[notification.type] || Bell;
  const attachments = Array.isArray(notification.attachments) ? notification.attachments : [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/notifications"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("notifications.backToList")}
      </Link>

      <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl">{notification.title}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                <CheckCheck className="h-3.5 w-3.5" />
                {t("notifications.read")}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">{formatDate(notification.created_at)}</p>
            {notification.message && (
              <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700 dark:text-slate-300">
                {notification.message}
              </p>
            )}
            {attachments.length > 0 && (
              <section className="mt-6 border-t border-gray-100 pt-5 dark:border-slate-700">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Paperclip className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t("notifications.attachments")}</h2>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                    {t("notifications.attachmentsCount", { count: attachments.length })}
                  </span>
                </div>
                <div className="space-y-3">
                  {attachments.map((file, index) => {
                    const mimeType = String(file.mime_type || "");
                    const isImage = mimeType.startsWith("image/");
                    const isPdf = mimeType === "application/pdf";
                    return (
                      <div key={`${file.filename}-${index}`} className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                        {isImage && file.url && (
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="block bg-gray-50 dark:bg-slate-900">
                            <img src={file.url} alt={file.filename} className="max-h-80 w-full object-contain" loading="lazy" />
                          </a>
                        )}
                        {isPdf && file.url && (
                          <iframe src={file.url} title={file.filename} className="h-80 w-full bg-gray-50 dark:bg-slate-900" />
                        )}
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                              {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{file.filename}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{formatSize(file.size)}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {file.url && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                              >
                                {t("notifications.openAttachment")}
                              </a>
                            )}
                            {file.download_url && (
                              <a
                                href={file.download_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                              >
                                <Download className="h-3.5 w-3.5" />
                                {t("notifications.downloadAttachment")}
                              </a>
                            )}
                          </div>
                        </div>
                        {!file.url && !file.download_url && (
                          <p className="px-4 pb-4 text-xs text-gray-500 dark:text-slate-400">{t("notifications.attachmentUnavailable")}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {notification.link && (
              <Link
                to={notification.link}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                <ExternalLink className="h-4 w-4" />
                {t("notifications.openRelated")}
              </Link>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
