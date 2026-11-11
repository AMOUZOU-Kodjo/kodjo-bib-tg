import { config } from "../config/env.js";

const FEEDS = [
  { name: "Togo Officiel", url: "https://www.republiquetogolaise.tg/obrss/feed-rtg", site: "https://www.republiquetogolaise.tg" },
  { name: "Togo-Presse", url: "https://togopresse.tg/feed/", site: "https://togopresse.tg" },
  { name: "Icilome", url: "https://icilome.com/feed/", site: "https://icilome.com" },
  { name: "Journal du Togo", url: "https://www.journaldutogo.com/feed/", site: "https://www.journaldutogo.com" },
  { name: "Togo En Live", url: "https://togoenlive.tg/feed", site: "https://togoenlive.tg" }
];

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { articles: [], updatedAt: 0 };

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

  return blocks.flatMap((block) => {
    const title = stripHtml(firstTag(block, ["title"]));
    const url = extractLink(block);
    if (!title || !url) return [];
    const rawContent = firstTag(block, ["content:encoded", "description", "summary", "content"]);
    const description = stripHtml(rawContent).slice(0, 320);
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
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null
    }];
  });
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      "User-Agent": `ArchiviaNewsBot/1.0 (+${config.frontendUrl})`,
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml"
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`${feed.name}: HTTP ${response.status}`);
  const xml = await response.text();
  return parseFeed(xml, feed);
}

export async function getNews({ force = false } = {}) {
  if (!force && cache.articles.length > 0 && Date.now() - cache.updatedAt < CACHE_TTL_MS) {
    return cache;
  }

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
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

  if (articles.length > 0) {
    cache = { articles, updatedAt: Date.now() };
  }
  return cache;
}

export function getNewsSources() {
  return FEEDS.map(({ name, site }) => ({ name, site }));
}
