import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PageCanvas({ pdf, pageNumber, width }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pdf || !width) return;
    let cancelled = false;
    const render = async () => {
      setLoading(true);
      setError(false);
      try {
        const pdfPage = await pdf.getPage(pageNumber);
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
    render();
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, width]);

  if (error) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-sm text-gray-500 dark:text-slate-400">
        {pageNumber}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      )}
      <canvas ref={canvasRef} className="block mx-auto shadow-sm" />
    </div>
  );
}

export default function PdfPreview({ src, title }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadingTask = pdfjsLib.getDocument({ url: src });
    setLoading(true);
    setError(false);
    setPdf(null);
    setNumPages(0);

    loadingTask.promise
      .then((loadedPdf) => {
        if (cancelled) {
          loadedPdf.destroy().catch(() => {});
          return;
        }
        setPdf(loadedPdf);
        setNumPages(loadedPdf.numPages);
        setLoading(false);
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
    return () => {
      pdf?.destroy().catch(() => {});
    };
  }, [pdf]);

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
      <div
        ref={containerRef}
        className="relative w-full overflow-auto max-h-[65vh] md:max-h-[900px] min-h-[320px]"
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 text-sm text-gray-600 dark:bg-slate-900/80 dark:text-slate-400" aria-live="polite">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            {t("document.loadingFullPreview")}
          </div>
        )}
        {!loading && pdf && numPages > 0 && (
          <div className="flex flex-col items-center gap-4 py-4">
            {Array.from({ length: numPages }, (_, i) => (
              <PageCanvas key={i + 1} pdf={pdf} pageNumber={i + 1} width={width} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
