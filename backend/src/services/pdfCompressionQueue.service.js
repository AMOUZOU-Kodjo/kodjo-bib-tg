import { Worker } from "node:worker_threads";
import { query } from "../config/db.js";
import { deleteR2Object, isR2Configured, isR2Key, replaceR2Object } from "./r2.service.js";

const WORKER_URL = new URL("../workers/pdfCompression.worker.js", import.meta.url);
const MAX_ACTIVE = 1;
const MAX_QUEUE = 3;
const JOB_TIMEOUT_MS = 15 * 60 * 1000;

const jobs = [];
let active = 0;

export function enqueuePdfCompression(job) {
  if (!job?.documentId || !job?.buffer || !isR2Key(job.key) || !isR2Configured()) {
    return false;
  }
  if (jobs.length >= MAX_QUEUE) {
    console.warn(`Compression arrière-plan ignorée: file pleine (${job.documentId})`);
    return false;
  }
  jobs.push(job);
  processQueue();
  return true;
}

function processQueue() {
  while (active < MAX_ACTIVE && jobs.length > 0) {
    const job = jobs.shift();
    active += 1;
    runJob(job)
      .catch((err) => {
        console.error(`Compression arrière-plan échouée (${job.documentId}):`, err.message);
      })
      .finally(() => {
        active -= 1;
        processQueue();
      });
  }
}

async function runJob(job) {
  const startedAt = Date.now();
  const result = await runWorker(job.buffer);
  if (!result) {
    console.log(`Compression arrière-plan sans gain (${job.documentId})`);
    return;
  }
  if (result.buffer.length >= job.originalSize) {
    console.log(`Compression arrière-plan non retenue (${job.documentId}): ${job.originalSize} -> ${result.buffer.length}`);
    return;
  }
  await replaceR2Object(job.key, result.buffer, job.mimeType);
  const updated = await query(
    "UPDATE documents SET size_bytes = $1 WHERE id = $2 AND cloudinary_public_id = $3 RETURNING id",
    [result.buffer.length, job.documentId, job.key]
  );
  if (updated.rowCount === 0) {
    await deleteR2Object(job.key).catch(() => {});
    console.log(`Compression arrière-plan annulée: document supprimé (${job.documentId})`);
    return;
  }
  console.log(
    `Compression arrière-plan terminée (${job.documentId}): ${job.originalSize} -> ${result.buffer.length} octets en ${Date.now() - startedAt} ms`
  );
}

function runWorker(buffer) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_URL);
    let settled = false;
    let timer;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate().catch(() => {});
      fn(value);
    };
    timer = setTimeout(() => {
      finish(reject, new Error("Délai de compression dépassé"));
    }, JOB_TIMEOUT_MS);
    timer.unref?.();

    worker.once("message", (message) => {
      if (message?.error) {
        finish(reject, new Error(message.error));
        return;
      }
      if (!message?.buffer) {
        finish(resolve, null);
        return;
      }
      const view = message.buffer;
      finish(resolve, {
        buffer: Buffer.from(view.buffer, view.byteOffset, view.byteLength),
        mode: message.mode
      });
    });
    worker.once("error", (err) => finish(reject, err));
    worker.once("exit", (code) => {
      if (!settled) finish(reject, new Error(`Worker de compression arrêté (${code})`));
    });

    try {
      const view = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      worker.postMessage({ buffer: view }, [buffer.buffer]);
    } catch (err) {
      finish(reject, err);
    }
  });
}
