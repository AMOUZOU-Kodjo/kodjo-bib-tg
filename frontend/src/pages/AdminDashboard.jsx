import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStats, getUsers, updateUser, deleteUserAdmin, getAllDocuments, deleteDocumentAdmin, getAdminSettings, updateAdminSettings } from "../api/admin";
import { Users, FileText, Download, MessageCircle, Shield, Trash2, Search, Settings, BookOpen, MailCheck, MailX, ExternalLink, RefreshCw, Lock, Globe2 } from "lucide-react";
import { Card, Button, Input } from "../components/ui";
import toast from "react-hot-toast";
import { formatDate, formatSize } from "../utils/format";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { refreshSettings } = useSiteSettings();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState({ users: 0, documents: 0, downloads: 0, comments: 0 });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [docs, setDocs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchUser, setSearchUser] = useState("");
  const [searchDoc, setSearchDoc] = useState("");
  const [settings, setSettings] = useState({
    siteName: "Archives",
    contactEmail: "",
    creditsInitiaux: 0,
    creditsParUpload: 2,
    maxUploadSizeMb: 10
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, docsRes, settingsRes] = await Promise.all([
        getStats(),
        getUsers(),
        getAllDocuments(),
        getAdminSettings().catch(() => null)
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users || []);
      setDocs(docsRes.data.documents || []);
      if (settingsRes?.data?.settings) setSettings(settingsRes.data.settings);
    } catch (err) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (id, data) => {
    try {
      await updateUser(id, data);
      toast.success("Utilisateur mis à jour");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de la mise à jour");
      await loadData();
    }
  };

  const handleToggleVerified = (target) => {
    handleUpdateUser(target.id, { email_verified: !target.email_verified });
  };

  const handleUpdateCredits = (target, value) => {
    const credits = Number(value);
    if (!Number.isInteger(credits) || credits < 0 || credits > 1000000) {
      toast.error("Les crédits doivent être un entier positif");
      loadData();
      return;
    }
    if (credits === target.credits) return;
    handleUpdateUser(target.id, { credits });
  };

  const handleDeleteUser = async (target) => {
    if (target.id === currentUser?.id) return;
    if (!confirm(`Supprimer ${target.display_name} ? Ses documents, commentaires et données seront supprimés définitivement.`)) return;
    try {
      await deleteUserAdmin(target.id);
      toast.success("Utilisateur supprimé");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de la suppression");
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await updateAdminSettings({
        siteName: settings.siteName,
        contactEmail: settings.contactEmail,
        creditsInitiaux: Number(settings.creditsInitiaux),
        creditsParUpload: Number(settings.creditsParUpload),
        maxUploadSizeMb: Number(settings.maxUploadSizeMb)
      });
      setSettings(res.data.settings);
      await refreshSettings();
      toast.success("Paramètres enregistrés");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteDoc = async (doc) => {
    if (!confirm(`Supprimer « ${doc.title} » définitivement ?`)) return;
    try {
      await deleteDocumentAdmin(doc.id);
      toast.success("Document supprimé");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de la suppression");
    }
  };

  const cards = [
    { title: "Utilisateurs", value: stats.users, icon: Users, color: "text-blue-600 bg-blue-100" },
    { title: "Documents", value: stats.documents, icon: FileText, color: "text-green-600 bg-green-100" },
    { title: "Téléchargements", value: stats.downloads, icon: Download, color: "text-purple-600 bg-purple-100" },
    { title: "Commentaires", value: stats.comments, icon: MessageCircle, color: "text-orange-600 bg-orange-100" },
  ];

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.display_name.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(searchDoc.toLowerCase()) ||
    d.author_name?.toLowerCase().includes(searchDoc.toLowerCase())
  );

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: Shield },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "documents", label: "Documents", icon: BookOpen },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2.5 sm:gap-3">
            <Shield className="h-7 w-7 shrink-0 text-primary-600 sm:h-8 sm:w-8" />
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Administration</h1>
          </div>
          <p className="text-sm text-gray-600 sm:text-base">Tableau de bord et gestion de la plateforme</p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-1 sm:px-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all whitespace-nowrap sm:px-4 ${
              activeTab === tab.id 
                ? "bg-primary-600 text-white" 
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.title} className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{loading ? "..." : card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Derniers utilisateurs</h2>
              <div className="space-y-3">
                {!loading && users.length === 0 && (
                  <p className="text-sm text-gray-500 py-4">Aucun utilisateur pour le moment.</p>
                )}
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{u.display_name}</p>
                      <p className="truncate text-sm text-gray-500">{u.email}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Derniers documents</h2>
              <div className="space-y-3">
                {!loading && docs.length === 0 && (
                  <p className="text-sm text-gray-500 py-4">Aucun document pour le moment.</p>
                )}
                {docs.slice(0, 5).map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{d.title}</p>
                      <p className="text-sm text-gray-500">{d.author_name}</p>
                    </div>
                    <span className="shrink-0 pl-3 text-xs text-gray-500">{formatDate(d.created_at)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 sm:text-xl">
              <Users className="w-5 h-5" />
              Gestion des utilisateurs ({filteredUsers.length})
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Rechercher..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Utilisateur</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rôle</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Crédits</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Vérifié</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Inscrit le</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{u.display_name}</td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? "Vous ne pouvez pas modifier votre propre rôle" : "Modifier le rôle"}
                        className="px-2 py-1 border border-gray-200 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        key={`${u.id}-${u.credits}`}
                        type="number"
                        min="0"
                        max="1000000"
                        defaultValue={u.credits}
                        onBlur={(e) => handleUpdateCredits(u, e.target.value)}
                        title="Modifier les crédits"
                        className="w-24 px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${u.email_verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {u.email_verified ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleVerified(u)}
                          disabled={u.id === currentUser?.id}
                          title={u.email_verified ? "Retirer la vérification" : "Marquer comme vérifié"}
                          aria-label={u.email_verified ? "Retirer la vérification" : "Marquer comme vérifié"}
                          className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                            u.email_verified ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {u.email_verified ? <MailX className="w-4 h-4" /> : <MailCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer cet utilisateur"}
                          aria-label="Supprimer cet utilisateur"
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm text-gray-500">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {filteredUsers.map(u => (
              <article key={u.id} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{u.display_name}</p>
                    <p className="break-all text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${u.email_verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {u.email_verified ? 'Vérifié' : 'Non vérifié'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-gray-500">
                    Rôle
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                      disabled={u.id === currentUser?.id}
                      title={u.id === currentUser?.id ? "Vous ne pouvez pas modifier votre propre rôle" : "Modifier le rôle"}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium text-gray-500">
                    Crédits
                    <input
                      key={`mobile-${u.id}-${u.credits}`}
                      type="number"
                      min="0"
                      max="1000000"
                      defaultValue={u.credits}
                      onBlur={(e) => handleUpdateCredits(u, e.target.value)}
                      title="Modifier les crédits"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700"
                    />
                  </label>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">Inscrit le {formatDate(u.created_at)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleVerified(u)}
                      disabled={u.id === currentUser?.id}
                      title={u.email_verified ? "Retirer la vérification" : "Marquer comme vérifié"}
                      aria-label={u.email_verified ? "Retirer la vérification" : "Marquer comme vérifié"}
                      className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                        u.email_verified ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {u.email_verified ? <MailX className="w-4 h-4" /> : <MailCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u)}
                      disabled={u.id === currentUser?.id}
                      title={u.id === currentUser?.id ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer cet utilisateur"}
                      aria-label="Supprimer cet utilisateur"
                      className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!loading && filteredUsers.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-gray-500">Aucun utilisateur trouvé.</p>
            )}
          </div>
        </Card>
      )}

      {activeTab === "documents" && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 sm:text-xl">
              <BookOpen className="w-5 h-5" />
              Gestion des documents ({filteredDocs.length})
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Rechercher..." value={searchDoc} onChange={(e) => setSearchDoc(e.target.value)} className="pl-9" />
            </div>
          </div>
          {filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">Aucun document trouvé.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {filteredDocs.map(d => (
                <article key={d.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <Link
                    to={`/documents/${d.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block h-32 overflow-hidden bg-gradient-to-br from-slate-900 via-gray-800 to-teal-900"
                  >
                    {d.thumbnail ? (
                      <img
                        src={d.thumbnail}
                        alt={d.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-white/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                    <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white ${d.visibility === "private" ? "bg-gray-900/85" : "bg-teal-700/90"}`}>
                      {d.visibility === "private" ? <Lock className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />}
                      {d.visibility === "private" ? "Privé" : "Public"}
                    </span>
                    {d.category && (
                      <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-800 backdrop-blur">
                        {d.category}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-3.5">
                    <Link
                      to={`/documents/${d.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {d.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-gray-500">{d.author_name}</p>
                    <p className="mt-1 truncate text-[11px] text-gray-400" title={d.original_filename}>{d.original_filename || "Fichier"}</p>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                      <div>
                        <p className="text-gray-400">Vues</p>
                        <p className="font-semibold text-gray-700">{d.view_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Téléch.</p>
                        <p className="font-semibold text-gray-700">{d.download_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Taille</p>
                        <p className="font-semibold text-gray-700">{d.size_bytes ? formatSize(d.size_bytes) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Ajouté</p>
                        <p className="font-semibold text-gray-700">{formatDate(d.created_at)}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                      <Link
                        to={`/documents/${d.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Ouvrir le document"
                        aria-label="Ouvrir le document"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-primary-600"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ouvrir
                      </Link>
                      <button
                        onClick={() => handleDeleteDoc(d)}
                        title="Supprimer ce document"
                        aria-label="Supprimer ce document"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "settings" && (
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 sm:text-xl">
            <Settings className="w-5 h-5" />
            Paramètres du site
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Ces réglages sont enregistrés en base et appliqués immédiatement à la plateforme et aux e-mails.
          </p>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nom du site</label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    maxLength={60}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email de contact</label>
                  <Input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Fichiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Taille maximale par fichier (Mo)</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxUploadSizeMb}
                    onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Limite appliquée lors du dépôt, entre 1 et 100 Mo.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Crédits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Crédits initiaux</label>
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    value={settings.creditsInitiaux}
                    onChange={(e) => setSettings({ ...settings, creditsInitiaux: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Attribués à chaque nouveau compte.</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Crédits par upload</label>
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    value={settings.creditsParUpload}
                    onChange={(e) => setSettings({ ...settings, creditsParUpload: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Gagnés à chaque document déposé.</p>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={savingSettings}>
              {savingSettings ? "Enregistrement..." : "Enregistrer les paramètres"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
