import { pool, query } from "../config/db.js";

const DEFAULT_CATEGORY_TREE = [
  {
    name: "Éducation & Examens",
    slug: "education-examens",
    children: [
      { name: "Cours", slug: "cours" },
      { name: "TD / TP", slug: "td-tp" },
      { name: "Examens / Annales", slug: "examens-annales" },
      { name: "Rapports / Mémoires", slug: "rapports-memoires" },
      { name: "Fiches", slug: "fiches" },
      { name: "Annales & Corrigés", slug: "annales-corriges" },
      { name: "Révisions", slug: "revisions" },
      { name: "Méthodologie", slug: "methodologie" },
      { name: "Orientation & Concours", slug: "orientation-concours" },
      { name: "Ressources pédagogiques", slug: "ressources-pedagogiques" },
      { name: "Examens blancs", slug: "examens-blancs" },
      { name: "Supports de cours", slug: "supports-de-cours" }
    ]
  },
  {
    name: "Sciences & Techniques",
    slug: "sciences-techniques",
    children: [
      { name: "Science", slug: "science" },
      { name: "Physique-Chimie", slug: "physique-chimie" },
      { name: "Mathématiques", slug: "mathematiques" },
      { name: "SVT", slug: "svt" },
      { name: "Informatique", slug: "informatique" },
      { name: "Astronomie", slug: "astronomie" },
      { name: "Chimie", slug: "chimie" },
      { name: "Physique", slug: "physique" },
      { name: "Biologie", slug: "biologie" },
      { name: "Technologie", slug: "technologie" },
      { name: "Mathématiques appliquées", slug: "mathematiques-appliquees" },
      { name: "Sciences de l'ingénieur", slug: "sciences-ingenieur" }
    ]
  },
  {
    name: "Lettres & Culture",
    slug: "lettres-culture",
    children: [
      { name: "Littérature", slug: "litterature" },
      { name: "Philosophie", slug: "philosophie" },
      { name: "Art", slug: "art" },
      { name: "Divertissement", slug: "divertissement" },
      { name: "Poésie", slug: "poesie" },
      { name: "Théâtre", slug: "theatre" },
      { name: "Langues", slug: "langues" },
      { name: "Culture générale", slug: "culture-generale" },
      { name: "Écriture créative", slug: "ecriture-creative" },
      { name: "Critique littéraire", slug: "critique-litteraire" },
      { name: "Mythologie", slug: "mythologie" }
    ]
  },
  {
    name: "Histoire & Géographie",
    slug: "histoire-geographie",
    children: [
      { name: "Histoire", slug: "histoire" },
      { name: "Géographie", slug: "geographie" },
      { name: "Civilisations", slug: "civilisations" },
      { name: "Géopolitique", slug: "geopolitique" },
      { name: "Cartographie", slug: "cartographie" },
      { name: "Patrimoine", slug: "patrimoine" },
      { name: "Archéologie", slug: "archeologie" },
      { name: "Histoire contemporaine", slug: "histoire-contemporaine" },
      { name: "Histoire ancienne", slug: "histoire-ancienne" },
      { name: "Relations internationales", slug: "relations-internationales" }
    ]
  },
  {
    name: "Société & Politique",
    slug: "societe-politique",
    children: [
      { name: "Société", slug: "societe" },
      { name: "Politique", slug: "politique" },
      { name: "Droit", slug: "droit" },
      { name: "Économie", slug: "economie" },
      { name: "Citoyenneté", slug: "citoyennete" },
      { name: "Institutions", slug: "institutions" },
      { name: "Actualités", slug: "actualites" },
      { name: "Médias", slug: "medias" },
      { name: "Débats", slug: "debats" },
      { name: "Gouvernance", slug: "gouvernance" }
    ]
  },
  {
    name: "Santé & Bien-être",
    slug: "sante-bien-etre",
    children: [
      { name: "Santé", slug: "sante" },
      { name: "Nutrition", slug: "nutrition" },
      { name: "Psychologie", slug: "psychologie" },
      { name: "Médecine", slug: "medecine" },
      { name: "Sport santé", slug: "sport-sante" },
      { name: "Hygiène", slug: "hygiene" },
      { name: "Prévention", slug: "prevention" },
      { name: "Bien-être mental", slug: "bien-etre-mental" },
      { name: "Premiers secours", slug: "premiers-secours" },
      { name: "Sommeil", slug: "sommeil" }
    ]
  },
  {
    name: "Enfance & Loisirs",
    slug: "enfance-loisirs",
    children: [
      { name: "Petite Enfance", slug: "petite-enfance" },
      { name: "Sport", slug: "sport" },
      { name: "Jeux éducatifs", slug: "jeux-educatifs" },
      { name: "Activités manuelles", slug: "activites-manuelles" },
      { name: "Contes", slug: "contes" },
      { name: "Développement", slug: "developpement" },
      { name: "Parentalité", slug: "parentalite" },
      { name: "Animation", slug: "animation" },
      { name: "Créativité", slug: "creativite" },
      { name: "Éveil", slug: "eveil" }
    ]
  },
  {
    name: "Vie pratique & Administration",
    slug: "vie-pratique-administration",
    children: [
      { name: "CV & Lettres", slug: "cv-lettres" },
      { name: "Emploi", slug: "emploi" },
      { name: "Fiscalité", slug: "fiscalite" },
      { name: "Logement", slug: "logement" },
      { name: "Mobilité", slug: "mobilite" },
      { name: "Budget", slug: "budget" },
      { name: "Démarches", slug: "demarches" },
      { name: "Droits", slug: "droits" },
      { name: "Services publics", slug: "services-publics" },
      { name: "Entrepreneuriat", slug: "entrepreneuriat" }
    ]
  }
];

