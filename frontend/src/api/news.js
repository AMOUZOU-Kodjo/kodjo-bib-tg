import client from "./client";

export const getNews = (params) => client.get("/news", { params });
export const getScienceNews = (params) => client.get("/news/science", { params });
export const getWorldNews = (params) => client.get("/news/world", { params });
export const getResearchNews = (params) => client.get("/news/research", { params });
export const getNewsArticle = (url) => client.get("/news/article", { params: { url } });
