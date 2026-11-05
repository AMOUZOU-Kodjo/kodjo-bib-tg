import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resetPassword } from "../api/auth";
import { KeyRound, ArrowLeft } from "lucide-react";
import { Input, Button } from "../components/ui";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !code || !password) return toast.error(t("auth.allFieldsRequired"));
    if (password.length < 8) return toast.error(t("auth.passwordTooShort"));
    if (password !== confirm) return toast.error(t("auth.passwordMismatch"));
    setLoading(true);
    try {
      await resetPassword({ email, code, password });
      toast.success(t("auth.resetSuccess"));
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-6 sm:py-10">
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-100">
        <ArrowLeft className="w-4 h-4" />
        {t("auth.backToLogin")}
      </Link>
      <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
            <KeyRound className="w-6 h-6 text-primary-600 dark:text-primary-100" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl">{t("auth.resetTitle")}</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 sm:text-base">{t("auth.resetDesc")}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.email")}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.resetCode")}</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("auth.resetCodePlaceholder")} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.newPassword")}</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.passwordMin")} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.confirmPassword")}</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth.resetting") : t("auth.resetBtn")}
          </Button>
        </form>
      </div>
    </div>
  );
}
