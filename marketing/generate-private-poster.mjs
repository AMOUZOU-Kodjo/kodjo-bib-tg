import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "flyers");
fs.mkdirSync(outDir, { recursive: true });

const SITE_URL = "kodjo-bib-tg.pages.dev";

const ICONS = {
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>'
};

const SIZES = {
  a4: {
    page: "A4",
    width: "210mm",
    height: "297mm",
    fontSize: "11.5pt",
    topH: "29mm",
    padX: "16mm",
    padTop: "12mm",
    padBottom: "10mm",
    h1: "2em",
    sub: "1.02em",
    gap: "5mm",
    cardPad: "4mm",
    cardIcon: "8.5mm",
    qr: "40mm",
    cardsDir: "row",
    stepsCols: "2",
    footer: "9pt"
  },
  a5: {
    page: "A5",
    width: "148mm",
    height: "210mm",
    fontSize: "8.7pt",
    topH: "22mm",
    padX: "10mm",
    padTop: "8mm",
    padBottom: "6mm",
    h1: "1.85em",
    sub: "0.95em",
    gap: "2.1mm",
    cardPad: "2.6mm",
    cardIcon: "6.2mm",
    qr: "23mm",
    cardsDir: "row",
    stepsCols: "1",
    footer: "7.4pt"
  }
};

