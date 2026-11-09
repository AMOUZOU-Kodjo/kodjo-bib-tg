import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfPreview({ src, title }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadingTask = pdfjsLib.getDocument({ url: src });
    setLoading(true);
    setError(false);
    setNumPages(0);
    setPage(1);

    loadingTask.promise
      .then((pdf) => {
        if (cancelled) {
          pdf.destroy().catch(() => {});
          return;
        }
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Impossible de charger l'aperçu PDF:", err.message);
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      loadingTask.destroy().catch(() => {});
      pdfRef.current?.destroy().catch(() => {});
      pdfRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const updateWidth = () => {
      const nextWidth = Math.max(0, Math.floor(element.clientWidth));
      setWidth((current) => (Math.abs(current - nextWidth) < 1 ? current : nextWidth));
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdfRef.current || !numPages || !width) return;
    let cancelled = false;

    const renderPage = async () => {
      setLoading(true);
      setError(false);
      try {
        renderTaskRef.current?.cancel();
        const pdfPage = await pdfRef.current.getPage(page);
        if (cancelled) return;
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({ scale: width / baseViewport.width });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const renderTask = pdfPage.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
          transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0]
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (!cancelled && err?.name !== "RenderingCancelledException") {
          console.error("Impossible d'afficher la page PDF:", err.message);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    renderPage();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [page, numPages, width]);

  if (error) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
        <FileText className="h-10 w-10 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-slate-400">{t("document.pdfPreviewError")}</p>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          {t("document.openNewTab")}
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-950">
      <div ref={containerRef} className="relative flex max-h-[65vh] min-h-[320px] w-full justify-center overflow-auto md:max-h-[900px]">
        <canvas ref={canvasRef} aria-label={title} className="block" />
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 text-sm text-gray-600 dark:bg-slate-900/80 dark:text-slate-400" aria-live="polite">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            {t("document.loadingFullPreview")}
          </div>
        )}
      </div>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-gray-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            aria-label={t("pagination.previousLabel")}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
            {t("document.pdfPreviewPage", { page, total: numPages })}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(numPages, current + 1))}
            disabled={page >= numPages}
            aria-label={t("pagination.nextLabel")}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
