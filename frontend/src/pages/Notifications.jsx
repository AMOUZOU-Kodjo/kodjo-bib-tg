import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Bell, CheckCheck, FileText, MessageCircle, UserPlus, Flag, Inbox, ChevronRight } from "lucide-react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notifications";
import { formatDate } from "../utils/format";
import { Spinner, EmptyState, Pagination } from "../components/ui";
import useSeo from "../hooks/useSeo";
import { useLiveVersion } from "../context/LiveUpdatesContext";

const TYPE_ICONS = {
  new_document: FileText,
  new_comment: MessageCircle,
  new_follower: UserPlus,
  report_update: Flag
};

const PAGE_SIZE = 20;

export default function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const liveVersion = useLiveVersion("notifications");

  useSeo({
    title: t("notifications.title"),
    description: t("notifications.seoDesc"),
    noIndex: true
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    getNotifications({ page, limit: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setNotifications(res.data.notifications || []);
        setTotal(res.data.total || 0);
        setUnread(res.data.unread || 0);
      })
      .catch(() => {
        if (active) toast.error(t("notifications.loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, t, liveVersion]);

  const openNotification = async (notification) => {
    if (!notification.read_at) {
      setNotifications((list) => list.map((item) => (item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item)));
      setUnread((value) => Math.max(0, value - 1));
      markNotificationRead(notification.id).catch(() => {});
    }
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnread(0);
      setNotifications((list) => list.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    } catch {
      toast.error(t("notifications.markError"));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">
            <Bell className="h-6 w-6 text-teal-700 dark:text-teal-300" />
            {t("notifications.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            {unread > 0 ? t("notifications.unread", { count: unread }) : t("notifications.allRead")}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={readAll}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900"
          >
            <CheckCheck className="h-4 w-4" />
            {t("notifications.markAll")}
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState message={t("notifications.empty")} icon={Inbox} />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Bell;
            const content = (
              <div className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${notification.read_at ? "border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800" : "border-teal-100 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/40"}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notification.read_at ? "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400" : "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{notification.title}</p>
                    {!notification.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />}
                  </div>
                  {notification.message && <p className="mt-0.5 text-sm text-gray-600 dark:text-slate-400">{notification.message}</p>}
                  <p className="mt-1 text-xs text-gray-400">{formatDate(notification.created_at)}</p>
                </div>
                {notification.link && <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-gray-400" />}
              </div>
            );

            return (
              <Link
                key={notification.id}
                to={`/notifications/${notification.id}`}
                onClick={() => openNotification(notification)}
                className="block hover:opacity-90"
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
