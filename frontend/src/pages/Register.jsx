import { useState } from "react";
import { register } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import { Button, Input } from "../components/ui";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { allowRegistrations } = useSiteSettings();
  const { t } = useTranslation();

  const submit = async (e) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      toast.error(t("auth.nameError"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("auth.passwordError"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await register({ email, password, displayName });
      const emailSent = res.data.emailSent !== false;
      if (emailSent) {
        toast.success(t("auth.registerSuccess"));
      } else {
        toast.error(res.data.message || t("auth.registerEmailFail"));
      }
      navigate("/verify-email", { state: { email, emailSent } });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  if (!allowRegistrations) {
    return (
      <div className="flex min-h-[calc(100dvh-120px)] py-8 items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t("auth.registerClosedTitle")}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            {t("auth.registerClosedDesc")}
          </p>
          <Link to="/login" className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700">
            {t("auth.backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-120px)] py-8 items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-6 sm:mb-8">
          <div className="mb-2 flex items-center justify-center gap-3">
            <img src="/logo.png" alt="Archivia" className="h-10 w-10 rounded-xl object-contain" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">{t("auth.registerTitle")}</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 sm:text-base">{t("auth.registerSubtitle")}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.name")}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  autoComplete="name"
                  placeholder={t("auth.namePlaceholder")}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
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
                  placeholder={t("auth.passwordMin")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.confirmPassword")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  placeholder={t("auth.confirmPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.registering") : (
                <>
                  <UserPlus className="w-5 h-5" />
                  {t("auth.registerBtn")}
                </>
              )}
            </Button>
          </form>
          <div className="mt-4">
            <a href={(import.meta.env.VITE_API_URL || "http://localhost:4000/api") + "/auth/google"} className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <span>G</span> Continuer avec Google
            </a>
          </div>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600 dark:text-slate-400">
              {t("auth.haveAccount")}{" "}
              <Link to="/login" className="text-primary-600 dark:text-primary-100 hover:text-primary-700 dark:hover:text-primary-100 font-medium">
                {t("auth.loginBtn")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
