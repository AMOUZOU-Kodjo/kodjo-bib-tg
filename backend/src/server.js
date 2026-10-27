import app from "./app.js";
import { config } from "./config/env.js";
import { startDatabaseKeepAlive } from "./config/db.js";

startDatabaseKeepAlive();

const server = app.listen(config.port, () => {
  console.log(`Serveur démarré sur http://localhost:${config.port}`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
