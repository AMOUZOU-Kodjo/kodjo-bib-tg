import { useEffect, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { Copy, Download, Facebook, Linkedin, Mail, MessageCircle, QrCode, Send, Share2, Twitter, X } from "lucide-react";

export default function ShareModal({ url, title, description, onClose }) {
  const [qrCode, setQrCode] = useState("");
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setQrCode("");
    setQrError(false);
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f766e", light: "#ffffff" }
    })
      .then((dataUrl) => {
        if (active) setQrCode(dataUrl);
      })
      .catch(() => {
        if (active) setQrError(true);
      });
    return () => {
      active = false;
    };
  }, [url]);

  const text = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const message = encodeURIComponent(`${title}${description ? ` — ${description}` : ""} ${url}`);

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${message}`,
      icon: MessageCircle,
      className: "bg-[#25D366] text-white hover:bg-[#1ebe5b]"
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
      icon: Send,
      className: "bg-[#229ED9] text-white hover:bg-[#1d8dc2]"
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
      className: "bg-[#1877F2] text-white hover:bg-[#0f65d6]"
    },
    {
      label: "X / Twitter",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
      icon: Twitter,
      className: "bg-gray-900 text-white hover:bg-black"
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
      className: "bg-[#0A66C2] text-white hover:bg-[#084f96]"
    },
    {
      label: "E-mail",
      href: `mailto:?subject=${text}&body=${message}`,
      icon: Mail,
      className: "bg-amber-50 text-amber-800 hover:bg-amber-100"
    }
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: description || title, url });
    } catch {
      // L'utilisateur a annulé ou le partage natif n'est pas disponible.
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50">
              <Share2 className="h-5 w-5 text-teal-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Partager ce document</h2>
              <p className="line-clamp-1 text-sm text-gray-500">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 bg-transparent px-2 text-xs font-mono text-gray-700 focus:outline-none"
            aria-label="Lien du document"
          />
          <button onClick={copyLink} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white hover:bg-teal-800">
            <Copy className="h-3.5 w-3.5" />
            Copier
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${link.className}`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </a>
          ))}
        </div>

        {"share" in navigator && (
          <button onClick={nativeShare} className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Share2 className="h-4 w-4" />
            Partager avec une application
          </button>
        )}

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <QrCode className="h-4 w-4 text-teal-700" />
              Scanner le QR code
            </h3>
            {qrCode && (
              <a href={qrCode} download={`qr-${title.slice(0, 40).replace(/[^\w-]+/g, "-") || "document"}.png`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-100">
                <Download className="h-3.5 w-3.5" />
                Télécharger
              </a>
            )}
          </div>
          <div className="mt-3 flex justify-center">
            {qrCode ? (
              <img src={qrCode} alt={`QR code pour ${title}`} className="h-48 w-48 rounded-lg bg-white p-2 shadow-sm" />
            ) : qrError ? (
              <p className="py-8 text-sm text-gray-500">Impossible de générer le QR code.</p>
            ) : (
              <div className="h-48 w-48 animate-pulse rounded-lg bg-gray-200" aria-label="Génération du QR code" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
