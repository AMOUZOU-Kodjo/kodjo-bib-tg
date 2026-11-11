import { config } from "../config/env.js";
import { classifyContent } from "./contentCategories.js";

const TOGO_FEEDS = [
  { name: "Togo Officiel", url: "https://www.republiquetogolaise.tg/obrss/feed-rtg", site: "https://www.republiquetogolaise.tg" },
  { name: "Togo-Presse", url: "https://togopresse.tg/feed/", site: "https://togopresse.tg" },
  { name: "Icilome", url: "https://icilome.com/feed/", site: "https://icilome.com" },
  { name: "Journal du Togo", url: "https://www.journaldutogo.com/feed/", site: "https://www.journaldutogo.com" },
  { name: "Togo En Live", url: "https://togoenlive.tg/feed", site: "https://togoenlive.tg" }
];

const SCIENCE_KEYWORDS = [
  "science", "scientifique", "recherche", "étude", "etude", "santé", "sante",
  "médecine", "medecine", "maladie", "vaccin", "climat", "environnement",
  "biodiversité", "biodiversite", "agriculture", "technologie", "numérique",
  "numerique", "intelligence artificielle", "énergie", "energie", "eau",
  "océan", "ocean", "espace", "chercheur", "université", "universite"
];

const SCIENCE_FEEDS = [
  { name: "OMS Afrique", url: "https://www.afro.who.int/rss.xml", site: "https://www.afro.who.int", maxItems: 10, exclude: ["newsletter"] },
  { name: "IRD", url: "https://www.ird.fr/rss.xml", site: "https://www.ird.fr", maxItems: 10, exclude: ["/intranet/", "retraite", "doctorant", "candidature", "concours", "appel à projets", "pouvoir d'achat"] },
  { name: "CNRS", url: "https://www.cnrs.fr/fr/rss/news.rss", site: "https://www.cnrs.fr", maxItems: 10, exclude: ["test seb", "/newsletter/"] },
  { name: "ScienceDaily", url: "https://www.sciencedaily.com/rss/all.xml", site: "https://www.sciencedaily.com", maxItems: 10 },
  { name: "Phys.org", url: "https://phys.org/rss-feed/", site: "https://phys.org", maxItems: 10 },
  { name: "Nature", url: "https://www.nature.com/nature.rss", site: "https://www.nature.com", maxItems: 10 },
  { name: "Science", url: "https://www.science.org/rss/news_current.xml", site: "https://www.science.org", maxItems: 10 },
  { name: "The Conversation Afrique", url: "https://theconversation.com/africa/articles.atom", site: "https://theconversation.com/africa", maxItems: 10, keywords: SCIENCE_KEYWORDS },
  { name: "The Conversation France", url: "https://theconversation.com/fr/articles.atom", site: "https://theconversation.com/fr", maxItems: 10, keywords: SCIENCE_KEYWORDS }
];

const FEEDS = [...TOGO_FEEDS, ...SCIENCE_FEEDS];

const CACHE_TTL_MS = 10 * 60 * 1000;
const IMAGE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const IMAGE_FAILURE_TTL_MS = 10 * 60 * 1000;
const ARTICLE_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_IMAGE_FETCHES = 40;
const IMAGE_FETCH_CONCURRENCY = 8;
const USER_AGENT = `Mozilla/5.0 (compatible; ArchiviaNewsBot/1.0; +${config.frontendUrl})`;

const CONTENT_CLASSES = [
  "entry-content",
  "post-content",
  "article-content",
  "article-body",
  "td-post-content",
  "content-article",
  "post-entry",
  "entry-body",
  "story-body"
];

const ALLOWED_TAGS = new Set([
  "p", "br", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i",
  "blockquote", "figure", "figcaption", "img", "a", "table", "thead", "tbody",
  "tr", "td", "th", "hr"
]);

const ALLOWED_ATTRS = {
  a: new Set(["href", "title"]),
  img: new Set(["src", "alt", "title", "width", "height"])
};

const ALLOWED_HOSTS = new Set(
  FEEDS.map((feed) => new URL(feed.site).hostname.replace(/^www\./i, "").toLowerCase())
);

