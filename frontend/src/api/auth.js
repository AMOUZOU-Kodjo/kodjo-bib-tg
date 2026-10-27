import client from "./client";

export const register = (data) => client.post("/auth/register", data);
export const verifyEmail = (data) => client.post("/auth/verify-email", data);
export const resendCode = (data) => client.post("/auth/resend-code", data);
export const login = (data) => client.post("/auth/login", data);
export const logout = () => client.post("/auth/logout");
export const forgotPassword = (data) => client.post("/auth/forgot-password", data);
export const resetPassword = (data) => client.post("/auth/reset-password", data);
export const me = () => client.get("/auth/me");
