import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStats, getAdminAnalytics, getUsers, updateUser, deleteUserAdmin, getAllDocuments, deleteDocumentAdmin, bulkDeleteDocuments, bulkUpdateDocumentsVisibility, getAdminSettings, updateAdminSettings, getAdminReports, updateAdminReportStatus, getAdminAudit, exportAdminData } from "../api/admin";
import { Users, FileText, Download, MessageCircle, Shield, Trash2, Search, Settings, BookOpen, MailCheck, MailX, ExternalLink, RefreshCw, Lock, Globe2, Flag, Check, X, History, BarChart3, HardDrive, Pencil, Coins, Save, RotateCcw } from "lucide-react";
import { Card, Button, Input, Select, Pagination, Toggle } from "../components/ui";
import toast from "react-hot-toast";
import { formatDate, formatSize } from "../utils/format";
import { useTranslation } from "react-i18next";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useAuth } from "../context/AuthContext";
import { DOCUMENTS_PER_PAGE } from "../utils/pagination";
import useSeo from "../hooks/useSeo";

const AUDIT_PER_PAGE = 30;
const USERS_PER_PAGE = 10;

const userRoleLabel = (role, t) => (role === "admin" ? t("admin.adminRole") : t("admin.memberRole"));

const settingsKey = (value) => JSON.stringify({
  siteName: String(value?.siteName ?? "").trim(),
  siteTagline: String(value?.siteTagline ?? "").trim(),
  contactEmail: String(value?.contactEmail ?? "").trim().toLowerCase(),
  creditsInitiaux: Number(value?.creditsInitiaux) || 0,
  creditsParUpload: Number(value?.creditsParUpload) || 0,
  maxUploadSizeMb: Number(value?.maxUploadSizeMb) || 0,
  allowRegistrations: Boolean(value?.allowRegistrations),
  publicBrowsing: Boolean(value?.publicBrowsing)
});

