import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import { Mail, ArrowLeft } from "lucide-react";
import { Input, Button } from "../components/ui";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Email requis");
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success("Code envoyé si le compte existe");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-6 sm:py-10">
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" />
        Retour à la connexion
      </Link>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
            <Mail className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">Mot de passe oublié</h1>
          <p className="text-sm text-gray-600 sm:text-base">
            {sent
              ? "Un code de réinitialisation vous a été envoyé par email."
              : "Entrez votre adresse email pour recevoir un code de réinitialisation."}
          </p>
        </div>
        {!sent ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le code"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Button onClick={() => navigate("/reset-password", { state: { email } })} className="w-full">
              Saisir le code et réinitialiser
            </Button>
            <button onClick={() => setSent(false)} className="w-full text-center text-sm text-gray-600 hover:text-primary-600">
              Renvoyer un code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
