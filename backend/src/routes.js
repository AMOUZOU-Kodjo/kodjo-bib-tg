import authRoutes from "./routes/auth.routes.js";
import documentsRoutes from "./routes/documents.routes.js";
import commentsRoutes from "./routes/comments.routes.js";
import usersRoutes from "./routes/users.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import shareRoutes from "./routes/share.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import seoRoutes from "./routes/seo.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import { globalLimiter } from "./middlewares/rateLimit.js";

export function setupRoutes(app) {
  app.use(globalLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentsRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api", commentsRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/share", shareRoutes);
  app.use("/share", shareRoutes);
  app.use(seoRoutes);
}
