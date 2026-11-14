import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bell, CheckCheck, ExternalLink, FileText, Flag, MessageCircle, UserPlus } from "lucide-react";
import { getNotification, markNotificationRead } from "../api/notifications";
import { formatDate } from "../utils/format";
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
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-700 dark:text-slate-300">
                {notification.message}
              </p>
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