let cache = { articles: [], updatedAt: 0 };
let lightCache = { articles: [], updatedAt: 0 };
const scienceCache = { articles: [], updatedAt: 0 };
const scienceLightCache = { articles: [], updatedAt: 0 };
const imageCache = new Map();
const articleCache = new Map();

function normalizeHost(host) {
  return host.replace(/^www\./i, "").toLowerCase();
}

function decodeEntities(value = "") {
  const named = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…",
    ndash: "–", mdash: "—", eacute: "é", egrave: "è", agrave: "à",
    ccedil: "ç", ugrave: "ù", ecirc: "ê", ocirc: "ô", icirc: "î",
    acirc: "â", euro: "€", deg: "°"
  };
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z][a-z0-9]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function stripHtml(value = "") {
  return decodeEntities(
    String(value)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ").trim();
}

function firstTag(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return match[1];
  }
  return "";
}

function extractLink(block) {
  const direct = firstTag(block, ["link", "guid"]);
  if (direct) {
    const value = stripHtml(direct);
    if (/^https?:\/\//i.test(value)) return value;
  }
  const atom = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (atom) return decodeEntities(atom[1]);
  return "";
}

function extractImage(block, content) {
  const enclosure = block.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (enclosure) return decodeEntities(enclosure[1]);
  const media = block.match(/<media:(?:content|thumbnail)\b[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (media) return decodeEntities(media[1]);
  const img = String(content).match(/<img\b[^>]*src=["']([^"']+)["']/i);
  if (img) return decodeEntities(img[1]);
  return null;
}

function parseFeed(xml, feed) {
  const blocks = [
    ...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi),
    ...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)
  ].map((match) => match[1]);

  const articles = blocks.flatMap((block) => {
    const title = stripHtml(firstTag(block, ["title"]));
    const url = extractLink(block);
    if (!title || !url) return [];
    const rawContent = firstTag(block, ["content:encoded", "description", "summary", "content"]);
    const description = stripHtml(rawContent).slice(0, 320);
    if (feed.keywords?.length) {
      const haystack = `${title} ${description}`.toLowerCase();
      if (!feed.keywords.some((keyword) => haystack.includes(keyword))) return [];
    }
    if (feed.exclude?.length) {
      const haystack = `${title} ${description} ${url}`.toLowerCase();
      if (feed.exclude.some((term) => haystack.includes(term))) return [];
    }
    const image = extractImage(block, rawContent);
    const rawDate = stripHtml(firstTag(block, ["pubDate", "published", "updated", "dc:date"]));
    const parsedDate = rawDate ? new Date(rawDate) : null;
    return [{
      id: url,
      title,
      description,
      url,
      image,
      source: feed.name,
      sourceUrl: feed.site,
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
      category: classifyContent(title, description)
    }];
  });
  return feed.maxItems ? articles.slice(0, feed.maxItems) : articles;
}

async function fetchText(url, timeout = 12000) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8"
    },
    signal: AbortSignal.timeout(timeout)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml"
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`${feed.name}: HTTP ${response.status}`);
  const xml = await response.text();
  return parseFeed(xml, feed);
}

function isAllowedArticleUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:")
      && ALLOWED_HOSTS.has(normalizeHost(url.hostname));
  } catch {
    return false;
  }
}

