const url = process.env.KEEP_ALIVE_URL || "https://kodjo-bib-backend.onrender.com/api/health";
const intervalMs = Number(process.env.KEEP_ALIVE_INTERVAL_MS || 0);
const timeoutMs = Number(process.env.KEEP_ALIVE_TIMEOUT_MS || 30000);

async function ping() {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "kodjo-bib-keep-alive" }
    });
    const body = await res.text();
    console.log(`[keep-alive] ${new Date().toISOString()} ${res.status} ${Date.now() - started}ms ${body.slice(0, 200)}`);
    return res.ok;
  } catch (err) {
    console.error(`[keep-alive] ${new Date().toISOString()} erreur: ${err.message}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const ok = await ping();

if (intervalMs > 0) {
  console.log(`[keep-alive] mode boucle, ping toutes les ${Math.round(intervalMs / 1000)}s`);
  setInterval(ping, intervalMs);
} else {
  process.exit(ok ? 0 : 1);
}