function buildHtml(sizeKey) {
  const s = SIZES[sizeKey];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Affiche stockage privé ${sizeKey}</title>
<style>
  @page { size: ${s.page}; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page {
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
  .brand { display: flex; align-items: center; gap: 3.2mm; min-width: 0; }
  .logo {
    width: 15mm; height: 15mm;
    background: #ffffff;
    border-radius: 2.8mm;
    display: flex; align-items: center; justify-content: center;
    padding: 1.4mm;
    flex: 0 0 auto;
    box-shadow: 0 1mm 2.5mm rgba(0,0,0,.18);
  }
  .logo img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .brand-name { font-weight: 800; font-size: 1.08em; line-height: 1.1; }
  .brand-url { font-size: .76em; opacity: .85; margin-top: .5mm; letter-spacing: .02em; }
  .tag {
    flex: 0 0 auto;
    background: #d4a017;
    color: #1f2937;
    font-weight: 800;
    font-size: .7em;
    letter-spacing: .12em;
    padding: 1.5mm 3mm;
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
    font-size: .7em;
    letter-spacing: .11em;
    padding: 1.3mm 2.8mm;
    border-radius: 999px;
  }
  h1 {
    margin: 0;
    font-size: ${s.h1};
    line-height: 1.08;
    font-weight: 900;
    letter-spacing: -.015em;
    color: #0f172a;
    max-width: 98%;
  }
  h1 em { color: #0f766e; font-style: normal; }
  .sub {
    margin: 0;
    font-size: ${s.sub};
    line-height: 1.34;
    color: #334155;
    font-weight: 500;
    max-width: 96%;
  }
  .cards {
    display: flex;
    flex-direction: ${s.cardsDir};
    gap: ${s.gap};
    flex: 0 0 auto;
  }
  .card {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 2.8mm;
    background: #f8fafc;
    border: .35mm solid #e2e8f0;
    border-radius: 3mm;
    padding: ${s.cardPad};
  }
  .card .ico {
    width: ${s.cardIcon};
    height: ${s.cardIcon};
    flex: 0 0 auto;
    display: flex; align-items: center; justify-content: center;
    background: #ccfbf1;
    color: #0f766e;
    border-radius: 2mm;
    padding: 1.2mm;
  }
  .card .ico svg { width: 100%; height: 100%; display: block; }
  .card strong { display: block; font-size: .88em; line-height: 1.15; color: #0f172a; }
  .card span { display: block; font-size: .74em; line-height: 1.25; color: #475569; margin-top: .5mm; }
  .promise {
    display: flex;
    align-items: center;
    gap: 3mm;
    background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
    color: #ffffff;
    border-radius: 3.2mm;
    padding: 3.6mm ${s.cardPad};
    flex: 0 0 auto;
  }
  .promise .ico {
    width: 8mm; height: 8mm;
    flex: 0 0 auto;
    background: rgba(255,255,255,.16);
    border-radius: 2mm;
    display: flex; align-items: center; justify-content: center;
    padding: 1.4mm;
  }
  .promise .ico svg { width: 100%; height: 100%; display: block; }
  .promise strong { display: block; font-size: .92em; line-height: 1.2; }
  .promise span { display: block; font-size: .78em; line-height: 1.3; color: #ccfbf1; margin-top: .5mm; }
  .steps { flex: 0 0 auto; }
  .steps h2, .find strong {
    margin: 0;
    font-size: 1.02em;
    font-weight: 800;
    color: #0f172a;
  }
  .steps h2 { margin-bottom: 2.6mm; display: flex; align-items: center; gap: 2.2mm; }
  .steps h2::before {
    content: ""; width: 1.4mm; height: 5.2mm; background: #d4a017; border-radius: 1mm; display: block;
  }
  .step-grid {
    display: grid;
    grid-template-columns: repeat(${s.stepsCols}, 1fr);
    gap: 2.4mm 4mm;
  }
  .step { display: flex; gap: 2.6mm; align-items: flex-start; min-width: 0; }
  .num {
    width: 6.4mm; height: 6.4mm;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #0f766e;
    color: #ffffff;
    font-weight: 900;
    font-size: .92em;
    display: flex; align-items: center; justify-content: center;
  }
  .step strong { display: block; font-size: .84em; line-height: 1.18; }
  .step span { display: block; font-size: .73em; line-height: 1.25; color: #475569; margin-top: .4mm; }
  .find {
    display: flex;
    align-items: center;
    gap: 3mm;
    background: #fffbeb;
    border: .4mm solid #fcd34d;
    border-radius: 3mm;
    padding: 3.2mm ${s.cardPad};
    flex: 0 0 auto;
  }
  .find .ico {
    width: 8.5mm; height: 8.5mm;
    flex: 0 0 auto;
    background: #fef3c7;
    color: #b45309;
    border-radius: 2mm;
    display: flex; align-items: center; justify-content: center;
    padding: 1.4mm;
  }
  .find .ico svg { width: 100%; height: 100%; display: block; }
  .find-text { flex: 1 1 auto; min-width: 0; }
  .find span { display: block; font-size: .78em; line-height: 1.3; color: #78350f; margin-top: .6mm; }
  .find .note { flex: 0 0 34%; font-size: .7em; line-height: 1.25; color: #92400e; border-left: .35mm solid #fcd34d; padding-left: 3mm; }
  .trust {
    display: flex;
    gap: 3mm;
    background: #ffffff;
    border: .35mm dashed #cbd5e1;
    border-radius: 3mm;
    padding: 2.8mm 3.2mm;
    flex: 0 0 auto;
  }
  .trust div {
    flex: 1 1 0;
    display: flex;
    align-items: center;
    gap: 2mm;
    font-size: .76em;
    font-weight: 700;
    color: #334155;
    line-height: 1.2;
  }
  .trust svg { width: 4.6mm; height: 4.6mm; color: #0f766e; flex: 0 0 auto; }
  .qr {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 4mm;
    background: #f0fdfa;
    border: .4mm solid #99f6e4;
    border-radius: 3.4mm;
    padding: 3.4mm;
    flex: 0 0 auto;
  }
  .qr img { width: ${s.qr}; height: ${s.qr}; flex: 0 0 auto; }
  .qr strong { display: block; font-size: 1em; line-height: 1.2; color: #0f172a; }
  .qr .url { display: block; font-size: .9em; font-weight: 700; color: #0f766e; margin-top: .8mm; }
  .qr .note { display: block; font-size: .76em; color: #475569; margin-top: .8mm; }
  footer {
    flex: 0 0 auto;
    background: #0f172a;
    color: #ffffff;
    padding: 2.6mm ${s.padX};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4mm;
    font-size: ${s.footer};
  }
  footer span:first-child { color: #5eead4; font-weight: 700; }
  footer span:last-child { opacity: .82; text-align: right; }
  @media screen { body { background: #ffffff; } }
  @media print { body { background: #ffffff; } .page { margin: 0; } }
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
    <div class="tag">ESPACE PRIVÉ</div>
  </header>

  <main>
    <div class="badge">NE PERDEZ PLUS VOS DOCUMENTS</div>
    <h1>Vos fiches de cours et vos documents importants, <em>en sécurité ici.</em></h1>
    <p class="sub">Stockez-les en privé. Ils ne sont ni publiés dans la bibliothèque, ni visibles dans les recherches.</p>

    <div class="cards">
      <div class="card">
        <div class="ico">${ICONS.file}</div>
        <div><strong>Fiches de cours</strong><span>Retrouvez vos notes à tout moment.</span></div>
      </div>
      <div class="card">
        <div class="ico">${ICONS.lock}</div>
        <div><strong>Documents privés</strong><span>Stockés dans votre espace personnel.</span></div>
      </div>
      <div class="card">
        <div class="ico">${ICONS.shield}</div>
        <div><strong>Fichiers importants</strong><span>Un seul endroit, accessible depuis votre compte.</span></div>
      </div>
    </div>

    <div class="promise">
      <div class="ico">${ICONS.lock}</div>
      <div>
        <strong>Votre espace privé reste privé.</strong>
        <span>Vos documents ne sont pas publiés et ne sont pas visibles par les autres utilisateurs. Vous seul décidez de partager un lien.</span>
      </div>
    </div>

    <section class="steps">
      <h2>Comment déposer un document privé ?</h2>
      <div class="step-grid">
        <div class="step"><span class="num">1</span><div><strong>Créez votre compte</strong><span>Inscription gratuite, puis confirmez votre e-mail.</span></div></div>
        <div class="step"><span class="num">2</span><div><strong>Cliquez sur « Déposer »</strong><span>Le formulaire s'ouvre immédiatement.</span></div></div>
        <div class="step"><span class="num">3</span><div><strong>Choisissez « Privé »</strong><span>Ajoutez le fichier, un titre, puis sélectionnez Privé.</span></div></div>
        <div class="step"><span class="num">4</span><div><strong>Validez le dépôt</strong><span>Cliquez sur « Déposer le document ». C'est enregistré.</span></div></div>
      </div>
    </section>

    <div class="find">
      <div class="ico">${ICONS.folder}</div>
      <div class="find-text">
        <strong>Comment les retrouver ?</strong>
        <span>Connectez-vous, ouvrez « Mon profil », puis « Mes documents ». Tous vos fichiers privés sont là.</span>
      </div>
      <div class="note">Astuce : donnez un titre clair, par exemple « Fiches Maths L2 – Semestre 1 ».</div>
    </div>

    ${sizeKey === "a4" ? `<div class="trust">
      <div>${ICONS.check}<span>Pas de publication automatique</span></div>
      <div>${ICONS.lock}<span>Pas visible par les autres</span></div>
      <div>${ICONS.folder}<span>Disponible à tout moment</span></div>
    </div>` : ""}

    <section class="qr">
      <img src="../assets/qr-prive.png" alt="QR code pour créer un espace privé">
      <div>
        <strong>Scannez pour créer votre espace privé</strong>
        <span class="url">${SITE_URL}</span>
        <span class="note">Gratuit · Accessible sur mobile · Vos documents privés ne sont jamais publiés.</span>
      </div>
    </section>
  </main>

  <footer>
    <span>${SITE_URL}</span>
    <span>Vos documents privés restent dans votre espace personnel.</span>
  </footer>
</div>
<script>
  window.addEventListener("load", () => {
    const page = document.querySelector(".page");
    const footer = document.querySelector("footer");
    const overflow = Math.round(footer.getBoundingClientRect().bottom - page.getBoundingClientRect().bottom);
    document.documentElement.dataset.fit = overflow <= 1 ? "ok" : "overflow";
    document.documentElement.dataset.overflow = String(overflow);
    for (const [key, selector] of [["topbar", ".topbar"], ["footer", "footer"], ["qr", ".qr"], ["cards", ".cards"], ["find", ".find"]]) {
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

for (const sizeKey of Object.keys(SIZES)) {
  const html = buildHtml(sizeKey);
  const file = path.join(outDir, `affiche-prive-${sizeKey}.html`);
  fs.writeFileSync(file, html);
  console.log("written", path.relative(process.cwd(), file));
}
