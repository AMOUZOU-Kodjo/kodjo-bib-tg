import { parentPort } from "node:worker_threads";
import { compressPdfHeavy } from "../services/optimize.service.js";

parentPort.once("message", async (message) => {
  try {
    const view = message?.buffer;
    if (!view) {
      parentPort.postMessage(null);
      return;
    }
    const input = Buffer.from(view.buffer, view.byteOffset, view.byteLength);
    const result = await compressPdfHeavy(input);
    if (!result) {
      parentPort.postMessage(null);
      return;
    }
    parentPort.postMessage(
      { buffer: result.buffer, mode: result.mode },
      [result.buffer.buffer]
    );
  } catch (err) {
    parentPort.postMessage({ error: err.message });
  }
});
