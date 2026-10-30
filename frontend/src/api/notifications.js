import client from "./client";

export const getNotifications = (params) => client.get("/notifications", { params });
export const markNotificationRead = (id) => client.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => client.post("/notifications/read-all");
export const getPushConfig = () => client.get("/notifications/push/public-key");
export const subscribePush = (data) => client.post("/notifications/push/subscribe", data);
export const unsubscribePush = (data) => client.delete("/notifications/push/subscribe", { data });
