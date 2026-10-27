import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { KeyRound, ArrowLeft } from "lucide-react";
import { Input, Button } from "../components/ui";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !code || !password) return toast.error("Tous les champs sont requis");
    if (password.length < 8) return toast.error("Mot de passe trop court (min 8 caractères)");
    if (password !== confirm) return toast.error("Les mots de passe ne correspondent pas");
    setLoading(true);
    try {
      await resetPassword({ email, code, password });
      toast.success("Mot de passe réinitialisé");
      navigate("/login");
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
            <KeyRound className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">Réinitialiser le mot de passe</h1>
          <p className="text-sm text-gray-600 sm:text-base">Entrez le code reçu par email et votre nouveau mot de passe</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code de réinitialisation</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 caractères" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </Button>
        </form>
      </div>
    </div>
  );
}
