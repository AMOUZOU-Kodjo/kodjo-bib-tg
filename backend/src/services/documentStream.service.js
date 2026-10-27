import { Readable } from "node:stream";
import { getSignedViewUrl } from "./cloudinary.service.js";

export function inlineContentDisposition(filename) {
  const original = String(filename || "document");
  const fallback = original.replace(/[^\x20-\x7E]/g, "_").replace(/["\\\r\n]/g, "_");
  return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(original)}`;
}

export async function streamDocumentFile(doc, req, res, { cacheControl = "private, max-age=300" } = {}) {
  const url = getSignedViewUrl(
    doc.cloudinary_public_id,
    doc.original_filename,
    doc.cloudinary_resource_type
  );
  const range = req.headers.range;
  const headers = { "Accept-Encoding": "identity" };
  if (range) headers.Range = range;

  const response = await fetch(url, { headers });
  if (!response.ok && response.status !== 206) {
    throw new Error("Erreur récupération fichier");
  }

  res.status(response.status);
  res.setHeader("Content-Type", doc.mime_type || response.headers.get("content-type") || "application/octet-stream");
  res.setHeader("Content-Disposition", inlineContentDisposition(doc.original_filename));
  res.setHeader("Cache-Control", cacheControl);
  for (const header of ["content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const value = response.headers.get(header);
    if (value) res.setHeader(header, value);
  }

  if (!response.body) {
    res.end();
    return;
  }
  Readable.fromWeb(response.body)
    .on("error", () => {
      if (!res.destroyed) res.destroy();
    })
    .pipe(res);
}