let schemaReady;

function normalizeName(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function categoryError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function ensureCategoriesSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
          name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
          slug TEXT NOT NULL,
          icon TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
        CREATE INDEX IF NOT EXISTS idx_categories_parent_order ON categories (parent_id, sort_order, name);

        ALTER TABLE documents ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents (category_id);
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS seller_whatsapp TEXT;
      `);
      await ensureDefaultCategories();
      await migrateDocumentCategories();
  await migrateDocumentSubcategories();
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

async function ensureDefaultCategories() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [rootIndex, root] of DEFAULT_CATEGORY_TREE.entries()) {
      let rootId;
      const existingRoot = await client.query("SELECT id FROM categories WHERE slug = $1", [root.slug]);
      if (existingRoot.rows[0]) {
        rootId = existingRoot.rows[0].id;
      } else {
        const rootRes = await client.query(
          `INSERT INTO categories (parent_id, name, slug, sort_order)
           VALUES (NULL, $1, $2, $3)
           ON CONFLICT (slug) DO NOTHING
           RETURNING id`,
          [root.name, root.slug, rootIndex]
        );
        rootId = rootRes.rows[0]?.id;
        if (!rootId) {
          const fallback = await client.query("SELECT id FROM categories WHERE slug = $1", [root.slug]);
          rootId = fallback.rows[0]?.id;
        }
      }
      if (!rootId) continue;

      for (const [childIndex, child] of (root.children || []).entries()) {
        const existingChild = await client.query("SELECT id FROM categories WHERE slug = $1", [child.slug]);
        if (existingChild.rows[0]) continue;
        await client.query(
          `INSERT INTO categories (parent_id, name, slug, sort_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (slug) DO NOTHING`,
          [rootId, child.name, child.slug, childIndex]
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function migrateDocumentSubcategories() {
  await query(`
    UPDATE documents d
    SET category_id = c.id,
        category = c.name
    FROM categories c
    WHERE c.parent_id IS NOT NULL
      AND lower(trim(coalesce(d.category, ''))) = lower(c.name)
  `);
}

async function migrateDocumentCategories() {
  await query(`
    UPDATE documents d
    SET category_id = c.id
    FROM categories c
    WHERE d.category_id IS NULL
      AND d.category IS NOT NULL
      AND lower(trim(d.category)) = lower(c.name)
  `);
  await query(`
    UPDATE documents d
    SET category_id = c.id, category = c.name
    FROM categories c
    WHERE d.category_id IS NULL
      AND lower(trim(d.category)) = 'education'
      AND c.slug = 'education-examens'
  `);
  await query(`
    UPDATE documents d
    SET category_id = c.id, category = c.name
    FROM categories c
    WHERE d.category_id IS NULL
      AND lower(trim(d.category)) = 'littrature'
      AND c.slug = 'litterature'
  `);
}

export async function getCategoryTree({ includeInactive = false, publicOnly = true } = {}) {
  const documentJoin = publicOnly ? "AND d.visibility = 'public'" : "";
  const res = await query(
    `SELECT c.id, c.parent_id, c.name, c.slug, c.icon, c.sort_order, c.is_active,
            COUNT(d.id)::int AS document_count
     FROM categories c
     LEFT JOIN documents d ON d.category_id = c.id ${documentJoin}
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`
  );

  const nodes = new Map();
  for (const row of res.rows) {
    nodes.set(row.id, { ...row, children: [] });
  }

  let roots = [];
  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  if (!includeInactive) {
    const prune = (items) => items
      .filter((item) => item.is_active)
      .map((item) => ({ ...item, children: prune(item.children) }));
    roots = prune(roots);
  }

  const aggregate = (node) => {
    let total = node.document_count;
    for (const child of node.children) total += aggregate(child);
    node.total_count = total;
    return total;
  };
  roots.forEach(aggregate);

  return roots;
}

export async function getCategoryById(id) {
  const res = await query(
    "SELECT id, parent_id, name, slug, icon, sort_order, is_active FROM categories WHERE id = $1",
    [id]
  );
  return res.rows[0] || null;
}

export async function resolveCategoryReference(reference) {
  const value = normalizeName(reference);
  if (!value) return null;
  const res = await query(
    `SELECT id, parent_id, name, slug, is_active
     FROM categories
     WHERE slug = $1 OR lower(name) = lower($1)
     ORDER BY CASE WHEN slug = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [value]
  );
  return res.rows[0] || null;
}

