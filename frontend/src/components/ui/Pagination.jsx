export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(1, page), totalPages);

  return (
    <nav className="flex items-center justify-start gap-1 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        aria-label="Page précédente"
        className="shrink-0 px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed sm:px-3"
      >
        « <span className="hidden sm:inline">Précédent</span><span className="sm:hidden">Préc.</span>
      </button>
      {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
        let p;
        if (totalPages <= 10) p = i + 1;
        else if (currentPage <= 5) p = i + 1;
        else if (currentPage >= totalPages - 4) p = totalPages - 9 + i;
        else p = currentPage - 4 + i;
        return (
          <button
            type="button"
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`h-8 w-8 shrink-0 rounded-lg text-sm font-medium sm:h-9 sm:w-9 ${p === currentPage ? "bg-teal-700 text-white" : "text-gray-700 hover:bg-gray-100"}`}
          >
            {p}
          </button>
        );
      })}
      {totalPages > 10 && currentPage < totalPages - 4 && (
        <>
          <span className="shrink-0 px-2 text-gray-400">...</span>
          <button type="button" onClick={() => onPageChange(totalPages)} className="h-8 w-8 shrink-0 rounded-lg text-sm text-gray-700 hover:bg-gray-100 sm:h-9 sm:w-9">{totalPages}</button>
        </>
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        aria-label="Page suivante"
        className="shrink-0 px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed sm:px-3"
      >
        <span className="hidden sm:inline">Suivant</span><span className="sm:hidden">Suiv.</span> »
      </button>
    </nav>
  );
}
