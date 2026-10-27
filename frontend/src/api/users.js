import client from "./client";

export const getMyDocuments = () => client.get("/users/me/documents");
export const getMyCredits = () => client.get("/users/me/credits");
export const updateMyProfile = (data) => client.patch("/users/me", data);
