import { useEffect, useState } from "react";
import { MessageCircle, Copy, ExternalLink, X } from "lucide-react";
import toast from "react-hot-toast";
import { getDocumentShareLink, createDocumentShareLink } from "../../api/documents";
import { useAuth } from "../../context/AuthContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { WHATSAPP_CHANNEL_URL } from "../../config/links";

export default function WhatsAppPublishButton({ doc, className = "" }) {
  const { user } = useAuth();
  const { siteName } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const buildMessage = (shareUrl) => {
    const lines = [`Nouveau document sur ${siteName}`, "", doc.title || "Document"];
    if (doc.description) lines.push("", doc.description.slice(0, 280));
    if (doc.author_name) lines.push("", `Auteur : ${doc.author_name}`);
    lines.push("", shareUrl);
    return lines.join("\n");
  };

  const prepare = async () => {
    if (!user) {
      toast.error("Connectez-vous pour publier sur la chaîne");
      return;
    }
    if (!user.email_verified) {
      toast.error("Vérifiez votre email pour publier sur la chaîne");
      return;
    }
    if (doc.visibility === "private") {
      toast.error("Ce document est privé. Passez-le en public avant de le publier sur la chaîne.");
      return;
    }
    setLoading(true);
    try {
      const res = doc.shareEnabled
        ? await getDocumentShareLink(doc.id)
        : await createDocumentShareLink(doc.id);
      const shareUrl = res?.data?.url || `${window.location.origin}/documents/${doc.id}`;
      const text = buildMessage(shareUrl);
      setMessage(text);
      setOpen(true);
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Message copié, prêt à coller dans la chaîne");
      } catch {
        toast.success("Message prêt");
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Impossible de préparer la publication");
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Message copié");
    } catch {
      toast.error("Copie impossible, sélectionnez le texte manuellement");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={prepare}
        disabled={loading}
        className={className || "flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#1ebe5b] disabled:cursor-not-allowed disabled:opacity-50"}
      >
        <MessageCircle className="h-5 w-5" />
        {loading ? "Préparation..." : "Publier sur la chaîne WhatsApp"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="whatsapp-publish-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 id="whatsapp-publish-title" className="font-semibold text-gray-900">
                Publier sur la chaîne WhatsApp
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600">
                <li>Copie le message ci-dessous.</li>
                <li>Ouvre la chaîne WhatsApp.</li>
                <li>Colle le message et publie.</li>
              </ol>
              <textarea
                readOnly
                value={message}
                rows={8}
                onFocus={(event) => event.target.select()}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 focus:border-teal-500 focus:outline-none"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copyMessage}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200"
                >
                  <Copy className="h-4 w-4" />
                  Copier le message
                </button>
                <a
                  href={WHATSAPP_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir la chaîne
                </a>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                Ou partager via WhatsApp (contacts et groupes)
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
