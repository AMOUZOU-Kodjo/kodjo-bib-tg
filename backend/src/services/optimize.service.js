import path from "path";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import JSZip from "jszip";
import initQpdf from "@jspawn/qpdf-wasm/qpdf.mjs";

const OOXML_EXTENSIONS = new Set([".docx", ".xlsx", ".pptx"]);
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const PDF_SIGNATURE_MARKERS = ["/ByteRange", "/Type /Sig", "/Type/Sig"].map((marker) => Buffer.from(marker));
const MAX_ZIP_UNCOMPRESSED_BYTES = 80 * 1024 * 1024;

let qpdfPromise;

function isZip(buffer) {
  return buffer.length >= ZIP_MAGIC.length && buffer.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC);
}

async function loadQpdf() {
  if (!qpdfPromise) {
    qpdfPromise = (async () => {
      const nativeFetch = globalThis.fetch;
      globalThis.fetch = async (url, options) => {
        const target = String(url);
        if (target.endsWith("qpdf.wasm")) {
          return new Response(readFileSync(target), {
            headers: { "Content-Type": "application/wasm" }
          });
        }
        return nativeFetch(url, options);
      };
      try {
        return await initQpdf();
      } finally {
        globalThis.fetch = nativeFetch;
      }
    })();
  }
  return qpdfPromise;
}

async function optimizePdf(buffer) {
  if (PDF_SIGNATURE_MARKERS.some((marker) => buffer.includes(marker))) {
    return buffer;
  }
  const qpdf = await loadQpdf();
  const id = randomUUID();
  const inputPath = `/input-${id}.pdf`;
  const outputPath = `/output-${id}.pdf`;
  qpdf.FS.writeFile(inputPath, buffer);
  try {
    const code = qpdf.callMain([
      inputPath,
      outputPath,
      "--object-streams=generate",
      "--recompress-flate",
      "--compression-level=9",
      "--compress-streams=y"
    ]);
    if (code !== 0) return buffer;
    return Buffer.from(qpdf.FS.readFile(outputPath));
  } finally {
    for (const file of [inputPath, outputPath]) {
      try {
        qpdf.FS.unlink(file);
      } catch {}
    }
  }
}

function entryCompression(entry) {
  return entry._data?.compression?.magic === "\x00\x00" ? "STORE" : "DEFLATE";
}

async function optimizeOfficeZip(buffer) {
  if (!isZip(buffer)) return buffer;
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files);
  if (entries.some((entry) => entry.name.startsWith("_xmlsignatures/"))) {
    return buffer;
  }
  let totalUncompressed = 0;
  for (const entry of entries) {
    totalUncompressed += Number(entry._data?.uncompressedSize) || 0;
    if (totalUncompressed > MAX_ZIP_UNCOMPRESSED_BYTES) {
      throw new Error("archive Office trop volumineuse après décompression");
    }
  }

  const output = new JSZip();
  for (const entry of entries) {
    const metadata = {
      date: entry.date,
      comment: entry.comment,
      unixPermissions: entry.unixPermissions,
      dosPermissions: entry.dosPermissions,
      createFolders: false
    };
    if (entry.dir) {
      output.file(entry.name, null, { ...metadata, dir: true });
      continue;
    }
    const content = await entry.async("nodebuffer");
    output.file(entry.name, content, {
      ...metadata,
      compression: entryCompression(entry),
      compressionOptions: { level: 9 }
    });
  }

  return output.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    platform: "DOS",
    comment: zip.comment || null
  });
}

export async function optimizeDocumentBuffer(buffer, originalName = "", mimeType = "") {
  const ext = path.extname(originalName).toLowerCase();
  try {
    let optimized = buffer;
    if (ext === ".pdf" || mimeType === "application/pdf") {
      optimized = await optimizePdf(buffer);
    } else if (OOXML_EXTENSIONS.has(ext)) {
      optimized = await optimizeOfficeZip(buffer);
    }
    if (optimized.length >= buffer.length) {
      return { buffer, optimized: false, originalSize: buffer.length, finalSize: buffer.length };
    }
    return {
      buffer: optimized,
      optimized: true,
      originalSize: buffer.length,
      finalSize: optimized.length
    };
  } catch (err) {
    console.warn(`Optimisation ignorée pour ${originalName || "fichier"}: ${err.message}`);
    return { buffer, optimized: false, originalSize: buffer.length, finalSize: buffer.length };
  }
}
