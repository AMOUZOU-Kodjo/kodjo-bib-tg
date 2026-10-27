import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { config } from "./config/env.js";
import { query, touchDatabaseActivity } from "./config/db.js";
import { setupRoutes } from "./routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

let frontendOrigin = null;
try {
  frontendOrigin = new URL(config.frontendUrl).origin;
} catch {
  frontendOrigin = null;
}
const frameAncestors = frontendOrigin ? ["'self'", frontendOrigin] : ["'self'"];

app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "frame-ancestors": frameAncestors
    }
  }
}));
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev", { skip: (req) => req.originalUrl.startsWith("/api/share/") || req.originalUrl.startsWith("/share/") }));
app.use((req, res, next) => {
  touchDatabaseActivity();
  next();
});

app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch (err) {
    res.status(500).json({ error: { code: "DB_ERROR", message: "Base de données indisponible" } });
  }
});

setupRoutes(app);

app.use((req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route introuvable" } });
});

app.use(errorHandler);

export default app;
