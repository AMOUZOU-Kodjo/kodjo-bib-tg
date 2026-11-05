import { useState, useEffect } from "react";
import { verifyEmail, resendCode } from "../api/auth";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, AlertTriangle } from "lucide-react";
import { Input, Button } from "../components/ui";
import { Link } from "react-router-dom";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryEmail = searchParams.get("email")?.trim().toLowerCase() || "";
  const navigate = useNavigate();
  const { user, setUser, loading: authLoading } = useAuth();
  const email = location.state?.email || queryEmail || user?.email || "";
  const emailSent = location.state?.emailSent !== false;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.email_verified) {
      navigate("/");
    } else if (!email) {
      navigate("/login");
    }
  }, [authLoading, user, navigate, email]);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error(t("auth.missingEmail"));
    if (!code) return toast.error(t("auth.missingCode"));
    setLoading(true);
    try {
      const res = await verifyEmail({ email, code });
      setUser(res.data.user);
      toast.success(t("auth.verifySuccess"));
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || t("auth.verifyError"));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return toast.error(t("auth.missingEmail"));
    setResendLoading(true);
    try {
      await resendCode({ email });
      setCooldown(60);
      toast.success(t("auth.newCodeSent"));
    } catch (err) {
      if (err.response?.data?.error?.code === "RATE_LIMIT") setCooldown(60);
      toast.error(err.response?.data?.error?.message || t("common.error"));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-6 sm:py-10">
      <Link to={user ? "/profile" : "/login"} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-100">
        <ArrowLeft className="w-4 h-4" />
        {user ? t("auth.backToProfile") : t("auth.backToLogin")}
      </Link>
      <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
            <Mail className="w-6 h-6 text-primary-600 dark:text-primary-100" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-slate-100 sm:text-2xl">{t("auth.verifyTitle")}</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 sm:text-base">
            {t("auth.verifyDesc")} <span className="font-medium text-gray-900 dark:text-slate-100 break-all">{email || user?.email || t("auth.yourEmail")}</span>
          </p>
        </div>
        {!emailSent && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t("auth.emailNotSent")}</p>
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("auth.verifyCode")}</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="text-center font-mono text-lg tracking-[0.4em]"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth.verifying") : t("auth.verifyBtn")}
          </Button>
        </form>
        <div className="text-center mt-4">
          <button onClick={resend} disabled={resendLoading || cooldown > 0} className="text-sm text-primary-600 dark:text-primary-100 hover:text-primary-700 dark:hover:text-primary-100 disabled:opacity-50">
            {resendLoading ? t("auth.resending") : cooldown > 0 ? t("auth.resendIn", { s: cooldown }) : t("auth.noCodeResend")}
          </button>
        </div>
      </div>
    </div>
  );
}
