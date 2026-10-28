import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User, Mail, Shield, Coins, AlertCircle, FileText,
  Upload, X, Check, History, Copy, Globe2, Link2, Lock,
  RotateCw, Share2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getMyDocuments, getMyCredits, updateMyProfile } from "../api/users";
import {
  updateDocument, deleteDocument, getDocumentShareLink,
  createDocumentShareLink, disableDocumentShare
} from "../api/documents";
import { formatDate } from "../utils/format";
import { Spinner, EmptyState, Pagination } from "../components/ui";
import { DocumentCard } from "../components/documents/DocumentCard";
import { DOCUMENTS_PER_PAGE } from "../utils/pagination";

const reasonLabels = {
  initial: "Crédits de bienvenue",
  upload: "Dépôt d'un document",
  download: "Téléchargement"
};

function EditDocumentModal({ doc, onClose, onSaved }) {
  const [title, setTitle] = useState(doc.title || "");
  const [description, setDescription] = useState(doc.description || "");
  const [category, setCategory] = useState(doc.category || "");
  const [visibility, setVisibility] = useState(doc.visibility || "public");
  const [saving, setSaving] = useState(false);
  const visibilityChanged = visibility !== (doc.visibility || "public");

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    setSaving(true);
    try {
      const res = await updateDocument(doc.id, {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        visibility
      });
      toast.success("Document mis à jour");
      onSaved({
        id: doc.id,
        title: res.data.document.title,
        description: res.data.document.description,
        category: res.data.document.category,
        visibility: res.data.document.visibility,
        shareEnabled: res.data.document.share_enabled
      });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible de modifier le document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-gray-900">Modifier le document</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <input
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={80}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              placeholder="Éducation, Science..."
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Visibilité</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                aria-pressed={visibility === "public"}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  visibility === "public"
                    ? "border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <Globe2 className="w-4 h-4" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                aria-pressed={visibility === "private"}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  visibility === "private"
                    ? "border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <Lock className="w-4 h-4" />
                Privé
              </button>
            </div>
            {visibilityChanged && (
              <p className="mt-2 text-xs text-amber-700">Changer la visibilité désactive le lien de partage existant.</p>
            )}
          </div>
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-y"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={onClose} className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:w-auto">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50 sm:w-auto">
              <Check className="w-4 h-4" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ShareDocumentModal({ doc, onClose, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(Boolean(doc.shareEnabled));
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    getDocumentShareLink(doc.id)
      .then((res) => {
        if (!active) return;
        setEnabled(Boolean(res.data.enabled));
        setUrl(res.data.url || "");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.error?.message || "Impossible de charger le lien de partage");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [doc.id]);

  const createLink = async (rotate = false) => {
    if (rotate && !window.confirm("Régénérer le lien ? L'ancien lien cessera immédiatement de fonctionner.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await createDocumentShareLink(doc.id, rotate);
      setEnabled(true);
      setUrl(res.data.url);
      onChanged({ id: doc.id, shareEnabled: true });
      toast.success(rotate ? "Nouveau lien généré" : "Lien de partage activé");
    } catch (err) {
      const message = err.response?.data?.error?.message || "Impossible de générer le lien";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const revokeLink = async () => {
    if (!window.confirm("Désactiver le partage ? Tous les liens existants cesseront de fonctionner.")) return;
    setBusy(true);
    setError("");
    try {
      await disableDocumentShare(doc.id);
      setEnabled(false);
      setUrl("");
      onChanged({ id: doc.id, shareEnabled: false });
      toast.success("Partage désactivé");
    } catch (err) {
      const message = err.response?.data?.error?.message || "Impossible de désactiver le partage";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-teal-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Partager le document</h2>
              <p className="text-sm text-gray-500 line-clamp-1">{doc.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-5">
          <p className="text-sm text-gray-700">
            Toute personne disposant du lien peut consulter et télécharger ce document sans compte.
          </p>
          <p className="mt-1 text-xs text-gray-500">Le lien expire après 30 jours. La régénération ou la désactivation révoque immédiatement l'accès.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : error && !url ? (
          <div className="space-y-4">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => createLink(false)} disabled={busy} className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50">
              Réessayer
            </button>
          </div>
        ) : enabled && url ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="share-url" className="block text-sm font-medium text-gray-700 mb-1">Lien de partage</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="share-url"
                    value={url}
                    readOnly
                    onFocus={(e) => e.target.select()}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg bg-white text-xs font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <button onClick={copyLink} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 sm:w-auto">
                  <Copy className="w-4 h-4" />
                  Copier
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button onClick={() => createLink(true)} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
                <RotateCw className="w-4 h-4" />
                Régénérer
              </button>
              <button onClick={revokeLink} disabled={busy} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50">
                <X className="w-4 h-4" />
                Désactiver le partage
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Aucun lien actif. Créez un lien pour permettre l'accès à ce document privé.</p>
            <button onClick={() => createLink(false)} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50">
              <Share2 className="w-4 h-4" />
              {busy ? "Création..." : "Créer un lien de partage"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const { creditsParUpload } = useSiteSettings();
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsPage, setDocsPage] = useState(1);
  const [credits, setCredits] = useState(user?.credits || 0);
  const [history, setHistory] = useState([]);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [name, setName] = useState(user?.display_name || "");
  const [savingName, setSavingName] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [sharingDoc, setSharingDoc] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setName(user?.display_name || "");
  }, [user?.display_name]);

  useEffect(() => {
    getMyDocuments()
      .then((res) => setDocs(res.data.documents || []))
      .catch(() => toast.error("Impossible de charger vos documents"))
      .finally(() => setDocsLoading(false));

    getMyCredits()
      .then((res) => {
        setCredits(res.data.credits || 0);
        setHistory(res.data.history || []);
        setUser((current) => (current ? { ...current, credits: res.data.credits || 0 } : current));
      })
      .catch(() => toast.error("Impossible de charger l'historique de crédits"))
      .finally(() => setCreditsLoading(false));
  }, [setUser]);

  const saveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Le nom doit contenir au moins 2 caractères");
      return;
    }
    setSavingName(true);
    try {
      const res = await updateMyProfile({ displayName: trimmed });
      setUser((current) => (current ? { ...current, display_name: res.data.user.display_name } : current));
      setName(res.data.user.display_name);
      toast.success("Nom mis à jour");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible de mettre à jour le nom");
    } finally {
      setSavingName(false);
    }
  };

  const removeDoc = async (doc) => {
    if (!window.confirm(`Supprimer « ${doc.title} » ? Cette action est irréversible.`)) return;
    setDeletingId(doc.id);
    try {
      await deleteDocument(doc.id);
      setDocs((list) => list.filter((d) => d.id !== doc.id));
      toast.success("Document supprimé");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible de supprimer le document");
    } finally {
      setDeletingId(null);
    }
  };

  const onDocSaved = (updated) => {
    setDocs((list) => list.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
  };

  const docsTotalPages = Math.max(1, Math.ceil(docs.length / DOCUMENTS_PER_PAGE));
  const currentDocsPage = Math.min(docsPage, docsTotalPages);
  const pagedDocs = docs.slice(
    (currentDocsPage - 1) * DOCUMENTS_PER_PAGE,
    currentDocsPage * DOCUMENTS_PER_PAGE
  );

  useEffect(() => {
    if (docsPage > docsTotalPages) setDocsPage(docsTotalPages);
  }, [docsPage, docsTotalPages]);

  const goToDocsPage = (p) => {
    setDocsPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
      <div className="max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Mon profil</h1>
        <p className="text-sm text-gray-600 sm:text-base">Gérez vos informations, vos documents et vos crédits.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-5 sm:gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">Mes documents</h2>
                <p className="text-sm text-gray-500">{docs.length} document{docs.length > 1 ? "s" : ""} au total</p>
              </div>
              <Link to="/upload" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 sm:px-4">
                <Upload className="w-4 h-4" />
                Déposer
              </Link>
            </div>

            {docsLoading ? (
              <div className="flex justify-center py-10"><Spinner size="lg" /></div>
            ) : docs.length === 0 ? (
              <div className="py-4">
                <EmptyState message="Vous n'avez encore déposé aucun document" icon={FileText} />
                <div className="text-center">
                  <Link to="/upload" className="text-sm font-medium text-teal-700 hover:underline">
                    Déposer votre premier document
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4">
                {pagedDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onEdit={() => setEditingDoc(doc)}
                    onDelete={() => removeDoc(doc)}
                    onShare={() => setSharingDoc(doc)}
                    deleting={deletingId === doc.id}
                  />
                ))}
              </div>
            )}
            {docsTotalPages > 1 && (
              <div className="mt-5">
                <Pagination page={currentDocsPage} totalPages={docsTotalPages} onPageChange={goToDocsPage} />
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-lg font-bold text-teal-700">
                {(user?.display_name || user?.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">{user?.display_name}</h2>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" />E-mail</span>
                {user?.email_verified ? (
                  <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Vérifié</span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">Non vérifié</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-gray-600"><Shield className="w-4 h-4" />Rôle</span>
                <span className="text-gray-900 font-medium capitalize">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-gray-600"><Coins className="w-4 h-4" />Crédits</span>
                <span className="text-gray-900 font-semibold">{credits}</span>
              </div>
            </div>

            <form onSubmit={saveName} className="mt-5 pt-5 border-t border-gray-100">
              <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">Nom affiché</label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingName || name.trim() === user?.display_name}
                  className="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-40"
                >
                  {savingName ? "..." : "Enregistrer"}
                </button>
              </div>
            </form>

            {!user?.email_verified && (
              <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">Vérifiez votre e-mail pour déposer des documents et interagir.</p>
                </div>
                <Link to="/verify-email" state={{ email: user?.email }} className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 hover:underline">
                  Vérifier mon e-mail
                </Link>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-700" />
                Crédits
              </h2>
              <span className="text-2xl font-bold text-teal-700">{credits}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              1 dépôt = {creditsParUpload} crédit{creditsParUpload > 1 ? "s" : ""}, 1 téléchargement = 1 crédit.
            </p>

            {creditsLoading ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Aucun mouvement pour le moment.</p>
            ) : (
              <ul className="max-h-72 overflow-y-auto -mx-1 px-1">
                {history.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{reasonLabels[item.reason] || item.reason}</p>
                      {item.document_title && (
                        item.document_id ? (
                          <Link to={`/documents/${item.document_id}`} className="text-xs text-teal-700 hover:underline line-clamp-1">
                            {item.document_title}
                          </Link>
                        ) : (
                          <p className="text-xs text-gray-500 line-clamp-1">{item.document_title}</p>
                        )
                      )}
                      <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${item.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {item.delta > 0 ? `+${item.delta}` : item.delta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {editingDoc && (
        <EditDocumentModal
          doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSaved={onDocSaved}
        />
      )}

      {sharingDoc && (
        <ShareDocumentModal
          doc={sharingDoc}
          onClose={() => setSharingDoc(null)}
          onChanged={onDocSaved}
        />
      )}
    </div>
  );
}
