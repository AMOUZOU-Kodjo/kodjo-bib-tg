import React from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) return <div>{t("common.loading")}</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
