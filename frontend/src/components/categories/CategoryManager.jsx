import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Eye, EyeOff, FolderTree, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { Button, Card, Input, Select } from "../ui";
import { createAdminCategory, deleteAdminCategory, getAdminCategories, updateAdminCategory } from "../../api/admin";
import { useLiveVersion } from "../../context/LiveUpdatesContext";

function flatten(tree, depth = 0) {
  return (tree || []).flatMap((category) => [
    { ...category, depth },
    ...flatten(category.children || [], depth + 1)
  ]);
}

export default function CategoryManager() {
  const { t } = useTranslation();
  const liveVersion = useLiveVersion(["categories", "documents"]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminCategories();
      setTree(res.data.categories || []);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.categoryLoadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [liveVersion]);

  const roots = tree;
  const flat = flatten(tree);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await createAdminCategory({ name: newName.trim(), parentId: newParentId || null });
      toast.success(t("admin.categoryCreated"));
      setNewName("");
      setNewParentId("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.categorySaveError"));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditParentId(category.parent_id || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditParentId("");
  };

  const handleSaveEdit = async (category) => {
    if (!editName.trim()) return;
    setBusy(true);
    try {
      await updateAdminCategory(category.id, {
        name: editName.trim(),
        parentId: editParentId || null
      });
      toast.success(t("admin.categoryUpdated"));
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.categorySaveError"));
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (category) => {
    setBusy(true);
    try {
      await updateAdminCategory(category.id, { isActive: !category.is_active });
      toast.success(category.is_active ? t("admin.categoryHidden") : t("admin.categoryShown"));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.categorySaveError"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(t("admin.categoryDeleteConfirm", { name: category.name }))) return;
    setBusy(true);
    try {
      await deleteAdminCategory(category.id);
      toast.success(t("admin.categoryDeleted"));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.categoryDeleteError"));
    } finally {
      setBusy(false);
    }
  };

  const renderRow = (category) => {
    const isEditing = editingId === category.id;
    return (
      <div key={category.id}>
        <div className={`rounded-xl border p-3 ${category.is_active ? "border-gray-100 dark:border-slate-700" : "border-dashed border-gray-200 bg-gray-50 opacity-70 dark:border-slate-700 dark:bg-slate-900/40"}`}>
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={80}
                aria-label={t("admin.categoryName")}
              />
              <Select
                value={editParentId}
                onChange={(e) => setEditParentId(e.target.value)}
                aria-label={t("admin.categoryParent")}
              >
                <option value="">{t("admin.categoryRoot")}</option>
                {roots
                  .filter((root) => root.id !== category.id)
                  .map((root) => (
                    <option key={root.id} value={root.id}>{root.name}</option>
                  ))}
              </Select>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 dark:border-slate-700 dark:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("admin.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEdit(category)}
                  disabled={busy || !editName.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {t("admin.save")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <FolderTree className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" />
                  <span className="font-medium text-gray-900 dark:text-slate-100">{category.name}</span>
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-slate-900 dark:text-slate-400">{category.slug}</code>
                  {!category.is_active && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      {t("admin.categoryInactive")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  {t("admin.categoryDocCount", { count: category.total_count ?? category.document_count ?? 0 })}
                  {category.parent_id ? ` · ${t("admin.categorySubcategory")}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(category)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("admin.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(category)}
                  disabled={busy}
                  title={category.is_active ? t("admin.categoryHide") : t("admin.categoryShow")}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {category.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {category.is_active ? t("admin.categoryHide") : t("admin.categoryShow")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("admin.delete")}
                </button>
              </div>
            </div>
          )}
        </div>
        {category.children?.length > 0 && (
          <div className="mt-2 space-y-2 border-l border-gray-200 pl-3 dark:border-slate-700 sm:ml-6">
            {category.children.map(renderRow)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
          <FolderTree className="h-5 w-5 text-teal-700 dark:text-teal-300" />
          {t("admin.categoryManagement")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{t("admin.categoryManagementDesc")}</p>

        <form onSubmit={handleCreate} className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,240px)_auto]">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={80}
            placeholder={t("admin.categoryNamePlaceholder")}
            required
          />
          <Select value={newParentId} onChange={(e) => setNewParentId(e.target.value)}>
            <option value="">{t("admin.categoryRoot")}</option>
            {roots.map((root) => (
              <option key={root.id} value={root.id}>{root.name}</option>
            ))}
          </Select>
          <Button type="submit" disabled={busy || !newName.trim()}>
            <Plus className="h-4 w-4" />
            {t("admin.categoryCreate")}
          </Button>
        </form>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t("admin.categoryTree")}</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {t("admin.categoryCount", { count: flat.length })}
            </p>
          </div>
          <Button variant="secondary" onClick={load} disabled={loading || busy}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("admin.refresh")}
          </Button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-slate-400">{t("common.loading")}</p>
        ) : tree.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-slate-400">{t("admin.categoryEmpty")}</p>
        ) : (
          <div className="space-y-3">{tree.map(renderRow)}</div>
        )}
      </Card>
    </div>
  );
}
