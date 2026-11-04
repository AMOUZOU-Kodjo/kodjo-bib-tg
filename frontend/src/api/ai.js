import client from "./client";

export const generateDescription = (data) => client.post("/ai/generate-description", data);
