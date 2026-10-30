import client from "./client";

export const createReport = (data) => client.post("/reports", data);
