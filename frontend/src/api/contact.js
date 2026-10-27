import client from "./client";

export const sendSupportMessage = (data) => client.post("/contact/support", data);
