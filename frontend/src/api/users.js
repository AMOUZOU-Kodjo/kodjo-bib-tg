import client from "./client";

export const getMyDocuments = () => client.get("/users/me/documents");
export const getMyCredits = () => client.get("/users/me/credits");
export const getMyFavorites = (params) => client.get("/users/me/favorites", { params });
export const getAuthor = (id) => client.get(`/users/${id}/public`);
export const getAuthorDocuments = (id, params) => client.get(`/users/${id}/documents`, { params });
export const toggleFollow = (id) => client.post(`/users/${id}/follow`);
export const updateMyProfile = (data) => client.patch("/users/me", data);
export const updateNotificationPreferences = (data) => client.patch("/users/me/preferences", data);
export const deleteMyAccount = (data) => client.delete("/users/me", { data });
