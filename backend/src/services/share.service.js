import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const SHARE_TOKEN_TYPE = "document_share";

export function createDocumentShareToken(documentId, shareVersion, options = {}) {
  return jwt.sign(
    { type: SHARE_TOKEN_TYPE, documentId, shareVersion, allowDownload: options.allowDownload === true },
    config.jwtSecret,
    { expiresIn: "30d" }
  );
}

export function verifyDocumentShareToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  if (payload.type !== SHARE_TOKEN_TYPE) throw new Error("Type de lien invalide");
  if (typeof payload.documentId !== "string") throw new Error("Document invalide");
  if (!Number.isInteger(payload.shareVersion)) throw new Error("Version de partage invalide");
  payload.allowDownload = payload.allowDownload === true;
  return payload;
}

export function getDocumentShareUrl(token, req = null) {
  let backendBase =
    process.env.BACKEND_PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.API_BASE_URL;
  if (!backendBase && req) {
    backendBase = `${req.protocol}://${req.get("host")}`;
  }
  if (!backendBase) {
    backendBase = config.frontendUrl;
  }
  return `${String(backendBase).replace(/\/$/, "")}/share/${token}`;
}
