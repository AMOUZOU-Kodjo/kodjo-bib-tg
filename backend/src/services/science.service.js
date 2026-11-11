import { config } from "../config/env.js";
import { classifyContent, getContentCategories } from "./contentCategories.js";

const OPENALEX_URL = "https://api.openalex.org/works";
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_LIMIT = 25;

let cache = { publications: [], updatedAt: 0 };

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== "object") return "";
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) {
      if (Number.isInteger(position) && position >= 0) words[position] = word;
    }
  }
  return words.filter(Boolean).join(" ");
}

const OPENALEX_FIELD_MAP = [
  [/medicine|health|clinical|nursing|pharmacy|dentistry|veterinary/i, "sante"],
  [/agricultural|biological|ecology|environment|earth|planetary|physics|chemistry|mathematics|computer|engineering|materials|energy/i, "sciences"],
  [/business|management|economics|finance|accounting/i, "societe"],
  [/psychology|social|sociology|political|law|education|arts|humanities|history|philosophy|literature|linguistics/i, "societe"]
];

function mapOpenAlexCategory(work) {
  const topic = work.primary_topic || {};
  const domain = (topic.domain || {}).display_name || "";
  const field = (topic.field || {}).display_name || "";
  const subfield = (topic.subfield || {}).display_name || "";
  const haystack = `${domain} ${field} ${subfield}`;

  if (/health sciences/i.test(domain)) return "sante";
  if (/life sciences/i.test(domain)) {
    if (/medicine|health/i.test(field)) return "sante";
    return "sciences";
  }
  if (/physical sciences/i.test(domain)) return "sciences";
  if (/social sciences/i.test(domain)) {
    if (/education/i.test(field)) return "education";
    if (/arts|humanities/i.test(field)) {
      if (/history/i.test(field)) return "histoire";
      if (/philosophy/i.test(field)) return "philosophie";
      if (/literature|linguistics/i.test(field)) return "litterature";
      return "art";
    }
    if (/psychology/i.test(field)) return "sante";
    return "societe";
  }

  for (const [pattern, slug] of OPENALEX_FIELD_MAP) {
    if (pattern.test(haystack)) return slug;
  }

  return classifyContent(work.title || work.display_name || "", reconstructAbstract(work.abstract_inverted_index));
}

function toPublication(work) {
  const authors = (work.authorships || [])
    .map((authorship) => authorship.author?.display_name)
    .filter(Boolean)
    .slice(0, 4);
  const source = work.primary_location?.source;
  const url = work.doi || work.primary_location?.landing_page_url || work.id;
  const abstract = reconstructAbstract(work.abstract_inverted_index);

  return {
    id: work.id || url,
    title: work.title || work.display_name || "",
    description: abstract.slice(0, 360),
    url,
    image: null,
    source: source?.display_name || "OpenAlex",
    sourceUrl: source?.homepage_url || "https://openalex.org",
    publishedAt: work.publication_date ? `${work.publication_date}T00:00:00.000Z` : null,
    authors,
    doi: work.doi || null,
    external: true,
    kind: "publication",
    category: mapOpenAlexCategory(work)
  };
}

export async function getScientificPublications({ force = false, limit = 12 } = {}) {
  if (!force && cache.publications.length > 0 && Date.now() - cache.updatedAt < CACHE_TTL_MS) {
    return cache;
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), MAX_LIMIT);
  const today = new Date();
  const from = new Date(today);
  from.setFullYear(from.getFullYear() - 1);
  const params = new URLSearchParams({
    filter: [
      "institutions.country_code:TG",
      `from_publication_date:${from.toISOString().slice(0, 10)}`,
      `to_publication_date:${today.toISOString().slice(0, 10)}`,
      "type:article"
    ].join(","),
    sort: "publication_date:desc",
    "per-page": String(safeLimit),
    select: "id,doi,title,display_name,publication_date,primary_location,authorships,abstract_inverted_index,primary_topic"
  });
  if (config.contactEmail) params.set("mailto", config.contactEmail);

  const response = await fetch(`${OPENALEX_URL}?${params}`, {
    headers: { "User-Agent": `Mozilla/5.0 (compatible; ArchiviaScienceBot/1.0; +${config.frontendUrl})` },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    throw new Error(`OpenAlex a répondu ${response.status}`);
  }

  const data = await response.json();
  const publications = (data.results || [])
    .map(toPublication)
    .filter((publication) => publication.title && publication.url);

  cache = { publications, updatedAt: Date.now() };
  return cache;
}
