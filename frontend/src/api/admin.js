import client from "./client";

export const getStats = () => client.get("/admin/stats");
export const getAdminAnalytics = (params) => client.get("/admin/analytics", { params });
export const getUsers = () => client.get("/admin/users");
export const updateUser = (id, data) => client.patch(`/admin/users/${id}`, data);
export const deleteUserAdmin = (id) => client.delete(`/admin/users/${id}`);
export const getAllDocuments = () => client.get("/admin/documents");
export const deleteDocumentAdmin = (id) => client.delete(`/admin/documents/${id}`);
export const bulkDeleteDocuments = (ids) => client.post("/admin/documents/bulk-delete", { ids });
export const bulkUpdateDocumentsVisibility = (ids, visibility) => client.post("/admin/documents/bulk-visibility", { ids, visibility });
export const getAdminSettings = () => client.get("/admin/settings");
export const updateAdminSettings = (data) => client.put("/admin/settings", data);
export const getAdminReports = (params) => client.get("/admin/reports", { params });
export const updateAdminReportStatus = (id, status) => client.patch(`/admin/reports/${id}`, { status });
export const getAdminAudit = (params) => client.get("/admin/audit", { params });
export const exportAdminData = (type) => client.get(`/admin/export/${type}`, { responseType: "blob" });
