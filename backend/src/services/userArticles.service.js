import { query } from "../config/db.js";
import { classifyContent } from "./contentCategories.js";

let schemaReady;

export function ensureUserArticlesSchema() {
  if (!schemaReady) {
    schemaReady = query(`
      CREATE TABLE IF NOT EXISTS user_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_name TEXT NOT NULL,
        title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
        content TEXT NOT NULL CHECK (char_length(content) >= 20),
        category TEXT NOT NULL,
        image_url TEXT,
        published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_user_articles_published ON user_articles (published_at DESC);
    `).catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export async function listUserArticles({ limit = 40 } = {}) {
  await ensureUserArticlesSchema();
  const result = await query(
    `SELECT id, author_name, title, content, category, image_url, published_at
     FROM user_articles
     ORDER BY published_at DESC
     LIMIT $1`,
    [Math.min(Math.max(Number(limit) || 40, 1), 100)]
  );
  return result.rows.map((row) => ({
    id: `user-${row.id}`,
    title: row.title,
    description: String(row.content).replace(/\s+/g, " ").trim().slice(0, 320),
    url: `/actualites/article-utilisateur?id=${row.id}`,
    image: row.image_url || null,
    source: row.author_name,
    sourceUrl: null,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    external: false,
    kind: "user-article",
    category: row.category || classifyContent(row.title, row.content),
    content: row.content,
    author: row.author_name
  }));
}

export async function createUserArticle({ userId, authorName, title, content, category, imageUrl }) {
  await ensureUserArticlesSchema();
  const finalCategory = category || classifyContent(title, content);
  const result = await query(
    `INSERT INTO user_articles (user_id, author_name, title, content, category, image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, published_at`,
    [userId, authorName, title, content, finalCategory, imageUrl || null]
  );
  const row = result.rows[0];
  return {
    id: `user-${row.id}`,
    dbId: row.id,
    title,
    content,
    category: finalCategory,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null
  };
}

export async function getUserArticle(id) {
  await ensureUserArticlesSchema();
  const result = await query(
    `SELECT id, author_name, title, content, category, image_url, published_at
     FROM user_articles WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    description: String(row.content).replace(/\s+/g, " ").trim().slice(0, 320),
    image: row.image_url || null,
    source: row.author_name,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    category: row.category,
    author: row.author_name
  };
}
