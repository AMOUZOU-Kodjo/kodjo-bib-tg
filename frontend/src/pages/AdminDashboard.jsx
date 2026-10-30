import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStats, getAdminAnalytics, getUsers, updateUser, deleteUserAdmin, getAllDocuments, deleteDocumentAdmin, bulkDeleteDocuments, bulkUpdateDocumentsVisibility, getAdminSettings, updateAdminSettings, getAdminReports, updateAdminReportStatus, getAdminAudit, exportAdminData } from "../api/admin";
import { Users, FileText, Download, MessageCircle, Shield, Trash2, Search, Settings, BookOpen, MailCheck, MailX, ExternalLink, RefreshCw, Lock, Globe2, Flag, Check, X, History, BarChart3, HardDrive } from "lucide-react";
import { Card, Button, Input, Pagination } from "../components/ui";
import toast from "react-hot-toast";
import { formatDate, formatSize } from "../utils/format";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useAuth } from "../context/AuthContext";
import { DOCUMENTS_PER_PAGE } from "../utils/pagination";
import useSeo from "../hooks/useSeo";

const AUDIT_PER_PAGE = 30;

export default function AdminDashboard() {
  const { refreshSettings } = useSiteSettings();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState({ users: 0, documents: 0, downloads: 0, comments: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsRefresh, setAnalyticsRefresh] = useState(0);
  const [activityMetric, setActivityMetric] = useState("documents");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [docs, setDocs] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [docsPage, setDocsPage] = useState(1);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [audit, setAudit] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditRefresh, setAuditRefresh] = useState(0);
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

  useSeo({
    title: "Administration",
    description: "Tableau de bord et gestion de la plateforme.",
    noIndex: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAnalyticsLoading(true);
    getAdminAnalytics({ days: analyticsDays })
      .then((res) => {
        if (!cancelled) setAnalytics(res.data.analytics);
      })
      .catch(() => {
        if (!cancelled) toast.error("Erreur de chargement des statistiques");
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });
    return () => { cancelled = true; };
  }, [analyticsDays, analyticsRefresh]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, docsRes, settingsRes, reportsRes] = await Promise.all([
        getStats(),
        getUsers(),
        getAllDocuments(),
        getAdminSettings().catch(() => null),
        getAdminReports().catch(() => null)
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users || []);
      setDocs(docsRes.data.documents || []);
      setReports(reportsRes?.data?.reports || []);
      if (settingsRes?.data?.settings) setSettings(settingsRes.data.settings);
    } catch (err) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
      setReportsLoading(false);
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

  const handleReportStatus = async (report, status) => {
    try {
      await updateAdminReportStatus(report.id, status);
      setReports((list) => list.map((item) => item.id === report.id ? { ...item, status, resolved_at: status === "pending" ? null : new Date().toISOString() } : item));
      toast.success(status === "resolved" ? "Signalement traité" : status === "dismissed" ? "Signalement ignoré" : "Signalement réouvert");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible de mettre à jour le signalement");
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

  const toggleDocSelection = (id) => {
    setSelectedDocIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const handleBulkVisibility = async (visibility) => {
    if (selectedDocIds.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await bulkUpdateDocumentsVisibility(selectedDocIds, visibility);
      toast.success(`${res.data.updated} document(s) ${visibility === "public" ? "rendu(s) public(s)" : "rendu(s) privé(s)"}`);
      setSelectedDocIds([]);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de la mise à jour groupée");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocIds.length === 0) return;
    if (!confirm(`Supprimer définitivement ${selectedDocIds.length} document(s) sélectionné(s) ?`)) return;
    setBulkBusy(true);
    try {
      const res = await bulkDeleteDocuments(selectedDocIds);
      toast.success(`${res.data.deleted} document(s) supprimé(s)`);
      setSelectedDocIds([]);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de la suppression groupée");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const res = await exportAdminData(type);
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `archives-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Export CSV généré");
    } catch {
      toast.error("Impossible de générer l'export");
    }
  };

  useEffect(() => {
    if (activeTab !== "audit") return undefined;
    let cancelled = false;
    setAuditLoading(true);
    getAdminAudit({ page: auditPage, limit: AUDIT_PER_PAGE })
      .then((res) => {
        if (cancelled) return;
        setAudit(res.data.entries || []);
        setAuditTotal(res.data.total || 0);
      })
      .catch(() => {
        if (!cancelled) toast.error("Erreur de chargement du journal d'audit");
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeTab, auditPage, auditRefresh]);

  const cards = [
    { title: "Utilisateurs", value: stats.users, icon: Users, color: "text-blue-600 bg-blue-100" },
    { title: "Documents", value: stats.documents, icon: FileText, color: "text-green-600 bg-green-100" },
    { title: "Téléchargements", value: stats.downloads, icon: Download, color: "text-purple-600 bg-purple-100" },
    { title: "Commentaires", value: stats.comments, icon: MessageCircle, color: "text-orange-600 bg-orange-100" },
  ];

  const activityMetrics = [
    { id: "documents", label: "Documents", color: "bg-emerald-500" },
    { id: "users", label: "Utilisateurs", color: "bg-blue-500" },
    { id: "downloads", label: "Téléchargements", color: "bg-purple-500" },
    { id: "comments", label: "Commentaires", color: "bg-orange-500" }
  ];
  const activeMetric = activityMetrics.find((metric) => metric.id === activityMetric) || activityMetrics[0];
  const activityMax = Math.max(1, ...(analytics?.series || []).map((point) => Number(point[activeMetric.id]) || 0));
  const activityTotal = analytics?.totals || { users: 0, documents: 0, downloads: 0, comments: 0 };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.display_name.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(searchDoc.toLowerCase()) ||
    d.author_name?.toLowerCase().includes(searchDoc.toLowerCase())
  );
  const canShowViewCount = (doc) =>
    doc.visibility !== "private" && String(doc.owner_id) !== String(currentUser?.id);

  const docsTotalPages = Math.max(1, Math.ceil(filteredDocs.length / DOCUMENTS_PER_PAGE));
  const currentDocsPage = Math.min(docsPage, docsTotalPages);
  const pagedDocs = filteredDocs.slice(
    (currentDocsPage - 1) * DOCUMENTS_PER_PAGE,
    currentDocsPage * DOCUMENTS_PER_PAGE
  );
  const pageDocIds = pagedDocs.map((doc) => doc.id);
  const allPageDocsSelected = pageDocIds.length > 0 && pageDocIds.every((id) => selectedDocIds.includes(id));

  useEffect(() => {
    if (docsPage > docsTotalPages) setDocsPage(docsTotalPages);
  }, [docsPage, docsTotalPages]);

  const goToDocsPage = (p) => {
    setDocsPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pendingReports = reports.filter((report) => report.status === "pending").length;
  const reportReasonLabels = {
    spam: "Spam / publicité",
    inappropriate: "Contenu inapproprié",
    copyright: "Droit d'auteur",
    misleading: "Information trompeuse",
    other: "Autre"
  };
  const auditActionLabels = {
    "settings.update": "Paramètres modifiés",
    "user.update": "Utilisateur modifié",
    "user.delete": "Utilisateur supprimé",
    "document.delete": "Document supprimé",
    "document.bulk_delete": "Suppression groupée",
    "document.bulk_visibility": "Visibilité groupée",
    "report.update": "Signalement mis à jour"
  };
  const auditDetailLabels = {
    siteName: "Site",
    contactEmail: "Contact",
    creditsInitiaux: "Crédits initiaux",
    creditsParUpload: "Crédits par dépôt",
    maxUploadSizeMb: "Taille max (Mo)",
    role: "Rôle",
    credits: "Crédits",
    email_verified: "E-mail vérifié",
    display_name: "Nom",
    status: "Statut",
    visibility: "Visibilité",
    count: "Nombre",
    titles: "Documents"
  };
  const formatAuditDetails = (details) => {
    if (!details || typeof details !== "object") return "";
    return Object.entries(details)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => {
        const label = auditDetailLabels[key] || key;
        if (Array.isArray(value)) return `${label} : ${value.join(", ")}`;
        if (typeof value === "object") return `${label} : ${JSON.stringify(value)}`;
        return `${label} : ${value}`;
      })
      .join(" · ");
  };

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: Shield },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "documents", label: "Documents", icon: BookOpen },
    { id: "reports", label: "Signalements", icon: Flag },
    { id: "audit", label: "Journal", icon: History },
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
        <Button variant="secondary" onClick={() => { loadData(); setAnalyticsRefresh((value) => value + 1); }} disabled={loading || analyticsLoading}>
          <RefreshCw className={`w-4 h-4 ${loading || analyticsLoading ? "animate-spin" : ""}`} />
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
            {tab.id === "reports" && pendingReports > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {pendingReports}
              </span>
            )}
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
          <Card className="mb-6 p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                  Activité récente
                </h2>
                <p className="mt-1 text-sm text-gray-600">Nouveaux contenus et usages sur la période sélectionnée.</p>
              </div>
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 p-1">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setAnalyticsDays(days)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      analyticsDays === days ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {days} j
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {activityMetrics.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setActivityMetric(metric.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    activityMetric === metric.id ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${metric.color}`} />
                  {metric.label}
                </button>
              ))}
            </div>

            {analyticsLoading ? (
              <div className="flex h-40 items-center justify-center text-sm text-gray-500">Chargement…</div>
            ) : (
              <>
                <div className="flex h-40 items-end gap-[2px] sm:gap-1">
                  {(analytics?.series || []).map((point) => {
                    const value = Number(point[activeMetric.id]) || 0;
                    const height = value > 0 ? Math.max(4, Math.round((value / activityMax) * 100)) : 0;
                    return (
                      <div
                        key={point.date}
                        title={`${formatDate(point.date)} : ${value} ${activeMetric.label.toLowerCase()}`}
                        className="group flex h-full min-w-0 flex-1 items-end"
                      >
                        <div
                          style={{ height: `${height}%` }}
                          className={`w-full rounded-t ${activeMetric.color} opacity-80 transition-opacity group-hover:opacity-100`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-gray-400">
                  <span>{analytics?.series?.[0] ? formatDate(analytics.series[0].date) : "—"}</span>
                  <span>{analytics?.series?.length ? formatDate(analytics.series[analytics.series.length - 1].date) : "—"}</span>
                </div>
              </>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4">
              {[
                { label: "Nouveaux utilisateurs", value: activityTotal.users, color: "text-blue-600" },
                { label: "Nouveaux documents", value: activityTotal.documents, color: "text-emerald-600" },
                { label: "Téléchargements", value: activityTotal.downloads, color: "text-purple-600" },
                { label: "Commentaires", value: activityTotal.comments, color: "text-orange-600" }
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[11px] text-gray-500">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{analyticsLoading ? "…" : item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-5 w-5 text-primary-600" />
                Documents les plus actifs
              </h2>
              {analyticsLoading ? (
                <p className="py-4 text-sm text-gray-500">Chargement…</p>
              ) : (analytics?.topDocuments || []).length === 0 ? (
                <p className="py-4 text-sm text-gray-500">Aucun document pour le moment.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.topDocuments.map((doc, index) => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{doc.title}</p>
                        <p className="truncate text-xs text-gray-500">{doc.author_name}</p>
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-gray-500">
                        <p>{doc.view_count || 0} vues</p>
                        <p>{doc.download_count || 0} téléch.</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <HardDrive className="h-5 w-5 text-primary-600" />
                Stockage et modération
              </h2>
              {analyticsLoading ? (
                <p className="py-4 text-sm text-gray-500">Chargement…</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Espace utilisé</p>
                    <p className="text-2xl font-bold text-gray-900">{formatSize(analytics?.storage?.totalBytes || 0)}</p>
                    <p className="text-xs text-gray-500">
                      {analytics?.storage?.documents || 0} documents · {formatSize(analytics?.storage?.averageBytes || 0)} en moyenne
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-[11px] text-gray-500">Publics</p>
                      <p className="text-lg font-semibold text-teal-700">{analytics?.storage?.publicDocuments || 0}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Privés</p>
                      <p className="text-lg font-semibold text-gray-700">{analytics?.storage?.privateDocuments || 0}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500">Signalements</p>
                      <p className={`text-lg font-semibold ${analytics?.pendingReports > 0 ? "text-red-600" : "text-gray-700"}`}>
                        {analytics?.pendingReports || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{u.display_name}</p>
                      <p className="truncate text-sm text-gray-500">{u.email}</p>
                      <p className="truncate text-sm text-gray-500">{u.role}</p>
                      <p className="truncate text-sm text-gray-500">{u.credits}</p>
                      <p className="truncate text-sm text-gray-500">{u.email_verified ? "Oui" : "Non"}</p>
                      <p className="truncate text-sm text-gray-500">{u.created_at ? u.created_at.slice(0,10) : ""}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button className="text-xs text-gray-500 underline edit-user" data-id={u.id}>Modifier</button>
                      <button className="text-xs text-gray-500 delete-user" data-id={u.id}>Supprimer</button>
                    </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nom du site</label>
          <Input
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            maxLength={60}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Nom affiché sur la plateforme et les e‑mails.</p>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email de contact</label>
          <Input
            type="email"
            value={settings.contactEmail || ""}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            required
            aria-describedby="contact-help"
          />
          <p id="contact-help" className="text-xs text-gray-500 mt-1">
            Doit être une adresse email valide. Laisser vide pour utiliser l’expéditeur par défaut de Brevo.
          </p>
        </div>
      </div>
    </div>
    <div>
      <h3 className="font-medium mb-2">Fichiers</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            Limite appliquée lors du dépôt, entre 1 et 100 Mo. Avec l’offre Cloudinary gratuite, les fichiers non‑image sont limités à 10 Mo.
          </p>
        </div>
      </div>
    </div>
    <div>
      <h3 className="font-medium mb-2">Crédits</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {activeTab === "documents" && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 sm:text-xl">
              <BookOpen className="w-5 h-5" />
              Gestion des documents ({filteredDocs.length})
            </h2>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <button
                onClick={() => handleExport("documents")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </button>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Rechercher..." value={searchDoc} onChange={(e) => { setSearchDoc(e.target.value); setDocsPage(1); }} className="pl-9" />
              </div>
            </div>
          </div>
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={allPageDocsSelected}
                onChange={() => {
                  setSelectedDocIds((prev) => allPageDocsSelected
                    ? prev.filter((id) => !pageDocIds.includes(id))
                    : [...new Set([...prev, ...pageDocIds])]);
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600"
              />
              Sélectionner la page
            </label>
            {selectedDocIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500">{selectedDocIds.length} sélectionné(s)</span>
                <button
                  onClick={() => handleBulkVisibility("public")}
                  disabled={bulkBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50 disabled:opacity-50"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  Public
                </button>
                <button
                  onClick={() => handleBulkVisibility("private")}
                  disabled={bulkBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Privé
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              </div>
            ) : (
              <span className="text-xs text-gray-500">Cochez des documents pour agir en masse.</span>
            )}
          </div>
          {filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">Aucun document trouvé.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {pagedDocs.map(d => (
                <article key={d.id} className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <input
                    type="checkbox"
                    checked={selectedDocIds.includes(d.id)}
                    onChange={() => toggleDocSelection(d.id)}
                    aria-label={`Sélectionner ${d.title}`}
                    className="absolute right-2.5 top-2.5 z-20 h-4 w-4 cursor-pointer rounded border-white/70 bg-white/90 text-primary-600 shadow-sm"
                  />
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
                      {canShowViewCount(d) && (
                        <div>
                          <p className="text-gray-400">Vues</p>
                          <p className="font-semibold text-gray-700">{d.view_count || 0}</p>
                        </div>
                      )}
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
          {docsTotalPages > 1 && (
            <div className="mt-6">
              <Pagination page={currentDocsPage} totalPages={docsTotalPages} onPageChange={goToDocsPage} />
            </div>
          )}
        </Card>
      )}

      {activeTab === "reports" && (
        <Card className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                <Flag className="h-5 w-5 text-red-600" />
                Signalements ({pendingReports} en attente)
              </h2>
              <p className="mt-1 text-sm text-gray-600">Examinez les contenus signalés par les utilisateurs.</p>
            </div>
            <Button variant="secondary" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>

          {reportsLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">Chargement…</div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">Aucun signalement pour le moment.</div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const targetDocId = report.document_id || report.comment_document_id;
                const statusStyles = report.status === "pending"
                  ? "bg-amber-50 text-amber-700"
                  : report.status === "resolved"
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-600";
                const statusLabel = report.status === "pending" ? "En attente" : report.status === "resolved" ? "Résolu" : "Ignoré";
                return (
                  <article key={report.id} className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles}`}>{statusLabel}</span>
                          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            {reportReasonLabels[report.reason] || report.reason}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(report.created_at)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-900">
                          {report.document_id ? "Document signalé" : "Commentaire signalé"}
                          {targetDocId && (
                            <>
                              {" · "}
                              <Link to={`/documents/${targetDocId}`} target="_blank" rel="noreferrer" className="font-medium text-primary-600 hover:underline">
                                {report.document_title || "Voir le document"}
                              </Link>
                            </>
                          )}
                        </p>
                        {report.comment_content && (
                          <p className="mt-1 line-clamp-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            « {report.comment_content} »
                            {report.comment_author_name && <span className="text-gray-400"> — {report.comment_author_name}</span>}
                          </p>
                        )}
                        {report.details && (
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Précisions :</span> {report.details}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Par {report.reporter_name} ({report.reporter_email})
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {report.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleReportStatus(report, "resolved")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Résolu
                            </button>
                            <button
                              onClick={() => handleReportStatus(report, "dismissed")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                            >
                              <X className="h-3.5 w-3.5" />
                              Ignorer
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReportStatus(report, "pending")}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Réouvrir
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === "audit" && (
        <Card className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                <History className="h-5 w-5 text-primary-600" />
                Journal d'audit
              </h2>
              <p className="mt-1 text-sm text-gray-600">Historique des actions administratives récentes.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("audit")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </button>
              <Button variant="secondary" onClick={() => setAuditRefresh((value) => value + 1)} disabled={auditLoading}>
                <RefreshCw className={`h-4 w-4 ${auditLoading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </div>

          {auditLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">Chargement…</div>
          ) : audit.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">Aucune action enregistrée pour le moment.</div>
          ) : (
            <div className="space-y-3">
              {audit.map((entry) => {
                const details = formatAuditDetails(entry.details);
                const tone = entry.action.includes("delete")
                  ? "bg-red-50 text-red-700"
                  : entry.action.includes("update")
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700";
                return (
                  <article key={entry.id} className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
                            {auditActionLabels[entry.action] || entry.action}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-900">
                          Par <span className="font-medium">{entry.admin_name || "Administrateur supprimé"}</span>
                          {entry.admin_email && <span className="text-gray-500"> ({entry.admin_email})</span>}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Cible : {entry.target_type || "—"}
                          {entry.target_id && <span className="ml-1 font-mono">{String(entry.target_id).slice(0, 8)}…</span>}
                        </p>
                        {details && <p className="mt-2 text-sm text-gray-600">{details}</p>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {auditTotal > AUDIT_PER_PAGE && (
            <div className="mt-6">
              <Pagination
                page={auditPage}
                totalPages={Math.max(1, Math.ceil(auditTotal / AUDIT_PER_PAGE))}
                onPageChange={(page) => { setAuditPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
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
                    value={settings.contactEmail || ""}
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
