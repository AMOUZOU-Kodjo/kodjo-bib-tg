import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Mail, Send, CheckCircle, Clock, ShieldCheck, FileText,
  LifeBuoy, Flag, Lock, ArrowRight, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { sendSupportMessage } from "../api/contact";

const initialForm = { name: "", email: "", subject: "", message: "" };

const topics = [
  { label: "Support technique", icon: LifeBuoy },
  { label: "Signaler un contenu", icon: Flag },
  { label: "Données personnelles", icon: Lock }
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600";
const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500";

export default function Contact() {
  const { user } = useAuth();
  const { contactEmail, siteName } = useSiteSettings();
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.display_name || "",
      email: f.email || user.email || ""
    }));
  }, [user]);

  const update = (field) => (e) => {
    setError("");
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const chooseTopic = (label) => {
    setError("");
    setForm((f) => ({ ...f, subject: label }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await sendSupportMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim()
      });
      setSent(true);
      toast.success("Message envoyé");
    } catch (err) {
      const message = err.response?.data?.error?.message || "Impossible d'envoyer le message. Réessayez plus tard.";
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setForm({
      ...initialForm,
      name: user?.display_name || "",
      email: user?.email || ""
    });
    setError("");
    setSent(false);
  };

  return (
    <div className="font-ui max-w-6xl mx-auto">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm">
        <Link to="/" className="hover:text-teal-700">Accueil</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">Contact</span>
      </nav>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 shadow-2xl sm:rounded-[28px]">
        <div className="absolute inset-0 contact-grid-bg" />
        <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.02fr]">
          <div className="flex flex-col p-5 sm:p-10 lg:p-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
              Contact
            </span>

            <h1 className="font-display mt-5 text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-tight text-white">
              Une question, une remarque ?<br />
              <span className="text-teal-300">Nous vous lisons.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-gray-300">
              Support technique, signalement de contenu ou demande liée à vos données :
              écrivez-nous, un membre de l'équipe vous répond personnellement.
            </p>

            <ul className="mt-8 space-y-4 text-sm">
              {contactEmail && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                    <Mail className="h-4 w-4 text-teal-300" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">Par e-mail</p>
                    <a href={`mailto:${contactEmail}`} className="break-all text-teal-200 hover:text-teal-100 hover:underline">
                      {contactEmail}
                    </a>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Clock className="h-4 w-4 text-teal-300" />
                </span>
                <div>
                  <p className="font-semibold text-white">Délai de réponse</p>
                  <p className="text-gray-300">Sous 48 à 72 heures ouvrées</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <ShieldCheck className="h-4 w-4 text-teal-300" />
                </span>
                <div>
                  <p className="font-semibold text-white">Confidentialité</p>
                  <p className="text-gray-300">Votre adresse n'est jamais publiée ni revendue.</p>
                </div>
              </li>
            </ul>

            <div className="mt-auto pt-10">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Bien à vous,</p>
              <p className="font-signature mt-1 text-3xl sm:text-4xl text-teal-200">L'équipe {siteName}</p>
              <p className="mt-1 text-xs text-gray-400">Plateforme de partage de documents</p>
            </div>
          </div>

          <div className="p-3 sm:p-6 lg:p-8">
            <div className="rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 sm:p-8">
              {sent ? (
                <div className="text-center py-8">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 ring-8 ring-teal-50/50">
                    <CheckCircle className="h-8 w-8 text-teal-700" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-gray-900">Message bien envoyé</h2>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-600">
                    Merci, votre message a été transmis à l'équipe. Une réponse vous sera adressée
                    à l'adresse indiquée.
                  </p>
                  <p className="font-signature mt-6 text-3xl text-teal-700">L'équipe {siteName}</p>
                  <button
                    onClick={reset}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-gray-900">Écrivez-nous</h2>
                      <p className="mt-1 text-sm text-gray-500">Tous les champs sont requis.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <Lock className="h-3 w-3" />
                      Sécurisé
                    </span>
                  </div>

                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-name" className={labelClass}>Nom</label>
                        <input
                          id="contact-name"
                          value={form.name}
                          onChange={update("name")}
                          maxLength={80}
                          autoComplete="name"
                          className={inputClass}
                          placeholder="Votre nom"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className={labelClass}>E-mail</label>
                        <input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={update("email")}
                          maxLength={160}
                          autoComplete="email"
                          className={inputClass}
                          placeholder="vous@exemple.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <span className={labelClass}>Motif</span>
                      <div className="flex flex-wrap gap-2">
                        {topics.map(({ label, icon: Icon }) => {
                          const active = form.subject === label;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => chooseTopic(label)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                active
                                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-teal-300 hover:text-teal-700"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className={labelClass}>Sujet</label>
                      <input
                        id="contact-subject"
                        value={form.subject}
                        onChange={update("subject")}
                        maxLength={150}
                        className={inputClass}
                        placeholder="En quelques mots..."
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-message" className={labelClass}>Message</label>
                      <textarea
                        id="contact-message"
                        value={form.message}
                        onChange={update("message")}
                        rows={6}
                        maxLength={3000}
                        className={`${inputClass} resize-y`}
                        placeholder="Décrivez votre demande avec le plus de détails possible..."
                        required
                      />
                      <p className="mt-1 text-right text-[11px] text-gray-400">{form.message.length}/3000</p>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:from-teal-800 hover:to-emerald-800 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                      {sending ? "Envoi en cours..." : "Envoyer le message"}
                    </button>

                    <p className="text-center text-[11px] leading-relaxed text-gray-400">
                      En envoyant ce message, vous acceptez notre{" "}
                      <Link to="/confidentialite" className="font-medium text-teal-700 hover:underline">
                        politique de confidentialité
                      </Link>.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/documents" className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
            <FileText className="h-5 w-5 text-teal-700" />
          </div>
          <h2 className="font-semibold text-gray-900">Contacter un auteur</h2>
          <p className="mt-1 text-sm text-gray-600">
            Ouvrez un document et utilisez le bouton « Contacter l'auteur ». Son e-mail reste privé.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700">
            Parcourir le catalogue <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link to="/confidentialite" className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
          </div>
          <h2 className="font-semibold text-gray-900">Vos données</h2>
          <p className="mt-1 text-sm text-gray-600">
            Accès, rectification, suppression : consultez la politique de confidentialité et exercez vos droits.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700">
            Politique de confidentialité <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link to="/cgu" className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <FileText className="h-5 w-5 text-slate-700" />
          </div>
          <h2 className="font-semibold text-gray-900">Règles de la plateforme</h2>
          <p className="mt-1 text-sm text-gray-600">
            Dépôt, crédits, droits d'auteur et modération : tout est détaillé dans les CGU.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700">
            Lire les conditions <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>
    </div>
  );
}
