import { useEffect, useState } from "react";
import { X, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";
import { contactAuthor } from "../../api/documents";

export default function ContactModal({ open, onClose, documentId, documentTitle, authorName }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubject(`À propos de « ${documentTitle} »`);
    setMessage("");
  }, [open, documentTitle]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Merci de remplir le sujet et le message");
      return;
    }
    setSending(true);
    try {
      await contactAuthor(documentId, { subject: subject.trim(), message: message.trim() });
      toast.success("Message envoyé à l'auteur");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-7 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50">
              <Mail className="w-5 h-5 text-teal-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Contacter l'auteur</h2>
              <p className="truncate text-sm text-gray-500">{authorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Votre message est transmis par e-mail à l'auteur. Son adresse reste confidentielle.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
            <input
              id="contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              maxLength={150}
              required
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-y"
              placeholder="Bonjour, je souhaite..."
              maxLength={2000}
              required
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50 sm:w-auto"
            >
              <Send className="w-4 h-4" />
              {sending ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