export default function AdminDashboard() {
  const { t } = useTranslation();
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
  const [usersPage, setUsersPage] = useState(1);
  const [editUserId, setEditUserId] = useState(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editEmailVerified, setEditEmailVerified] = useState("non");
  const [editCredits, setEditCredits] = useState(0);
  const [editSaving, setEditSaving] = useState(false);
  const [searchDoc, setSearchDoc] = useState("");
  const [settings, setSettings] = useState({
    siteName: "Archives",
    siteTagline: "Plateforme de documents",
    contactEmail: "",
    creditsInitiaux: 0,
    creditsParUpload: 2,
    maxUploadSizeMb: 10,
    allowRegistrations: true,
    publicBrowsing: true
  });
  const [savedSettings, setSavedSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const settingsDirty = savedSettings !== null && settingsKey(settings) !== settingsKey(savedSettings);

  useSeo({
    title: t("admin.title"),
    description: t("admin.desc"),
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
        if (!cancelled) toast.error(t("admin.statsLoadError"));
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
      if (settingsRes?.data?.settings) {
        setSettings(settingsRes.data.settings);
        setSavedSettings(settingsRes.data.settings);
      }
    } catch (err) {
      toast.error(t("admin.loadError"));
    } finally {
      setLoading(false);
      setReportsLoading(false);
    }
  };

  const handleUpdateUser = async (id, data) => {
    try {
      await updateUser(id, data);
      toast.success(t("admin.userUpdated"));
      await loadData();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.updateError"));
      return false;
    }
  };

  const handleToggleVerified = (target) => {
    handleUpdateUser(target.id, { email_verified: !target.email_verified });
  };

  const closeEditUser = () => {
    if (editSaving) return;
    setEditUserId(null);
  };

  const handleSubmitEditUser = async (e) => {
    e.preventDefault();
    if (!editUserId) return;
    const target = users.find((u) => u.id === editUserId);
    if (!target) {
      toast.error(t("admin.userNotFound"));
      setEditUserId(null);
      return;
    }
    setEditSaving(true);
    const updated = await handleUpdateUser(editUserId, {
      display_name: editDisplayName,
      email: editEmail,
      role: editRole,
      credits: Number(editCredits),
      email_verified: editEmailVerified === "oui",
    });
    setEditSaving(false);
    if (updated) setEditUserId(null);
  };

  const handleDeleteUser = async (target) => {
    if (target.id === currentUser?.id) {
      toast.error(t("admin.cannotDeleteSelf"));
      return;
    }
    if (!confirm(t("admin.deleteUserConfirm", { name: target.display_name }))) return;
    try {
      await deleteUserAdmin(target.id);
      if (editUserId === target.id) setEditUserId(null);
      toast.success(t("admin.userDeleted"));
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.deleteError"));
    }
  };

  const handleReportStatus = async (report, status) => {
    try {
      await updateAdminReportStatus(report.id, status);
      setReports((list) => list.map((item) => item.id === report.id ? { ...item, status, resolved_at: status === "pending" ? null : new Date().toISOString() } : item));
      toast.success(status === "resolved" ? t("admin.reportResolved") : status === "dismissed" ? t("admin.reportDismissed") : t("admin.reportReopened"));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.reportUpdateError"));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await updateAdminSettings({
        siteName: settings.siteName,
        siteTagline: settings.siteTagline,
        contactEmail: settings.contactEmail,
        creditsInitiaux: Number(settings.creditsInitiaux),
        creditsParUpload: Number(settings.creditsParUpload),
        maxUploadSizeMb: Number(settings.maxUploadSizeMb),
        allowRegistrations: Boolean(settings.allowRegistrations),
        publicBrowsing: Boolean(settings.publicBrowsing)
      });
      setSettings(res.data.settings);
      setSavedSettings(res.data.settings);
      await refreshSettings();
      toast.success(t("admin.settingsSaved"));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.saveError"));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetSettings = () => {
    if (savedSettings) setSettings(savedSettings);
    else {
      setSettings({
        siteName: "Archives",
        siteTagline: "Plateforme de documents",
        contactEmail: "",
        creditsInitiaux: 0,
        creditsParUpload: 2,
        maxUploadSizeMb: 10,
        allowRegistrations: true,
        publicBrowsing: true
      });
    }
  };

  const handleDeleteDoc = async (doc) => {
    if (!confirm(t("admin.deleteDocConfirm", { title: doc.title }))) return;
    try {
      await deleteDocumentAdmin(doc.id);
      toast.success(t("admin.docDeleted"));
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.deleteError"));
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
      toast.success(t("admin.bulkVisibilityDone", { count: res.data.updated, visibility: visibility === "public" ? t("admin.public") : t("admin.private") }));
      setSelectedDocIds([]);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.bulkUpdateError"));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocIds.length === 0) return;
    if (!confirm(t("admin.bulkDeleteConfirm", { count: selectedDocIds.length }))) return;
    setBulkBusy(true);
    try {
      const res = await bulkDeleteDocuments(selectedDocIds);
      toast.success(t("admin.bulkDeleteDone", { count: res.data.deleted }));
      setSelectedDocIds([]);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("admin.bulkDeleteError"));
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
      toast.success(t("admin.exportDone"));
    } catch {
      toast.error(t("admin.exportError"));
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
        if (!cancelled) toast.error(t("admin.auditLoadError"));
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

  const userSearchTerm = searchUser.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!userSearchTerm) return true;
    return [u.display_name, u.email, userRoleLabel(u.role, t)]
      .some((value) => String(value ?? "").toLowerCase().includes(userSearchTerm));
  });

  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const currentUsersPage = Math.min(usersPage, usersTotalPages);
  const pagedUsers = filteredUsers.slice(
    (currentUsersPage - 1) * USERS_PER_PAGE,
    currentUsersPage * USERS_PER_PAGE
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

  useEffect(() => {
    if (usersPage > usersTotalPages) setUsersPage(usersTotalPages);
  }, [usersPage, usersTotalPages]);

  const goToUsersPage = (p) => {
    setUsersPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pendingReports = reports.filter((report) => report.status === "pending").length;
  const reportReasonLabels = {
    spam: t("admin.reasonSpam"),
    inappropriate: t("admin.reasonInappropriate"),
    copyright: t("admin.reasonCopyright"),
    misleading: t("admin.reasonMisleading"),
    other: t("admin.reasonOther")
  };
  const auditActionLabels = {
    "settings.update": t("admin.auditSettings"),
    "user.update": t("admin.auditUserUpdate"),
    "user.delete": t("admin.auditUserDelete"),
    "document.delete": t("admin.auditDocDelete"),
    "document.bulk_delete": t("admin.auditBulkDelete"),
    "document.bulk_visibility": t("admin.auditBulkVisibility"),
    "report.update": t("admin.auditReportUpdate")
  };
  const auditDetailLabels = {
    siteName: t("admin.siteNameShort"),
    contactEmail: t("admin.contactShort"),
    creditsInitiaux: t("admin.initialCredits"),
    creditsParUpload: t("admin.creditsPerUpload"),
    maxUploadSizeMb: t("admin.maxUploadShort"),
    role: t("admin.role"),
    credits: t("admin.credits"),
    email_verified: t("admin.emailVerified"),
    display_name: t("admin.name"),
    status: t("admin.status"),
    visibility: t("admin.visibility"),
    count: t("admin.count"),
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

  useEffect(() => {
    if (!editUserId) return;
    const user = users.find((u) => u.id === editUserId);
    if (user) {
      setEditDisplayName(user.display_name);
      setEditEmail(user.email);
      setEditRole(user.role || "user");
      setEditCredits(user.credits || 0);
      setEditEmailVerified(user.email_verified ? "oui" : "non");
      setEditSaving(false);
    }
  }, [editUserId]);

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
            <Shield className="h-7 w-7 shrink-0 text-primary-600 dark:text-primary-100 sm:h-8 sm:w-8" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">{t("admin.title")}</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 sm:text-base">{t("admin.subtitle")}</p>
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
                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900 border border-gray-200 dark:border-slate-700"
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
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{loading ? "..." : card.value}</p>
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
                  <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-100" />
                  Activité récente
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{t("admin.analyticsSubtitle")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 dark:bg-slate-800 p-1">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setAnalyticsDays(days)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      analyticsDays === days ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
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
                    activityMetric === metric.id ? "bg-gray-900 text-white" : "bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${metric.color}`} />
                  {metric.label}
                </button>
              ))}
            </div>

            {analyticsLoading ? (
              <div className="flex h-40 items-center justify-center text-sm text-gray-500 dark:text-slate-400">{t("common.loading")}</div>
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

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-slate-700 pt-4 sm:grid-cols-4">
              {[
                { label: "Nouveaux utilisateurs", value: activityTotal.users, color: "text-blue-600" },
                { label: "Nouveaux documents", value: activityTotal.documents, color: "text-emerald-600" },
                { label: "Téléchargements", value: activityTotal.downloads, color: "text-purple-600" },
                { label: "Commentaires", value: activityTotal.comments, color: "text-orange-600" }
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{analyticsLoading ? "…" : item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-100" />
                Documents les plus actifs
              </h2>
              {analyticsLoading ? (
                <p className="py-4 text-sm text-gray-500 dark:text-slate-400">{t("common.loading")}</p>
              ) : (analytics?.topDocuments || []).length === 0 ? (
                <p className="py-4 text-sm text-gray-500 dark:text-slate-400">{t("admin.noDocsYet")}</p>
              ) : (
                <div className="space-y-2">
                  {analytics.topDocuments.map((doc, index) => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-slate-900"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-xs font-semibold text-gray-600 dark:text-slate-400">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{doc.title}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-slate-400">{doc.author_name}</p>
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-gray-500 dark:text-slate-400">
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
                <HardDrive className="h-5 w-5 text-primary-600 dark:text-primary-100" />
                Stockage et modération
              </h2>
              {analyticsLoading ? (
                <p className="py-4 text-sm text-gray-500 dark:text-slate-400">{t("common.loading")}</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t("admin.storageUsed")}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{formatSize(analytics?.storage?.totalBytes || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {analytics?.storage?.documents || 0} documents · {formatSize(analytics?.storage?.averageBytes || 0)} en moyenne
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-slate-700 pt-4">
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">{t("admin.publicPlural")}</p>
                      <p className="text-lg font-semibold text-teal-700 dark:text-teal-300">{analytics?.storage?.publicDocuments || 0}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">{t("admin.privatePlural")}</p>
                      <p className="text-lg font-semibold text-gray-700 dark:text-slate-300">{analytics?.storage?.privateDocuments || 0}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">{t("admin.reports")}</p>
                      <p className={`text-lg font-semibold ${analytics?.pendingReports > 0 ? "text-red-600" : "text-gray-700 dark:text-slate-300"}`}>
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
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{t("admin.recentUsers")}</h2>
                <button type="button" onClick={() => setActiveTab("users")} className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-300">
                  Tout voir
                </button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {!loading && users.length === 0 && (
                  <p className="py-4 text-sm text-gray-500 dark:text-slate-400">{t("admin.noUsersYet")}</p>
                )}
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                        {(u.display_name || "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{u.display_name}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${u.role === "admin" ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-100" : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                        {userRoleLabel(u.role, t)}
                      </span>
                      <button type="button" onClick={() => { setActiveTab("users"); setEditUserId(u.id); }} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700" aria-label={`Modifier ${u.display_name}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDeleteUser(u)} disabled={u.id === currentUser?.id} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-300 dark:hover:bg-red-950/40" aria-label={`Supprimer ${u.display_name}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">{t("admin.recentDocs")}</h2>
              <div className="space-y-3">
                {!loading && docs.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 py-4">{t("admin.noDocsYet")}</p>
                )}
                {docs.slice(0, 5).map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-slate-100 truncate">{d.title}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{d.author_name}</p>
                    </div>
                    <span className="shrink-0 pl-3 text-xs text-gray-500 dark:text-slate-400">{formatDate(d.created_at)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                  <Users className="h-5 w-5" />
                  Gestion des utilisateurs
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                  {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""} affiché{filteredUsers.length > 1 ? "s" : ""} sur {users.length}
                </p>
              </div>
              <Button variant="secondary" onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder={t("admin.searchUserPlaceholder")}
                  value={searchUser}
                  onChange={(e) => { setSearchUser(e.target.value); setUsersPage(1); }}
                  className="pl-9"
                  aria-label={t("admin.searchUser")}
                />
              </div>
              <Button variant="secondary" onClick={() => { setSearchUser(""); setUsersPage(1); }}>
                Réinitialiser
              </Button>
            </div>

            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    <th className="px-3 py-3 font-semibold">Utilisateur</th>
                    <th className="px-3 py-3 font-semibold">{t("admin.role")}</th>
                    <th className="px-3 py-3 font-semibold">{t("admin.credits")}</th>
                    <th className="px-3 py-3 font-semibold">Statut</th>
                    <th className="px-3 py-3 font-semibold">Inscrit le</th>
                    <th className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {pagedUsers.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/60">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                            {(u.display_name || "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900 dark:text-slate-100">{u.display_name}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${u.role === "admin" ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-100" : "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200"}`}>
                          {u.role === "admin" && <Shield className="h-3 w-3" />}
                          {userRoleLabel(u.role, t)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-700 dark:text-slate-300">{u.credits}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleVerified(u)}
                          title={u.email_verified ? "Marquer comme non vérifié" : "Marquer comme vérifié"}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${u.email_verified ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40" : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/40"}`}
                        >
                          {u.email_verified ? <MailCheck className="h-3 w-3" /> : <MailX className="h-3 w-3" />}
                          {u.email_verified ? "Vérifié" : "Non vérifié"}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-slate-400">{formatDate(u.created_at)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => setEditUserId(u.id)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                            <Pencil className="h-3.5 w-3.5" /> Modifier
                          </button>
                          <button type="button" onClick={() => handleDeleteUser(u)} disabled={u.id === currentUser?.id} title={u.id === currentUser?.id ? "Impossible de supprimer votre propre compte" : "Supprimer"} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40">
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pagedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-500 dark:text-slate-400">
                        {users.length === 0 ? t("admin.noUsersYet") : t("admin.noUsersMatch")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {pagedUsers.map((u) => (
                <article key={u.id} className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-slate-100">{u.display_name}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-slate-400">{u.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${u.role === "admin" ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-100" : "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200"}`}>
                      {userRoleLabel(u.role, t)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                    <button type="button" onClick={() => handleToggleVerified(u)} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${u.email_verified ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                      {u.email_verified ? <MailCheck className="h-3 w-3" /> : <MailX className="h-3 w-3" />}
                      {u.email_verified ? "Vérifié" : "Non vérifié"}
                    </button>
                    <span>{u.credits} crédit{u.credits > 1 ? "s" : ""}</span>
                    <span>Inscrit le {formatDate(u.created_at)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setEditUserId(u.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 dark:border-slate-700 dark:text-slate-200">
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </button>
                    <button type="button" onClick={() => handleDeleteUser(u)} disabled={u.id === currentUser?.id} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 disabled:opacity-40 dark:border-red-900 dark:text-red-300">
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                  </div>
                </article>
              ))}
              {pagedUsers.length === 0 && (
                <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                  {users.length === 0 ? t("admin.noUsersYet") : t("admin.noUsersMatch")}
                </p>
              )}
            </div>

            {usersTotalPages > 1 && (
              <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Page {currentUsersPage} sur {usersTotalPages}
                </p>
                <Pagination page={currentUsersPage} totalPages={usersTotalPages} onPageChange={goToUsersPage} />
              </div>
            )}
          </Card>

          {editUserId && (
            <div
              className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-user-title"
              onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditUser(); }}
            >
              <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-800 sm:rounded-2xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 id="edit-user-title" className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t("admin.editUser")}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{t("admin.editUserDesc")}</p>
                  </div>
                  <button type="button" onClick={closeEditUser} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700" aria-label={t("common.close")}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form className="mt-5 space-y-4" onSubmit={handleSubmitEditUser}>
                  <div>
                    <label htmlFor="edit-user-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{t("admin.fullName")}</label>
                    <Input id="edit-user-name" value={editDisplayName || ""} onChange={(e) => setEditDisplayName(e.target.value)} minLength={2} maxLength={60} required />
                  </div>
                  <div>
                    <label htmlFor="edit-user-email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{t("admin.emailAddress")}</label>
                    <Input id="edit-user-email" type="email" value={editEmail || ""} onChange={(e) => setEditEmail(e.target.value)} maxLength={254} required />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="edit-user-role" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{t("admin.role")}</label>
                      <Select id="edit-user-role" value={editRole || "user"} onChange={(e) => setEditRole(e.target.value)}>
                        <option value="user">{t("admin.memberRole")}</option>
                        <option value="admin">{t("admin.adminRole")}</option>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="edit-user-credits" className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{t("admin.credits")}</label>
                      <Input id="edit-user-credits" type="number" min={0} max={1000000} step={1} value={editCredits} onChange={(e) => setEditCredits(e.target.value)} required />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                    <input type="checkbox" checked={editEmailVerified === "oui"} onChange={(e) => setEditEmailVerified(e.target.checked ? "oui" : "non")} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 dark:border-slate-600" />
                    E-mail vérifié
                  </label>
                  {editUserId === currentUser?.id && editRole !== "admin" && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      Vous ne pouvez pas retirer votre propre rôle administrateur.
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="secondary" onClick={closeEditUser} disabled={editSaving}>{t("admin.cancel")}</Button>
                    <Button type="submit" disabled={editSaving || (editUserId === currentUser?.id && editRole !== "admin")}>
                      {editSaving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
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
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </button>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder={t("admin.search")} value={searchDoc} onChange={(e) => { setSearchDoc(e.target.value); setDocsPage(1); }} className="pl-9" />
              </div>
            </div>
          </div>
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={allPageDocsSelected}
                onChange={() => {
                  setSelectedDocIds((prev) => allPageDocsSelected
                    ? prev.filter((id) => !pageDocIds.includes(id))
                    : [...new Set([...prev, ...pageDocIds])]);
                }}
                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 dark:text-primary-100"
              />
              Sélectionner la page
            </label>
            {selectedDocIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{selectedDocIds.length} sélectionné(s)</span>
                <button
                  onClick={() => handleBulkVisibility("public")}
                  disabled={bulkBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 ring-1 ring-teal-200 dark:ring-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 disabled:opacity-50"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  Public
                </button>
                <button
                  onClick={() => handleBulkVisibility("private")}
                  disabled={bulkBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 ring-1 ring-gray-200 dark:ring-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50"
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
              <span className="text-xs text-gray-500 dark:text-slate-400">{t("admin.bulkHint")}</span>
            )}
          </div>
          {filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">{t("admin.noDocs")}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {pagedDocs.map(d => (
                <article key={d.id} className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-shadow hover:shadow-md">
                  <input
                    type="checkbox"
                    checked={selectedDocIds.includes(d.id)}
                    onChange={() => toggleDocSelection(d.id)}
                    aria-label={`Sélectionner ${d.title}`}
                    className="absolute right-2.5 top-2.5 z-20 h-4 w-4 cursor-pointer rounded border-white/70 bg-white/90 dark:bg-slate-800/90 text-primary-600 dark:text-primary-100 shadow-sm"
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
                      <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/90 dark:bg-slate-800/90 px-2.5 py-1 text-[11px] font-medium text-gray-800 dark:text-slate-200 backdrop-blur">
                        {d.category}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-3.5">
                    <Link
                      to={`/documents/${d.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-100"
                    >
                      {d.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-slate-400">{d.author_name}</p>
                    <p className="mt-1 truncate text-[11px] text-gray-400" title={d.original_filename}>{d.original_filename || "Fichier"}</p>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                      {canShowViewCount(d) && (
                        <div>
                          <p className="text-gray-400">{t("admin.views")}</p>
                          <p className="font-semibold text-gray-700 dark:text-slate-300">{d.view_count || 0}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400">{t("admin.downloadsShort")}</p>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">{d.download_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">{t("admin.size")}</p>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">{d.size_bytes ? formatSize(d.size_bytes) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">{t("admin.added")}</p>
                        <p className="font-semibold text-gray-700 dark:text-slate-300">{formatDate(d.created_at)}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-end gap-1 border-t border-gray-100 dark:border-slate-700 pt-3">
                      <Link
                        to={`/documents/${d.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title={t("admin.openDoc")}
                        aria-label={t("admin.openDoc")}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ouvrir
                      </Link>
                      <button
                        onClick={() => handleDeleteDoc(d)}
                        title={t("admin.deleteDoc")}
                        aria-label={t("admin.deleteDoc")}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
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
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{t("admin.reportsSubtitle")}</p>
            </div>
            <Button variant="secondary" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>

          {reportsLoading ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">{t("common.loading")}</div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">{t("admin.noReportsYet")}</div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const targetDocId = report.document_id || report.comment_document_id;
                const statusStyles = report.status === "pending"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                  : report.status === "resolved"
                    ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400";
                const statusLabel = report.status === "pending" ? "En attente" : report.status === "resolved" ? "Résolu" : "Ignoré";
                return (
                  <article key={report.id} className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles}`}>{statusLabel}</span>
                          <span className="rounded-full bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                            {reportReasonLabels[report.reason] || report.reason}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(report.created_at)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {report.document_id ? "Document signalé" : "Commentaire signalé"}
                          {targetDocId && (
                            <>
                              {" · "}
                              <Link to={`/documents/${targetDocId}`} target="_blank" rel="noreferrer" className="font-medium text-primary-600 dark:text-primary-100 hover:underline">
                                {report.document_title || "Voir le document"}
                              </Link>
                            </>
                          )}
                        </p>
                        {report.comment_content && (
                          <p className="mt-1 line-clamp-2 rounded-lg bg-gray-50 dark:bg-slate-900 px-3 py-2 text-sm text-gray-700 dark:text-slate-300">
                            « {report.comment_content} »
                            {report.comment_author_name && <span className="text-gray-400"> — {report.comment_author_name}</span>}
                          </p>
                        )}
                        {report.details && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                            <span className="font-medium text-gray-700 dark:text-slate-300">{t("admin.details")}</span> {report.details}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
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
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                            >
                              <X className="h-3.5 w-3.5" />
                              Ignorer
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReportStatus(report, "pending")}
                            className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900"
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
                <History className="h-5 w-5 text-primary-600 dark:text-primary-100" />
                Journal d'audit
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{t("admin.auditSubtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("audit")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-900"
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
            <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">{t("common.loading")}</div>
          ) : audit.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">{t("admin.noAuditYet")}</div>
          ) : (
            <div className="space-y-3">
              {audit.map((entry) => {
                const details = formatAuditDetails(entry.details);
                const tone = entry.action.includes("delete")
                  ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                  : entry.action.includes("update")
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                    : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300";
                return (
                  <article key={entry.id} className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
                            {auditActionLabels[entry.action] || entry.action}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-900 dark:text-slate-100">
                          Par <span className="font-medium">{entry.admin_name || "Administrateur supprimé"}</span>
                          {entry.admin_email && <span className="text-gray-500 dark:text-slate-400"> ({entry.admin_email})</span>}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                          Cible : {entry.target_type || "—"}
                          {entry.target_id && <span className="ml-1 font-mono">{String(entry.target_id).slice(0, 8)}…</span>}
                        </p>
                        {details && <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{details}</p>}
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
        <div className="space-y-5 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                  <Settings className="h-5 w-5 shrink-0" />
                  Paramètres du site
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                  Ces réglages sont enregistrés en base et appliqués immédiatement à la plateforme et aux e-mails.
                </p>
              </div>
              {settingsDirty && (
                <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Modifications non enregistrées
                </span>
              )}
            </div>
          </Card>

          <form onSubmit={handleSaveSettings} className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card className="p-4 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{t("admin.siteIdentity")}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.siteIdentityDesc")}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">{t("admin.siteName")}</label>
                    <Input
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      maxLength={60}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{String(settings.siteName || "").length}/60 caractères</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">{t("admin.shortDescription")}</label>
                    <Input
                      value={settings.siteTagline || ""}
                      onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })}
                      maxLength={120}
                      placeholder={t("admin.siteTaglinePlaceholder")}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{String(settings.siteTagline || "").length}/120 caractères</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">{t("admin.contactEmailLabel")}</label>
                    <Input
                      type="email"
                      value={settings.contactEmail || ""}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{t("admin.contactEmailHint")}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">{t("admin.preview")}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-slate-100">{settings.siteName || "Nom du site"}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-slate-400">{settings.siteTagline || t("admin.shortDescription")}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{t("admin.filesSection")}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.filesSectionDesc")}</p>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">Taille maximale par fichier (Mo)</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxUploadSizeMb}
                    onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: e.target.value })}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Limite appliquée lors du dépôt, entre 1 et 100 Mo.
                  </p>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                    <span>1 Mo</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{settings.maxUploadSizeMb || 0} Mo</span>
                    <span>100 Mo</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{t("admin.credits")}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.creditsSectionDesc")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">{t("admin.initialCredits")}</label>
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      value={settings.creditsInitiaux}
                      onChange={(e) => setSettings({ ...settings, creditsInitiaux: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{t("admin.initialCreditsHint")}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">{t("admin.creditsPerUpload")}</label>
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      value={settings.creditsParUpload}
                      onChange={(e) => setSettings({ ...settings, creditsParUpload: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{t("admin.creditsPerUploadHint")}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  {t("admin.creditsSummary", { initial: Number(settings.creditsInitiaux) || 0, upload: Number(settings.creditsParUpload) || 0 })}
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{t("admin.accessSection")}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t("admin.accessSectionDesc")}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-700">
                    <Toggle
                      checked={Boolean(settings.allowRegistrations)}
                      onChange={(e) => setSettings({ ...settings, allowRegistrations: e.target.checked })}
                      label="Autoriser les inscriptions"
                      description="Si désactivé, la création de compte est bloquée et les liens d'inscription sont masqués."
                    />
                  </div>
                  <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-700">
                    <Toggle
                      checked={Boolean(settings.publicBrowsing)}
                      onChange={(e) => setSettings({ ...settings, publicBrowsing: e.target.checked })}
                      label="Navigation publique"
                      description="Si désactivé, les visiteurs non connectés doivent se connecter pour consulter la bibliothèque."
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div className="sticky bottom-3 z-10">
              <Card className="flex flex-col gap-3 p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {settingsDirty ? "Des modifications sont en attente d'enregistrement." : "Tous les paramètres sont à jour."}
                </p>
                <div className="flex flex-col gap-2 min-[420px]:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResetSettings}
                    disabled={!settingsDirty || savingSettings}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                  <Button type="submit" disabled={!settingsDirty || savingSettings}>
                    <Save className="h-4 w-4" />
                    {savingSettings ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </Card>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
