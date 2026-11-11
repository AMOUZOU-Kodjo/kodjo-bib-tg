import { config } from "../config/env.js";

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
    kind: "publication"
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
    select: "id,doi,title,display_name,publication_date,primary_location,authorships,abstract_inverted_index"
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
