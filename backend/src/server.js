import app from "./app.js";
import { config } from "./config/env.js";
import { pool, startDatabaseKeepAlive } from "./config/db.js";

startDatabaseKeepAlive();

const server = app.listen(config.port, () => {
  console.log(`Serveur démarré sur http://localhost:${config.port}`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

async function shutdown(signal) {
  console.log(`${signal} reçu, arrêt du serveur...`);
  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
