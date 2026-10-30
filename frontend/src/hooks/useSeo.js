import { useEffect } from "react";

const DEFAULT_TITLE = "Archives de Documents — Partage et archivage collaboratif";
const DEFAULT_DESCRIPTION = "Plateforme collaborative gratuite pour archiver, classer et partager des documents.";
const DEFAULT_IMAGE = "/og-image.png";

function setMeta(attribute, key, content) {
  if (!content) return;
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", url);
}

export default function useSeo({ title, description, image, url, type = "website", noIndex = false } = {}) {
  useEffect(() => {
    const resolvedTitle = title ? `${title} — Archives de Documents` : DEFAULT_TITLE;
    const resolvedDescription = String(description || DEFAULT_DESCRIPTION).replace(/\s+/g, " ").trim().slice(0, 160);
    const resolvedUrl = url || window.location.href;
    const resolvedImage = new URL(image || DEFAULT_IMAGE, window.location.origin).href;

    document.title = resolvedTitle;
    setMeta("name", "description", resolvedDescription);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
    setMeta("property", "og:title", resolvedTitle);
    setMeta("property", "og:description", resolvedDescription);
    setMeta("property", "og:url", resolvedUrl);
    setMeta("property", "og:type", type);
    setMeta("property", "og:image", resolvedImage);
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", resolvedTitle);
    setMeta("name", "twitter:description", resolvedDescription);
    setMeta("name", "twitter:image", resolvedImage);
    setCanonical(resolvedUrl);
  }, [title, description, image, url, type, noIndex]);
}
