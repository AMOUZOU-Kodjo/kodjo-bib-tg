import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const SHARE_TOKEN_TYPE = "document_share";

export function createDocumentShareToken(documentId, shareVersion) {
  return jwt.sign(
    { type: SHARE_TOKEN_TYPE, documentId, shareVersion },
    config.jwtSecret,
    { expiresIn: "30d" }
  );
}

export function verifyDocumentShareToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  if (payload.type !== SHARE_TOKEN_TYPE) throw new Error("Type de lien invalide");
  if (typeof payload.documentId !== "string") throw new Error("Document invalide");
  if (!Number.isInteger(payload.shareVersion)) throw new Error("Version de partage invalide");
  return payload;
}

export function getDocumentShareUrl(token) {
  return `${config.frontendUrl}/share/${token}`;
}
