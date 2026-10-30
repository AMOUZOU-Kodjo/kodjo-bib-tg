import { useState } from "react";
import { register } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import { Button, Input } from "../components/ui";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      toast.error("Le nom doit contenir au moins 2 caractères");
      return;
    }
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const res = await register({ email, password, displayName });
      const emailSent = res.data.emailSent !== false;
      if (emailSent) {
        toast.success("Compte créé, vérifiez votre e-mail");
      } else {
        toast.error(res.data.message || "L'e-mail de vérification n'a pas pu être envoyé");
      }
      navigate("/verify-email", { state: { email, emailSent } });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-200px)] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Inscription</h1>
          <p className="text-sm text-gray-600 sm:text-base">Créez votre compte gratuitement</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom affiché</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Votre nom"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
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
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  placeholder="Retapez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Inscription..." : (
                <>
                  <UserPlus className="w-5 h-5" />
                  S'inscrire
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              Déjà un compte ?{" "}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
