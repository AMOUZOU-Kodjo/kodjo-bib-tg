import pg from "pg";
import { config } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === "production" ? { rejectUnauthorized: true } : undefined,
  max: 10,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

let lastActivityAt = 0;

export function touchDatabaseActivity() {
  lastActivityAt = Date.now();
}

export async function query(text, params) {
  touchDatabaseActivity();
  const res = await pool.query(text, params);
  return res;
}

let securitySchemaReady;

export function ensureSecuritySchema() {
  if (!securitySchemaReady) {
    securitySchemaReady = query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_new_documents BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_document_updates BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_reason_check;
      ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_reason_check CHECK (reason IN ('initial','upload','download','admin'));
    `).catch((err) => {
      securitySchemaReady = null;
      throw err;
    });
  }
  return securitySchemaReady;
}

let featureSchemaReady;

export function ensureFeatureSchema() {
  if (!featureSchemaReady) {
    featureSchemaReady = query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS favorites (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, document_id)
      );
      CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites (user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS follows (
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (follower_id, author_id),
        CHECK (follower_id <> author_id)
      );
      CREATE INDEX IF NOT EXISTS idx_follows_author ON follows (author_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','dismissed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at TIMESTAMPTZ,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        CHECK (document_id IS NOT NULL OR comment_id IS NOT NULL)
      );
      CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports (status, created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_pending_document
        ON reports (reporter_id, document_id) WHERE status = 'pending' AND document_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_pending_comment
        ON reports (reporter_id, comment_id) WHERE status = 'pending' AND comment_id IS NOT NULL;

      ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
      CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN (tags);
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,''))) STORED;
      CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN (search_vector);

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        link TEXT,
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions (user_id);

      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id UUID,
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_log (admin_id, created_at DESC);
    `).catch((err) => {
      featureSchemaReady = null;
      throw err;
    });
  }
  return featureSchemaReady;
}

let keepAliveTimer;

export function startDatabaseKeepAlive() {
  if (keepAliveTimer) return;
  const interval = Number(process.env.DATABASE_KEEPALIVE_MS || 180000);
  const activityWindow = Number(process.env.DATABASE_ACTIVITY_WINDOW_MS || 600000);
  if (!Number.isFinite(interval) || interval <= 0) return;
  if (!Number.isFinite(activityWindow) || activityWindow <= 0) return;

  keepAliveTimer = setInterval(() => {
    if (Date.now() - lastActivityAt > activityWindow) return;
    pool.query("SELECT 1").catch((err) => {
      console.error("Keepalive base de données échoué:", err.message);
    });
  }, interval);
  keepAliveTimer.unref();
}
