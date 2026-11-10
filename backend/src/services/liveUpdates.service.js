const clients = new Set();

export function registerLiveClient(req, res) {
  const client = {
    res,
    userId: req.user?.id || null,
    role: req.user?.role || null
  };
  clients.add(client);

  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      cleanup();
    }
  }, 20000);
  heartbeat.unref?.();

  let closed = false;
  function cleanup() {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    clients.delete(client);
  }

  return cleanup;
}

export function publishLiveEvent(scope, payload = {}, options = {}) {
  if (clients.size === 0) return;
  const event = {
    ...payload,
    scope,
    at: new Date().toISOString()
  };
  const message = `event: change\ndata: ${JSON.stringify(event)}\n\n`;

  const userIds = options.userIds ? new Set(options.userIds) : null;

  for (const client of [...clients]) {
    if (options.userId && client.userId !== options.userId) continue;
    if (userIds && !userIds.has(client.userId)) continue;
    if (options.role && client.role !== options.role) continue;
    try {
      client.res.write(message);
    } catch {
      clients.delete(client);
    }
  }
}
