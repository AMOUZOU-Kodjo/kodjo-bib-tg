import client from "./client";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const shareBase = apiBase.replace(/\/api\/?$/, "");

export const getSharedDocument = (token) => client.get(`/share/${encodeURIComponent(token)}`);
export const downloadSharedDocument = (token) => client.get(`/share/${encodeURIComponent(token)}/download`);
export const getSharedFileUrl = (token) => `${apiBase}/share/${encodeURIComponent(token)}/file`;
