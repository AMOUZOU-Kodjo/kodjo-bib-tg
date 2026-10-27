import { useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, LogIn } from "lucide-react";
import { Button, Input } from "../components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { siteName } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from
    ? `${location.state.from.pathname || "/"}${location.state.from.search || ""}`
    : "/";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      setUser(res.data.user);
      toast.success("Connexion réussie");
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.data?.error?.code === "EMAIL_NOT_VERIFIED") {
        navigate("/verify-email", { state: { email } });
        return;
      }
      toast.error(err.response?.data?.error?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-200px)] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Connexion</h1>
          <p className="text-sm text-gray-600 sm:text-base">Accédez à votre compte {siteName}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : (
                <>
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Mot de passe oublié ?
            </Link>
            <div className="text-sm text-gray-600">
              Pas de compte ?{" "}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
