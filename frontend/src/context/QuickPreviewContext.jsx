import { createContext, useCallback, useContext, useState } from "react";
import QuickPreviewModal from "../components/documents/QuickPreviewModal";

const QuickPreviewContext = createContext(null);

export function QuickPreviewProvider({ children }) {
  const [preview, setPreview] = useState(null);

  const openPreview = useCallback((doc) => {
    if (!doc?.id) return;
    setPreview(doc);
  }, []);

  const closePreview = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <QuickPreviewContext.Provider value={{ preview, openPreview, closePreview }}>
      {children}
      {preview && <QuickPreviewModal doc={preview} onClose={closePreview} />}
    </QuickPreviewContext.Provider>
  );
}

export function useQuickPreview() {
  const ctx = useContext(QuickPreviewContext);
  if (!ctx) {
    throw new Error("useQuickPreview must be used within a QuickPreviewProvider");
  }
  return ctx;
}