function resolveUrl(value, baseUrl) {
  try {
    const url = new URL(decodeEntities(value), baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function getMetaContent(html, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta\\b[^>]*property=["']${escapedKey}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*property=["']${escapedKey}["']`, "i"),
    new RegExp(`<meta\\b[^>]*name=["']${escapedKey}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*name=["']${escapedKey}["']`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]);
  }
  return "";
}

function extractPageMeta(html, baseUrl) {
  const title = stripHtml(
    getMetaContent(html, "og:title")
    || getMetaContent(html, "twitter:title")
    || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    || ""
  );
  const rawImage = getMetaContent(html, "og:image")
    || getMetaContent(html, "twitter:image")
    || getMetaContent(html, "twitter:image:src");
  const image = rawImage ? resolveUrl(rawImage, baseUrl) : null;
  const description = stripHtml(
    getMetaContent(html, "og:description")
    || getMetaContent(html, "description")
    || getMetaContent(html, "twitter:description")
  );
  const rawDate = getMetaContent(html, "article:published_time")
    || getMetaContent(html, "og:updated_time")
    || html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1]
    || "";
  const date = rawDate ? new Date(rawDate) : null;
  return {
    title,
    image,
    description,
    publishedAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null
  };
}

function removeNonContent(html) {
  return String(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg|iframe|form|button|input|select|textarea|link|meta)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(script|style|noscript|template|svg|iframe|form|button|input|select|textarea|link|meta)\b[^>]*\/?>/gi, " ")
    .replace(/<(nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
}

function extractElementContent(html, start, tagName) {
  const tagPattern = new RegExp(`<${tagName}\\b[^>]*>|</${tagName}>`, "gi");
  tagPattern.lastIndex = start;
  let depth = 1;
  let match;
  while ((match = tagPattern.exec(html))) {
    if (match[0][1] === "/") depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(start, match.index);
  }
  return html.slice(start);
}

function extractElementByClass(html, className) {
  const openPattern = new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, "i");
  const match = openPattern.exec(html);
  if (!match) return "";
  return extractElementContent(html, match.index + match[0].length, match[1].toLowerCase());
}

function extractElementByTag(html, tagName) {
  const openPattern = new RegExp(`<${tagName}\\b[^>]*>`, "i");
  const match = openPattern.exec(html);
  if (!match) return "";
  return extractElementContent(html, match.index + match[0].length, tagName);
}

function extractArticleContent(html) {
  const cleaned = removeNonContent(html);
  for (const className of CONTENT_CLASSES) {
    const content = extractElementByClass(cleaned, className);
    if (stripHtml(content).length >= 200) return content;
  }
  for (const tagName of ["article", "main"]) {
    const content = extractElementByTag(cleaned, tagName);
    if (stripHtml(content).length >= 200) return content;
  }
  return "";
}

function normalizeLazyImages(html) {
  return String(html).replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    if (/\bsrc\s*=/i.test(attrs)) return match;
    const lazy = attrs.match(/\bdata-(?:lazy-)?src\s*=\s*["']([^"']+)["']/i);
    return lazy ? `<img${attrs} src="${lazy[1]}">` : match;
  });
}

function sanitizeAttrs(tag, attrs, baseUrl) {
  const allowed = ALLOWED_ATTRS[tag] || new Set();
  const attrPattern = /([a-zA-Z0-9:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let result = "";
  let match;
  while ((match = attrPattern.exec(attrs))) {
    const name = match[1].toLowerCase();
    if (!allowed.has(name)) continue;
    let value = decodeEntities(match[3] ?? match[4] ?? match[5] ?? "");
    if (name === "href" || name === "src") {
      value = resolveUrl(value, baseUrl);
      if (!value) continue;
    }
    result += ` ${name}="${value.replace(/"/g, "&quot;")}"`;
  }
  if (tag === "a") result += ' target="_blank" rel="noopener noreferrer nofollow"';
  if (tag === "img") result += ' loading="lazy" referrerpolicy="no-referrer"';
  return result;
}

function sanitizeArticleHtml(html, baseUrl) {
  let output = normalizeLazyImages(removeNonContent(html));
  output = output.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag, attrs) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    return `<${name}${sanitizeAttrs(name, attrs, baseUrl)}>`;
  });
  output = output.replace(/<\/([a-z][a-z0-9]*)>/gi, (match, tag) => (
    ALLOWED_TAGS.has(tag.toLowerCase()) ? match : ""
  ));
  output = output.replace(/<(p|figure|blockquote)\b[^>]*>\s*<\/\1>/gi, "");
  output = output.replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");
  return output.trim();
}

