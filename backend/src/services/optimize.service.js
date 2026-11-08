import path from "path";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import JSZip from "jszip";
import initQpdf from "@jspawn/qpdf-wasm/qpdf.mjs";
import initGhostscript from "@okathira/ghostpdl-wasm";

const OOXML_EXTENSIONS = new Set([".docx", ".xlsx", ".pptx"]);
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const PDF_SIGNATURE_MARKERS = ["/ByteRange", "/Type /Sig", "/Type/Sig"].map((marker) => Buffer.from(marker));
const MAX_ZIP_UNCOMPRESSED_BYTES = 80 * 1024 * 1024;
const PDF_GS_MAX_BYTES = 10 * 1024 * 1024;
const PDF_LOSSLESS_MAX_BYTES = 50 * 1024 * 1024;
const PDF_TARGET_RATIO = 0.6;

let qpdfPromise;
const ghostscriptPromises = new Map();

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

function isPdf(buffer) {
  return buffer.subarray(0, 1024).toString("latin1").includes("%PDF-");
}

function isSignedPdf(buffer) {
  return PDF_SIGNATURE_MARKERS.some((marker) => buffer.includes(marker));
}

async function loadGhostscript(device) {
  if (!ghostscriptPromises.has(device)) {
    const promise = initGhostscript().catch((err) => {
      ghostscriptPromises.delete(device);
      throw err;
    });
    ghostscriptPromises.set(device, promise);
  }
  return ghostscriptPromises.get(device);
}

async function runGhostscript(device, buffer, options) {
  const ghostscript = await loadGhostscript(device);
  const id = randomUUID();
  const inputPath = `/input-${id}.pdf`;
  const outputPath = `/output-${id}.pdf`;
  ghostscript.FS.writeFile(inputPath, buffer);
  try {
    const code = ghostscript.callMain([
      `-sDEVICE=${device}`,
      "-dNOPAUSE",
      "-dBATCH",
      "-dQUIET",
      ...options,
      `-sOutputFile=${outputPath}`,
      inputPath
    ]);
    if (code !== 0) return null;
    return Buffer.from(ghostscript.FS.readFile(outputPath));
  } finally {
    for (const file of [inputPath, outputPath]) {
      try {
        ghostscript.FS.unlink(file);
      } catch {}
    }
  }
}

async function optimizePdfLossless(buffer) {
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
    if (code !== 0) return null;
    return Buffer.from(qpdf.FS.readFile(outputPath));
  } finally {
    for (const file of [inputPath, outputPath]) {
      try {
        qpdf.FS.unlink(file);
      } catch {}
    }
  }
}

async function optimizePdf(buffer) {
  if (!isPdf(buffer) || isSignedPdf(buffer) || buffer.length > PDF_LOSSLESS_MAX_BYTES) {
    return { buffer, mode: "none", targetReached: false };
  }
  const targetSize = Math.floor(buffer.length * PDF_TARGET_RATIO);
  let best = null;

  try {
    const lossless = await optimizePdfLossless(buffer);
    if (lossless && lossless.length < buffer.length) {
      best = { buffer: lossless, mode: "lossless" };
      if (lossless.length <= targetSize) {
        return { ...best, targetReached: true };
      }
    }
  } catch (err) {
    console.warn(`Compression qpdf ignorée: ${err.message}`);
  }

  if (buffer.length > PDF_GS_MAX_BYTES) {
    return best ? { ...best, targetReached: best.buffer.length <= targetSize } : { buffer, mode: "none", targetReached: false };
  }

  try {
    const ebook = await runGhostscript("pdfwrite", buffer, [
      "-dSAFER",
      "-dCompatibilityLevel=1.5",
      "-dAutoRotatePages=/None",
      "-dPDFSETTINGS=/ebook",
      "-dDetectDuplicateImages=true",
      "-dCompressFonts=true",
      "-dSubsetFonts=true",
      "-dEmbedAllFonts=true",
      "-dDownsampleColorImages=true",
      "-dColorImageResolution=150",
      "-dDownsampleGrayImages=true",
      "-dGrayImageResolution=150",
      "-dDownsampleMonoImages=true",
      "-dMonoImageResolution=300"
    ]);
    if (ebook && ebook.length < buffer.length && (!best || ebook.length < best.buffer.length)) {
      best = { buffer: ebook, mode: "ebook" };
    }
  } catch (err) {
    console.warn(`Compression Ghostscript ignorée: ${err.message}`);
  }

  if (best) {
    return { ...best, targetReached: best.buffer.length <= targetSize };
  }

  return { buffer, mode: "none", targetReached: false };
}

export async function createPdfFirstPagePreview(buffer) {
  if (!isPdf(buffer)) return null;
  const id = randomUUID();
  const inputPath = `/preview-input-${id}.pdf`;
  const outputPath = `/preview-output-${id}.jpg`;
  try {
    const ghostscript = await loadGhostscript("jpeg");
    ghostscript.FS.writeFile(inputPath, buffer);
    try {
      const code = ghostscript.callMain([
        "-sDEVICE=jpeg",
        "-dNOPAUSE",
        "-dBATCH",
        "-dQUIET",
        "-dSAFER",
        "-dFirstPage=1",
        "-dLastPage=1",
        "-r120",
        "-dJPEGQ=82",
        "-dTextAlphaBits=4",
        "-dGraphicsAlphaBits=4",
        `-sOutputFile=${outputPath}`,
        inputPath
      ]);
      if (code !== 0) return null;
      return Buffer.from(ghostscript.FS.readFile(outputPath));
    } finally {
      for (const file of [inputPath, outputPath]) {
        try {
          ghostscript.FS.unlink(file);
        } catch {}
      }
    }
  } catch (err) {
    console.warn(`Génération de l'aperçu PDF ignorée: ${err.message}`);
    return null;
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
    let mode = "none";
    let targetReached = false;
    if (ext === ".pdf" || mimeType === "application/pdf") {
      const result = await optimizePdf(buffer);
      optimized = result.buffer;
      mode = result.mode;
      targetReached = result.targetReached;
    } else if (OOXML_EXTENSIONS.has(ext)) {
      optimized = await optimizeOfficeZip(buffer);
      mode = optimized.length < buffer.length ? "lossless" : "none";
    }
    if (optimized.length >= buffer.length) {
      return { buffer, optimized: false, originalSize: buffer.length, finalSize: buffer.length, mode: "none", targetReached: false };
    }
    return {
      buffer: optimized,
      optimized: true,
      originalSize: buffer.length,
      finalSize: optimized.length,
      mode,
      targetReached
    };
  } catch (err) {
    console.warn(`Optimisation ignorée pour ${originalName || "fichier"}: ${err.message}`);
    return { buffer, optimized: false, originalSize: buffer.length, finalSize: buffer.length, mode: "none", targetReached: false };
  }
}
