import express from "express";
import { optionalAuth } from "../middlewares/auth.js";
import { registerLiveClient } from "../services/liveUpdates.service.js";

const router = express.Router();

router.get("/", optionalAuth, (req, res) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write("event: ready\ndata: {}\n\n");

  const cleanup = registerLiveClient(req, res);
  req.on("close", cleanup);
  req.on("aborted", cleanup);
});

export default router;
