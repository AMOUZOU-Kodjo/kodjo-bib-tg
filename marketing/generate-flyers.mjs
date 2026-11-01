import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "flyers");
fs.mkdirSync(outDir, { recursive: true });

const SITE_URL = "kodjo-bib-tg.pages.dev";

const VERSIONS = {
  enseignants: {
    badge: "POUR LES ENSEIGNANTS",
    title: "Vos cours, TD et annales, accessibles à vos étudiants 24h/24",
    subtitle: "Déposez une fois. Partagez avec toutes vos classes. Gratuitement.",
    benefits: [
      "Déposez vos supports en quelques secondes",
      "Partagez un lien avec vos étudiants",
      "Documents publics ou privés, vous gardez le contrôle"
    ],
    ctaTitle: "Scannez pour commencer",
    ctaText: "Déposez votre premier document",
    qr: "qr-enseignants.png"
  },
  etudiants: {
    badge: "POUR LES ÉTUDIANTS",
    title: "Tous vos cours, TD et annales au même endroit",
    subtitle: "Révisez plus vite, partagez vos fiches et entraidez-vous. Gratuit.",
    benefits: [
      "Trouvez les documents de votre filière",
      "Déposez vos fiches et annales",
      "Accédez depuis votre téléphone, partout"
    ],
    ctaTitle: "Scannez pour explorer",
    ctaText: "Trouvez vos cours en quelques secondes",
    qr: "qr-etudiants.png"
  },
  general: {
    badge: "PLATEFORME COLLABORATIVE",
    title: "Archivez. Partagez. Apprenez.",
    subtitle: "Tous vos documents utiles au même endroit. Gratuit et accessible sur mobile.",
    benefits: [
      "Cours, TD, annales, rapports et plus encore",
      "Déposez et partagez en quelques clics",
      "Documents publics ou privés, liens sécurisés"
    ],
    ctaTitle: "Scannez pour découvrir",
    ctaText: "Rejoignez la communauté",
    qr: "qr-site.png"
  }
};

const SIZES = {
  a5: {
    page: "A5",
    width: "148mm",
    height: "210mm",
    fontSize: "9.2pt",
    topH: "25mm",
    padX: "11mm",
    padTop: "9mm",
    padBottom: "7mm",
    phoneW: "41mm",
    h1: "2.05em",
    sub: "1em",
    gap: "4mm",
    qrMain: "26mm",
    qrWa: "20mm",
    footer: "8.2pt"
  },
  a4: {
    page: "A4",
    width: "210mm",
    height: "297mm",
    fontSize: "12pt",
    topH: "33mm",
    padX: "17mm",
    padTop: "13mm",
    padBottom: "10mm",
    phoneW: "62mm",
    h1: "2.1em",
    sub: "1.02em",
    gap: "6mm",
    qrMain: "38mm",
    qrWa: "29mm",
    footer: "10pt"
  }
};

