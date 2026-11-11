import client from "./client";

export const getNews = (params) => client.get("/news", { params });
export const getScienceNews = (params) => client.get("/news/science", { params });
export const getNewsArticle = (url) => client.get("/news/article", { params: { url } });
