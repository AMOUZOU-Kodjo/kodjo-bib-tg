import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { forgotPassword } from "../api/auth";
import { Mail, ArrowLeft } from "lucide-react";
import { Input, Button } from "../components/ui";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error(t("auth.missingEmail"));
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success(t("auth.codeSentIfExists"));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10 sm:py-14">
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-100">
        <ArrowLeft className="w-4 h-4" />
        {t("auth.backToLogin")}
      </Link>
      <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
            <Mail className="w-6 h-6 text-primary-600 dark:text-primary-100" />
          </div>
          <div className="mb-2 flex items-center justify-center gap-3">
            <img src="/logo.png" alt="Archivia" className="h-10 w-10 rounded-xl object-contain" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl">{t("auth.forgotTitle")}</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400 sm:text-base">
            {sent ? t("auth.forgotSentDesc") : t("auth.forgotDesc")}
          </p>
        </div>
        {!sent ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.email")}</label>
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.sending") : t("auth.sendCode")}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Button onClick={() => navigate("/reset-password", { state: { email } })} className="w-full">
              {t("auth.enterCode")}
            </Button>
            <button onClick={() => setSent(false)} className="w-full text-center text-sm text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-100">
              {t("auth.resendCode")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