function buildHtml(versionKey, sizeKey) {
  const v = VERSIONS[versionKey];
  const s = SIZES[sizeKey];
  const benefits = v.benefits.map((b) => `<li>${b}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Flyer ${versionKey} ${sizeKey}</title>
<style>
  @page { size: ${s.page}; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page {
    position: relative;
    width: ${s.width};
    height: ${s.height};
    font-size: ${s.fontSize};
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    margin: 0 auto;
  }
  .topbar {
    height: ${s.topH};
    padding: 0 ${s.padX};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4mm;
    background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
    border-bottom: 1.2mm solid #d4a017;
    color: #ffffff;
    flex: 0 0 auto;
  }
  .brand { display: flex; align-items: center; gap: 3.5mm; min-width: 0; }
  .logo {
    width: 17mm; height: 17mm;
    background: #ffffff;
    border-radius: 3mm;
    display: flex; align-items: center; justify-content: center;
    padding: 1.6mm;
    flex: 0 0 auto;
    box-shadow: 0 1mm 2.5mm rgba(0,0,0,.18);
  }
  .logo img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .brand-name { font-weight: 800; font-size: 1.12em; line-height: 1.1; letter-spacing: .01em; }
  .brand-url { font-size: .78em; opacity: .85; margin-top: .6mm; letter-spacing: .02em; }
  .tag {
    flex: 0 0 auto;
    background: #d4a017;
    color: #1f2937;
    font-weight: 800;
    font-size: .72em;
    letter-spacing: .12em;
    padding: 1.6mm 3.2mm;
    border-radius: 999px;
  }
  main {
    flex: 1 1 auto;
    min-height: 0;
    padding: ${s.padTop} ${s.padX} ${s.padBottom};
    display: flex;
    flex-direction: column;
    gap: ${s.gap};
  }
  .badge {
    align-self: flex-start;
    background: #ccfbf1;
    color: #0f766e;
    border: .35mm solid #5eead4;
    font-weight: 800;
    font-size: .72em;
    letter-spacing: .12em;
    padding: 1.4mm 3mm;
    border-radius: 999px;
  }
  h1 {
    margin: 0;
    font-size: ${s.h1};
    line-height: 1.08;
    font-weight: 900;
    letter-spacing: -.015em;
    color: #0f172a;
    max-width: 100%;
  }
  .sub {
    margin: 0;
    font-size: ${s.sub};
    line-height: 1.35;
    color: #334155;
    font-weight: 500;
  }
  .hero {
    display: grid;
    grid-template-columns: 1fr ${s.phoneW};
    gap: ${s.gap};
    align-items: start;
    flex: 0 0 auto;
  }
  .benefits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 3.2mm;
  }
  .benefits li {
    position: relative;
    padding-left: 8mm;
    line-height: 1.32;
    font-weight: 600;
    color: #1e293b;
    font-size: .98em;
  }
  .benefits li::before {
    content: "";
    position: absolute;
    left: 0; top: .35mm;
    width: 4.8mm; height: 4.8mm;
    background: #0f766e;
    border-radius: 50%;
  }
  .benefits li::after {
    content: "";
    position: absolute;
    left: 1.55mm; top: 1.5mm;
    width: 1.5mm; height: 2.6mm;
    border-right: .65mm solid #ffffff;
    border-bottom: .65mm solid #ffffff;
    transform: rotate(45deg);
  }
  .phone {
    margin: 0;
    width: ${s.phoneW};
    border-radius: 5mm;
    border: 1.2mm solid #0f172a;
    overflow: hidden;
    background: #0f172a;
    box-shadow: 0 2.5mm 6mm rgba(15, 23, 42, .22);
  }
  .phone img { display: block; width: 100%; height: auto; }
  .cta {
    margin-top: auto;
    display: flex;
    align-items: stretch;
    gap: 3.5mm;
    background: #f0fdfa;
    border: .4mm solid #99f6e4;
    border-radius: 4mm;
    padding: 4mm;
  }
  .qr-main, .qr-wa { display: flex; align-items: center; gap: 3mm; min-width: 0; }
  .qr-main { flex: 1.5; }
  .qr-wa { flex: 1; border-left: .35mm solid #ccfbf1; padding-left: 4mm; }
  .qr-main img { width: ${s.qrMain}; height: ${s.qrMain}; flex: 0 0 auto; }
  .qr-wa img { width: ${s.qrWa}; height: ${s.qrWa}; flex: 0 0 auto; }
  .qr-title { display: block; font-weight: 800; font-size: .95em; color: #0f172a; line-height: 1.2; }
  .qr-text { display: block; font-size: .8em; color: #475569; line-height: 1.3; margin-top: .8mm; }
  footer {
    flex: 0 0 auto;
    background: #0f172a;
    color: #ffffff;
    padding: 3.2mm ${s.padX};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4mm;
    font-size: ${s.footer};
  }
  .footer-left { font-weight: 600; opacity: .92; }
  .footer-right { opacity: .8; text-align: right; }
  .footer-url { color: #5eead4; font-weight: 700; }
  @media screen {
    body { background: #ffffff; }
  }
  @media print {
    body { background: #ffffff; }
    .page { margin: 0; }
  }
</style>
</head>
<body>
<div class="page">
  <header class="topbar">
    <div class="brand">
      <div class="logo"><img src="../assets/logo.png" alt="Archives de Documents"></div>
      <div>
        <div class="brand-name">Archives de Documents</div>
        <div class="brand-url">${SITE_URL}</div>
      </div>
    </div>
    <div class="tag">GRATUIT</div>
  </header>

  <main>
    <div class="badge">${v.badge}</div>
    <h1>${v.title}</h1>
    <p class="sub">${v.subtitle}</p>

    <div class="hero">
      <ul class="benefits">${benefits}</ul>
      <figure class="phone"><img src="../assets/screenshot-home-crop.png" alt="Aperçu de la plateforme"></figure>
    </div>

    <section class="cta">
      <div class="qr-main">
        <img src="../assets/${v.qr}" alt="QR code du site">
        <div>
          <span class="qr-title">${v.ctaTitle}</span>
          <span class="qr-text">${v.ctaText}</span>
        </div>
      </div>
      <div class="qr-wa">
        <img src="../assets/qr-whatsapp.png" alt="QR code de la chaîne WhatsApp">
        <div>
          <span class="qr-title">Chaîne WhatsApp</span>
          <span class="qr-text">Nouveaux documents et actualités</span>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="footer-left"><span class="footer-url">${SITE_URL}</span> · Gratuit · Collaboratif</div>
    <div class="footer-right">Facebook · LinkedIn · TikTok · WhatsApp</div>
  </footer>
</div>
<script>
  window.addEventListener("load", () => {
    const page = document.querySelector(".page");
    const footer = document.querySelector("footer");
    const overflow = Math.round(footer.getBoundingClientRect().bottom - page.getBoundingClientRect().bottom);
    document.documentElement.dataset.fit = overflow <= 1 ? "ok" : "overflow";
    document.documentElement.dataset.overflow = String(overflow);
    const main = document.querySelector("main");
    const overflowX = Math.round(main.scrollWidth - main.clientWidth);
    document.documentElement.dataset.fitX = overflowX <= 1 ? "ok" : "overflow";
    document.documentElement.dataset.overflowX = String(overflowX);
    for (const [key, selector] of [["topbar", ".topbar"], ["footer", "footer"], ["cta", ".cta"]]) {
      const el = document.querySelector(selector);
      const ox = Math.round(el.scrollWidth - el.clientWidth);
      const suffix = key.charAt(0).toUpperCase() + key.slice(1) + "X";
      document.documentElement.dataset["fit" + suffix] = ox <= 1 ? "ok" : "overflow";
      document.documentElement.dataset["overflow" + suffix] = String(ox);
    }
  });
</script>
</body>
</html>
`;
}

for (const versionKey of Object.keys(VERSIONS)) {
  for (const sizeKey of Object.keys(SIZES)) {
    const html = buildHtml(versionKey, sizeKey);
    const file = path.join(outDir, `flyer-${versionKey}-${sizeKey}.html`);
    fs.writeFileSync(file, html);
    console.log("written", path.relative(process.cwd(), file));
  }
}
