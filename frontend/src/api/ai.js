import client from "./client";

export const generateDescription = (data) => client.post("/ai/generate-description", data);
export const suggestMetadata = (data) => client.post("/ai/suggest-metadata", data);
export const improveDescription = (data) => client.post("/ai/improve-description", data);
export const summarizeDocument = (data) => client.post("/ai/summarize", data);
export const translateText = (data) => client.post("/ai/translate", data);
export const enhanceSearch = (data) => client.post("/ai/enhance-search", data);
