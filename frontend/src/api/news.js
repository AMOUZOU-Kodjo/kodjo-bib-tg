import client from "./client";

export const getNews = (params) => client.get("/news", { params });
