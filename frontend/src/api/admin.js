import client from "./client";

export const getStats = () => client.get("/admin/stats");
export const getUsers = () => client.get("/admin/users");
export const updateUser = (id, data) => client.patch(`/admin/users/${id}`, data);
export const deleteUserAdmin = (id) => client.delete(`/admin/users/${id}`);
export const getAllDocuments = () => client.get("/admin/documents");
export const deleteDocumentAdmin = (id) => client.delete(`/admin/documents/${id}`);
export const getAdminSettings = () => client.get("/admin/settings");
export const updateAdminSettings = (data) => client.put("/admin/settings", data);
