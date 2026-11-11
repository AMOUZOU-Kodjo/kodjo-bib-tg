import { useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Mail, Lock, LogIn } from "lucide-react";
import { Button, Input } from "../components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { siteName, allowRegistrations } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const from = location.state?.from
    ? `${location.state.from.pathname || "/"}${location.state.from.search || ""}`
    : "/";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      setUser(res.data.user);
      toast.success(t("auth.loginSuccess"));
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.data?.error?.code === "EMAIL_NOT_VERIFIED") {
        navigate("/verify-email", { state: { email } });
        return;
      }
      toast.error(err.response?.data?.error?.message || t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-200px)] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">{t("auth.loginTitle")}</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 sm:text-base">{t("auth.loginSubtitle", { site: siteName })}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.loggingIn") : (
                <>
                  <LogIn className="w-5 h-5" />
                  {t("auth.loginBtn")}
                </>
              )}
            </Button>
          </form>
          <div className="mt-4">
            <a href={(import.meta.env.VITE_API_URL || "http://localhost:4000/api") + "/auth/google"} className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <span>G</span> Continuer avec Google
            </a>
          </div>

          <div className="mt-6 text-center space-y-2">
            <Link to="/forgot-password" className="text-sm text-primary-600 dark:text-primary-100 hover:text-primary-700 dark:hover:text-primary-100 font-medium">
              {t("auth.forgot")}
            </Link>
            {allowRegistrations ? (
              <div className="text-sm text-gray-600 dark:text-slate-400">
                {t("auth.noAccount")}{" "}
                <Link to="/register" className="text-primary-600 dark:text-primary-100 hover:text-primary-700 dark:hover:text-primary-100 font-medium">
                  {t("auth.register")}
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {t("auth.registerClosed")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
