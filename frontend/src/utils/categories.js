export function flattenCategoryTree(categories, depth = 0) {
  if (!Array.isArray(categories)) return [];
  return categories.flatMap((category) => [
    { ...category, depth },
    ...flattenCategoryTree(category.children || [], depth + 1)
  ]);
}

export function findCategoryById(categories, id) {
  for (const category of categories || []) {
    if (String(category.id) === String(id)) return category;
    const child = findCategoryById(category.children || [], id);
    if (child) return child;
  }
  return null;
}

export function findCategoryBySlug(categories, slug) {
  for (const category of categories || []) {
    if (category.slug === slug) return category;
    const child = findCategoryBySlug(category.children || [], slug);
    if (child) return child;
  }
  return null;
}

export function findCategoryByName(categories, name) {
  const normalized = String(name || "").trim().toLowerCase();
  if (!normalized) return null;
  for (const category of categories || []) {
    if (String(category.name || "").trim().toLowerCase() === normalized) return category;
    const child = findCategoryByName(category.children || [], name);
    if (child) return child;
  }
  return null;
}

export function findCategoryParent(categories, id) {
  for (const category of categories || []) {
    if ((category.children || []).some((child) => String(child.id) === String(id))) return category;
  }
  return null;
}
