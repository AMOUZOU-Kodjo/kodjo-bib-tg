import client from "./client";

export const getDocuments = (params) => client.get("/documents", { params });
export const getDocument = (id) => client.get(`/documents/${id}`);
export const getDocumentCategories = () => client.get("/documents/meta/categories");
export const suggestDocumentCategory = (filename) => client.post("/documents/suggest-category", { filename });
export const getDocumentPreview = (id) => client.get(`/documents/${id}/preview`);
export const getDocumentViewFile = (id) => {
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  return `${base}/documents/${id}/view-file`;
};
export const fetchDocumentViewBlob = (id) =>
  client.get(`/documents/${id}/view-file`, {
    responseType: "blob",
    withCredentials: true
  });
export const uploadDocument = (formData) => client.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateDocument = (id, data) => client.patch(`/documents/${id}`, data);
export const deleteDocument = (id) => client.delete(`/documents/${id}`);
export const viewDocument = (id) => client.post(`/documents/${id}/view`);
export const likeDocument = (id) => client.post(`/documents/${id}/like`);
export const downloadDocument = (id) => client.post(`/documents/${id}/download`);
export const contactAuthor = (id, data) => client.post(`/documents/${id}/contact`, data);
export const getDocumentShareLink = (id) => client.get(`/documents/${id}/share`);
export const createDocumentShareLink = (id, rotate = false) => client.post(`/documents/${id}/share`, { rotate });
export const disableDocumentShare = (id) => client.delete(`/documents/${id}/share`);
