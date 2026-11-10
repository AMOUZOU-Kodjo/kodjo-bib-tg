import { publishLiveEvent } from "../services/liveUpdates.service.js";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const USER_SCOPES = new Set(["user", "favorites", "downloads", "notifications"]);

export function liveUpdates(req, res, next) {
  if (!MUTATION_METHODS.has(req.method)) return next();

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return;

    const path = (req.originalUrl.split("?")[0].replace(/\/+$/, "") || "/").toLowerCase();
    if (!path.startsWith("/api/") || path.startsWith("/api/auth") || path.startsWith("/api/ai") || path.startsWith("/api/events")) {
      return;
    }

    if (path.endsWith("/view")) return;

    const events = [];
    const add = (scope, options = {}) => {
      if (!events.some((event) => event.scope === scope)) events.push({ scope, options });
    };

    if (path.startsWith("/api/documents")) {
      add("documents");
      if (path.includes("/comments")) add("comments");
      if (path.endsWith("/favorite")) add("favorites", { userId: req.user?.id });
      if (path.endsWith("/download")) {
        add("downloads", { userId: req.user?.id });
        add("user", { userId: req.user?.id });
      }
      if (path.endsWith("/like")) add("documents");
    } else if (path.startsWith("/api/comments")) {
      add("comments");
      add("documents");
    } else if (path.startsWith("/api/notifications")) {
      add("notifications", { userId: req.user?.id });
    } else if (path.startsWith("/api/users")) {
      if (/^\/api\/users\/[^/]+\/follow$/.test(path)) {
        add("users");
        add("user", { userId: req.user?.id });
      } else {
        add("user", { userId: req.user?.id });
      }
    } else if (path.startsWith("/api/admin")) {
      add("admin", { role: "admin" });
      if (path.startsWith("/api/admin/settings")) add("settings");
      if (path.startsWith("/api/admin/documents")) add("documents");
      if (path.startsWith("/api/admin/categories")) {
        add("categories");
        add("documents");
      }
      if (path.startsWith("/api/admin/users")) add("users");
    } else if (path.startsWith("/api/reports") || path.startsWith("/api/contact")) {
      add("admin", { role: "admin" });
    }

    for (const event of events) {
      const options = USER_SCOPES.has(event.scope) && event.options.userId
        ? { userId: event.options.userId }
        : event.options;
      publishLiveEvent(event.scope, {
        path,
        method: req.method
      }, options);
    }
  });

  return next();
}
