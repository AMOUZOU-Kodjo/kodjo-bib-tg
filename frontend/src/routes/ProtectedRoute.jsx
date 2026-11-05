import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, requireVerified = true }) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>{t("common.loading")}</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requireVerified && !user.email_verified) return <Navigate to="/verify-email" replace />;
  return children;
}
