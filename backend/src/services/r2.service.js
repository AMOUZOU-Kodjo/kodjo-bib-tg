import path from "path";
import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config/env.js";

const KEY_PREFIX = "r2/";

let clientPromise;

function isConfigured() {
  return Boolean(
    config.r2.bucket &&
    config.r2.accessKeyId &&
    config.r2.secretAccessKey &&
    (config.r2.endpoint || config.r2.accountId)
  );
}

function getEndpoint() {
  return config.r2.endpoint || `https://${config.r2.accountId}.r2.cloudflarestorage.com`;
}

function getClient() {
  if (!isConfigured()) {
    const err = new Error("Stockage R2 non configuré");
    err.code = "R2_NOT_CONFIGURED";
    throw err;
  }
  if (!clientPromise) {
    clientPromise = Promise.resolve(new S3Client({
      region: "auto",
      endpoint: getEndpoint(),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey
      }
    }));
  }
  return clientPromise;
}

export function isR2Configured() {
  return isConfigured();
}

export function isR2Key(key) {
  return typeof key === "string" && key.startsWith(KEY_PREFIX);
}

function buildKey(originalName) {
  const extension = path.extname(String(originalName || "")).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 16);
  return `${KEY_PREFIX}archives/${Date.now()}-${randomUUID()}${extension}`;
}

function contentDisposition(originalName, download) {
  const name = String(originalName || "document");
  const fallback = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(name);
  return `${download ? "attachment" : "inline"}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function uploadR2Object(fileBuffer, originalName, mimeType) {
  const client = await getClient();
  const key = buildKey(originalName);
  await client.send(new PutObjectCommand({
    Bucket: config.r2.bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType || "application/octet-stream"
  }));
  return { public_id: key, secure_url: getEndpoint(), provider: "r2" };
}

export async function replaceR2Object(key, fileBuffer, mimeType) {
  if (!isR2Key(key)) return;
  const client = await getClient();
  await client.send(new PutObjectCommand({
    Bucket: config.r2.bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType || "application/octet-stream"
  }));
}

export async function deleteR2Object(key) {
  if (!isR2Key(key)) return;
  const client = await getClient();
  await client.send(new DeleteObjectCommand({
    Bucket: config.r2.bucket,
    Key: key
  }));
}

export async function getR2SignedUrl({ key, originalName, expiresIn = 300, download = true }) {
  const client = await getClient();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: config.r2.bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition(originalName, download)
    }),
    { expiresIn }
  );
}
