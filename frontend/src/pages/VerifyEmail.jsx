import { useState, useEffect } from "react";
import { verifyEmail, resendCode } from "../api/auth";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, AlertTriangle } from "lucide-react";
import { Input, Button } from "../components/ui";
import { Link } from "react-router-dom";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryEmail = searchParams.get("email")?.trim().toLowerCase() || "";
  const navigate = useNavigate();
  const { user, setUser, loading: authLoading } = useAuth();
  const email = location.state?.email || queryEmail || user?.email || "";
  const emailSent = location.state?.emailSent !== false;

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
    if (!email) return toast.error("Email manquant");
    if (!code) return toast.error("Code requis");
    setLoading(true);
    try {
      const res = await verifyEmail({ email, code });
      setUser(res.data.user);
      toast.success("Email vérifié avec succès");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return toast.error("Email manquant");
    setResendLoading(true);
    try {
      await resendCode({ email });
      toast.success("Nouveau code envoyé");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-6 sm:py-10">
      <Link to={user ? "/profile" : "/login"} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" />
        {user ? "Retour au profil" : "Retour à la connexion"}
      </Link>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
            <Mail className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">Vérification de l'e-mail</h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Un code à 6 chiffres a été envoyé à <span className="font-medium text-gray-900 break-all">{email || user?.email || "votre adresse e-mail"}</span>
          </p>
        </div>
        {!emailSent && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>L'e-mail n'a pas pu être envoyé. Utilisez le bouton ci-dessous pour recevoir un nouveau code.</p>
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code de vérification</label>
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
            {loading ? "Vérification..." : "Vérifier mon compte"}
          </Button>
        </form>
        <div className="text-center mt-4">
          <button onClick={resend} disabled={resendLoading} className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50">
            {resendLoading ? "Envoi..." : "Je n'ai pas reçu de code, le renvoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
