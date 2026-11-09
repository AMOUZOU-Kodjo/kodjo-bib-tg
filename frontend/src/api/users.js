import client from "./client";

export const getMyDocuments = () => client.get("/users/me/documents");
export const getMyCredits = () => client.get("/users/me/credits");
export const getMyCreditOrders = () => client.get("/users/me/credit-orders");
export const createCreditOrder = (data) => client.post("/users/me/credit-orders", data);
export const submitCreditOrder = (id, data) => client.patch(`/users/me/credit-orders/${id}`, data);
export const cancelCreditOrder = (id) => client.delete(`/users/me/credit-orders/${id}`);
export const getMyFavorites = (params) => client.get("/users/me/favorites", { params });
export const getMyDownloads = (params) => client.get("/users/me/downloads", { params });
export const getAuthor = (id) => client.get(`/users/${id}/public`);
export const getAuthorDocuments = (id, params) => client.get(`/users/${id}/documents`, { params });
export const toggleFollow = (id) => client.post(`/users/${id}/follow`);
export const updateMyProfile = (data) => client.patch("/users/me", data);
export const uploadMyAvatar = (file) => {
  const form = new FormData();
  form.append("avatar", file);
  return client.post("/users/me/avatar", form, { timeout: 120000 });
};
export const deleteMyAvatar = () => client.delete("/users/me/avatar");
export const updateNotificationPreferences = (data) => client.patch("/users/me/preferences", data);
export const deleteMyAccount = (data) => client.delete("/users/me", { data });