function findFeedForUrl(value) {
  try {
    const url = new URL(value);
    const host = normalizeHost(url.hostname);
    const candidates = FEEDS.filter((feed) => normalizeHost(new URL(feed.site).hostname) === host);
    return candidates.find((feed) => {
      const sitePath = new URL(feed.site).pathname.replace(/\/$/, "");
      return sitePath && url.pathname.startsWith(sitePath);
    }) || candidates[0] || null;
  } catch {
    return null;
  }
}

async function fetchPageImage(url) {
  const cached = imageCache.get(url);
  if (cached) {
    const ttl = cached.failed ? IMAGE_FAILURE_TTL_MS : IMAGE_CACHE_TTL_MS;
    if (Date.now() - cached.fetchedAt < ttl) return cached.image;
  }
  try {
    const html = await fetchText(url, 6000);
    const image = extractPageMeta(html, url).image;
    imageCache.set(url, { image, fetchedAt: Date.now(), failed: !image });
    return image;
  } catch {
    imageCache.set(url, { image: null, fetchedAt: Date.now(), failed: true });
    return null;
  }
}

async function enrichMissingImages(articles) {
  const missing = articles
    .filter((article) => !article.image && isAllowedArticleUrl(article.url))
    .slice(0, MAX_IMAGE_FETCHES);
  let index = 0;
  const worker = async () => {
    while (index < missing.length) {
      const article = missing[index];
      index += 1;
      article.image = await fetchPageImage(article.url);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(IMAGE_FETCH_CONCURRENCY, missing.length) }, worker)
  );
}

async function loadNews({ feeds, fullCache, lightCache, force = false, includeImages = true }) {
  if (!includeImages && !force && fullCache.articles.length > 0 && Date.now() - fullCache.updatedAt < CACHE_TTL_MS) {
    return fullCache;
  }

  if (includeImages && !force && lightCache.articles.length > 0 && Date.now() - lightCache.updatedAt < CACHE_TTL_MS) {
    const articles = lightCache.articles.map((article) => ({ ...article }));
    await enrichMissingImages(articles);
    fullCache.articles = articles;
    fullCache.updatedAt = Date.now();
    return fullCache;
  }

  const store = includeImages ? fullCache : lightCache;
  if (!force && store.articles.length > 0 && Date.now() - store.updatedAt < CACHE_TTL_MS) {
    return store;
  }

  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const merged = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const seen = new Set();
  const articles = merged
    .filter((article) => {
      const key = article.url.split("#")[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 80);

  if (includeImages) {
    await enrichMissingImages(articles);
  }

  if (articles.length > 0) {
    store.articles = articles;
    store.updatedAt = Date.now();
  }
  return store;
}

export function getNews(options = {}) {
  return loadNews({ feeds: TOGO_FEEDS, fullCache: cache, lightCache, ...options });
}

export function getScienceNews(options = {}) {
  return loadNews({
    feeds: SCIENCE_FEEDS,
    fullCache: scienceCache,
    lightCache: scienceLightCache,
    ...options
  });
}

export async function getArticle(url) {
  if (!isAllowedArticleUrl(url)) return null;

  const cached = articleCache.get(url);
  if (cached && Date.now() - cached.fetchedAt < ARTICLE_CACHE_TTL_MS) {
    return cached.article;
  }

  try {
    const html = await fetchText(url);
    const meta = extractPageMeta(html, url);
    const extracted = extractArticleContent(html);
    const content = sanitizeArticleHtml(extracted, url);
    const description = meta.description || stripHtml(content).slice(0, 320);
    const feed = findFeedForUrl(url);
    const article = {
      title: meta.title || "Article",
      description,
      content: content || `<p>${escapeHtml(description)}</p>`,
      image: meta.image,
      publishedAt: meta.publishedAt,
      url,
      source: feed?.name || new URL(url).hostname,
      sourceUrl: feed?.site || new URL(url).origin,
      fallback: !content
    };
    articleCache.set(url, { article, fetchedAt: Date.now() });
    return article;
  } catch {
    return null;
  }
}

export function getNewsSources(category = "togo") {
  const feeds = category === "science" ? SCIENCE_FEEDS : TOGO_FEEDS;
  return feeds.map(({ name, site }) => ({ name, site }));
}
