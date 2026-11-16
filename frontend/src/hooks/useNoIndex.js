import { useEffect } from "react";

export default function useNoIndex() {
  useEffect(() => {
    let element = document.head.querySelector('meta[name="robots"]');
    const created = !element;
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute("name", "robots");
      document.head.appendChild(element);
    }
    const previous = element.getAttribute("content");
    element.setAttribute("content", "noindex, nofollow");
    return () => {
      if (created) {
        element.remove();
      } else if (previous) {
        element.setAttribute("content", previous);
      } else {
        element.removeAttribute("content");
      }
    };
  }, []);
}
