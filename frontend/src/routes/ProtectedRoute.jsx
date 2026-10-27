import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, requireVerified = true }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requireVerified && !user.email_verified) return <Navigate to="/verify-email" replace />;
  return children;
}