export async function getCategoryDescendantIds(id) {
  const res = await query(
    `WITH RECURSIVE tree AS (
       SELECT id FROM categories WHERE id = $1
       UNION ALL
       SELECT c.id FROM categories c JOIN tree t ON c.parent_id = t.id
     )
     SELECT id FROM tree`,
    [id]
  );
  return res.rows.map((row) => row.id);
}

async function getUniqueSlug(base, ignoreId = null) {
  const safeBase = slugify(base) || "categorie";
  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? safeBase : `${safeBase}-${index + 1}`;
    const res = await query(
      "SELECT id FROM categories WHERE slug = $1 AND ($2::uuid IS NULL OR id <> $2::uuid) LIMIT 1",
      [candidate, ignoreId]
    );
    if (res.rows.length === 0) return candidate;
  }
  return `${safeBase}-${Date.now()}`;
}

async function assertRootParent(parentId, currentId = null) {
  if (!parentId) return null;
  if (currentId && String(parentId) === String(currentId)) {
    throw categoryError(400, "INVALID_PARENT", "Une catégorie ne peut pas être son propre parent");
  }
  const parent = await getCategoryById(parentId);
  if (!parent) {
    throw categoryError(400, "INVALID_PARENT", "Catégorie parente introuvable");
  }
  if (parent.parent_id) {
    throw categoryError(400, "MAX_DEPTH", "Seuls deux niveaux de catégories sont autorisés");
  }
  return parent;
}

export async function createCategory({ name, parentId = null, icon = null, sortOrder = null }) {
  const normalized = normalizeName(name);
  if (!normalized || normalized.length > 80) {
    throw categoryError(400, "INVALID_NAME", "Le nom doit contenir entre 1 et 80 caractères");
  }
  const parent = await assertRootParent(parentId);
  const slug = await getUniqueSlug(normalized);
  const order = Number.isInteger(sortOrder) ? sortOrder : 0;
  const res = await query(
    `INSERT INTO categories (parent_id, name, slug, icon, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, parent_id, name, slug, icon, sort_order, is_active, created_at, updated_at`,
    [parent?.id || null, normalized, slug, icon || null, order]
  );
  return res.rows[0];
}

export async function updateCategory(id, { name, parentId, icon, sortOrder, isActive } = {}) {
  const existing = await getCategoryById(id);
  if (!existing) throw categoryError(404, "NOT_FOUND", "Catégorie introuvable");

  let nextParentId = existing.parent_id;
  if (parentId !== undefined) {
    if (parentId && existing.parent_id === null) {
      const childrenRes = await query("SELECT COUNT(*)::int AS total FROM categories WHERE parent_id = $1", [id]);
      if (childrenRes.rows[0].total > 0) {
        throw categoryError(400, "CATEGORY_HAS_CHILDREN", "Déplacez ou supprimez les sous-catégories avant de changer ce parent");
      }
    }
    const parent = await assertRootParent(parentId, id);
    nextParentId = parent?.id || null;
  }

  const normalized = name === undefined ? existing.name : normalizeName(name);
  if (!normalized || normalized.length > 80) {
    throw categoryError(400, "INVALID_NAME", "Le nom doit contenir entre 1 et 80 caractères");
  }

  const nextIcon = icon === undefined ? existing.icon : icon || null;
  const nextOrder = sortOrder === undefined || sortOrder === null ? existing.sort_order : Number(sortOrder);
  const nextActive = isActive === undefined ? existing.is_active : Boolean(isActive);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (normalized !== existing.name) {
      await client.query("UPDATE documents SET category = $1 WHERE category_id = $2", [normalized, id]);
    }
    const res = await client.query(
      `UPDATE categories
       SET name = $1, parent_id = $2, icon = $3, sort_order = $4, is_active = $5, updated_at = now()
       WHERE id = $6
       RETURNING id, parent_id, name, slug, icon, sort_order, is_active, created_at, updated_at`,
      [normalized, nextParentId, nextIcon, nextOrder, nextActive, id]
    );
    await client.query("COMMIT");
    return res.rows[0];
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteCategory(id) {
  const existing = await getCategoryById(id);
  if (!existing) throw categoryError(404, "NOT_FOUND", "Catégorie introuvable");

  const childrenRes = await query("SELECT COUNT(*)::int AS total FROM categories WHERE parent_id = $1", [id]);
  if (childrenRes.rows[0].total > 0) {
    throw categoryError(409, "CATEGORY_HAS_CHILDREN", "Supprimez d'abord les sous-catégories");
  }
  const docsRes = await query("SELECT COUNT(*)::int AS total FROM documents WHERE category_id = $1", [id]);
  if (docsRes.rows[0].total > 0) {
    throw categoryError(409, "CATEGORY_NOT_EMPTY", "Cette catégorie contient encore des documents");
  }

  await query("DELETE FROM categories WHERE id = $1", [id]);
  return { ok: true };
}
