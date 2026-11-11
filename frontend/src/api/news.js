import client from "./client";

export const getNews = (params) => client.get("/news", { params });
export const getNewsArticle = (url) => client.get("/news/article", { params: { url } });
