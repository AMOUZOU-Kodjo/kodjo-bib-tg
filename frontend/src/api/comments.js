import client from "./client";

export const getComments = (id, params) => client.get(`/documents/${id}/comments`, { params });
export const addComment = (id, data) => client.post(`/documents/${id}/comments`, data);
export const deleteComment = (commentId) => client.delete(`/comments/${commentId}`);
