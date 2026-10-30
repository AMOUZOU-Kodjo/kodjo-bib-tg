import express from "express";
import { query } from "../config/db.js";
import { config } from "../config/env.js";
import { getSettings } from "../services/settings.service.js";

const router = express.Router();

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanText(value, maxLength = 500) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function siteBase() {
  return String(config.frontendUrl || "https://kodjo-bib-tg.pages.dev").replace(/\/+$/, "");
}

async function getPublicDocuments(limit = 5000) {
  try {
    const result = await query(
      `SELECT id, title, description, category, created_at
       FROM documents
       WHERE visibility = 'public'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (err) {
    console.error("SEO documents indisponibles:", err.message);
    return [];
  }
}

async function getPublicAuthors() {
  try {
    const result = await query(
      `SELECT owner_id, MAX(created_at) AS last_document_at
       FROM documents
       WHERE visibility = 'public'
       GROUP BY owner_id
       ORDER BY last_document_at DESC
       LIMIT 2000`
    );
    return result.rows;
  } catch (err) {
    console.error("SEO auteurs indisponibles:", err.message);
    return [];
  }
}

router.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    `User-agent: *
Allow: /
Disallow: /admin
Disallow: /profile
Disallow: /upload
Disallow: /verify-email
Disallow: /share/
Disallow: /api/

Sitemap: ${siteBase()}/sitemap.xml
`
  );
});

router.get("/sitemap.xml", async (req, res) => {
  const base = siteBase();
  const today = new Date().toISOString().slice(0, 10);
  const [documents, authors] = await Promise.all([getPublicDocuments(), getPublicAuthors()]);

  const staticPages = [
    { path: "/", lastmod: today, changefreq: "daily", priority: "1.0" },
    { path: "/documents", lastmod: today, changefreq: "daily", priority: "0.9" },
    { path: "/contact", lastmod: today, changefreq: "monthly", priority: "0.5" },
    { path: "/mentions-legales", lastmod: today, changefreq: "yearly", priority: "0.3" },
    { path: "/confidentialite", lastmod: today, changefreq: "yearly", priority: "0.3" },
    { path: "/cgu", lastmod: today, changefreq: "yearly", priority: "0.3" }
  ];

  const urls = [
    ...staticPages.map((page) => `  <url>
    <loc>${escapeXml(`${base}${page.path}`)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`),
    ...documents.map((doc) => `  <url>
    <loc>${escapeXml(`${base}/documents/${doc.id}`)}</loc>
    <lastmod>${new Date(doc.created_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),
    ...authors.map((author) => `  <url>
    <loc>${escapeXml(`${base}/authors/${author.owner_id}`)}</loc>
    <lastmod>${new Date(author.last_document_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`)
  ];

  res.set("Cache-Control", "public, max-age=300");
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`);
});

router.get("/rss.xml", async (req, res) => {
  const base = siteBase();
  const settings = await getSettings();
  const documents = await getPublicDocuments(50);
  const siteName = settings.siteName || "Archives";
  const contactEmail = settings.contactEmail || config.contactEmail || "";

  const items = documents.map((doc) => {
    const link = `${base}/documents/${doc.id}`;
    const description = cleanText(doc.description || `Document publié sur ${siteName}.`);
    return `    <item>
      <title>${escapeXml(doc.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <category>${escapeXml(doc.category || "Document")}</category>
      <description>${escapeXml(description)}</description>
      <pubDate>${new Date(doc.created_at).toUTCString()}</pubDate>
    </item>`;
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteName)} — Nouveaux documents</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(`Les derniers documents publics publiés sur ${siteName}.`)}</description>
    <language>fr-fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${contactEmail ? `<managingEditor>${escapeXml(contactEmail)}</managingEditor>\n    ` : ""}<atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(`${base}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`;

  res.set("Cache-Control", "public, max-age=300");
  res.type("application/rss+xml").send(rss);
});

export default router;
