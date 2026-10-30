import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notifications";
import { formatDate } from "../../utils/format";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getNotifications({ limit: 8 })
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setUnread(res.data.unread || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnread(0);
      return;
    }
    load();
    const interval = window.setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, load]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const openNotification = async (notification) => {
    setOpen(false);
    if (!notification.read_at) {
      setUnread((value) => Math.max(0, value - 1));
      setNotifications((list) => list.map((item) => (item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item)));
      markNotificationRead(notification.id).catch(() => {});
    }
    navigate(notification.link || "/notifications");
  };

  const readAll = async () => {
    setUnread(0);
    setNotifications((list) => list.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) load();
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-[18px] text-slate-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[4.5rem] z-[70] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unread > 0 && (
              <button onClick={readAll} className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline">
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lire
              </button>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">Chargement...</p>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <Inbox className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">Aucune notification pour le moment.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      onClick={() => openNotification(notification)}
                      className={`block w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${notification.read_at ? "" : "bg-teal-50/40"}`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />}
                        <div className={`min-w-0 ${notification.read_at ? "pl-4" : ""}`}>
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          {notification.message && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{notification.message}</p>}
                          <p className="mt-1 text-[11px] text-gray-400">{formatDate(notification.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-teal-700 hover:bg-gray-50"
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}
