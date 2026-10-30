# Plateforme d'archives de documents

Archive collaborative de documents (PDF, Word, Excel, PowerPoint, TXT) avec comptes vérifiés, dépôt, recherche, crédits de téléchargement, commentaires, likes, favoris, abonnements, partage, signalements, notifications et administration.

## Stack

- Frontend : React 18, Vite 8, Tailwind CSS, React Router 7, Axios.
- Backend : Node.js, Express, PostgreSQL, JWT, Cloudinary, Brevo.
- Hébergement gratuit prévu : Cloudflare Pages / Vercel pour le frontend, Render pour le backend, Neon pour PostgreSQL.

## Fonctionnalités principales

- Inscription et connexion avec vérification d'e-mail par code.
- Upload sécurisé vers Cloudinary avec contrôle MIME + extension.
- Recherche plein texte, catégories, tags (5 maximum) et tri.
- Crédits : chaque upload rapporte des crédits, chaque nouveau téléchargement en consomme, avec historique complet (y compris ajustements administrateur).
- Likes, vues dédoublonnées, commentaires, favoris, abonnements.
- Contact de l'auteur sans exposer son adresse e-mail.
- Documents publics ou privés, liens de partage révocables.
- Notifications in-app et push PWA optionnelles.
- Suppression définitive du compte et de ses données depuis le profil.
- Administration : utilisateurs, documents, signalements, paramètres, journal d'audit, actions groupées, statistiques et exports CSV.
- SEO : métadonnées dynamiques, `robots.txt`, `sitemap.xml`, `rss.xml`.

## Installation locale

### 1. Prérequis

- Node.js 20.19+ (ou 22.12+)
- PostgreSQL
- Un compte Cloudinary
- Un compte Brevo (optionnel en développement : les e-mails sont alors affichés dans la console)

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:init
npm run dev
```

Le backend écoute par défaut sur `http://localhost:4000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Le frontend écoute par défaut sur `http://localhost:5173`.

### 4. Compte administrateur

Renseigner `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `backend/.env`, puis :

```bash
cd backend
npm run seed:admin
```

Le mot de passe doit contenir au moins 12 caractères.

## Variables d'environnement

### Backend

Voir `backend/.env.example`.

| Variable | Rôle |
| --- | --- |
| `PORT` | Port HTTP du backend |
| `NODE_ENV` | `development` ou `production` |
| `FRONTEND_URL` | URL exacte du frontend (CORS, cookies, e-mails, SEO) |
| `FRONTEND_ORIGINS` | Origines supplémentaires autorisées, séparées par des virgules |
| `DATABASE_URL` | Chaîne PostgreSQL Neon avec pooler et SSL |
| `JWT_SECRET` | Secret long et aléatoire |
| `JWT_EXPIRES_IN` | Durée de session, par défaut `7d` |
| `CLOUDINARY_*` | Identifiants Cloudinary |
| `BREVO_*` | Clé API et expéditeur Brevo |
| `CONTACT_EMAIL` | Destinataire du formulaire de contact (sinon `BREVO_SENDER_EMAIL`) |
| `MAX_FILE_SIZE_MB` | Taille maximale par défaut des fichiers |
| `CREDITS_INITIAUX` | Crédits offerts à l'inscription |
| `CREDITS_PAR_UPLOAD` | Crédits gagnés par document déposé |
| `PUBLIC_BROWSING` | `false` pour exiger une connexion partout |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Utilisés uniquement par `npm run seed:admin` |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Push PWA optionnel |
| `TELEGRAM_*` | Publication Telegram optionnelle |

### Frontend

Voir `frontend/.env.example`.

| Variable | Rôle |
| --- | --- |
| `VITE_API_URL` | URL complète de l'API, par exemple `https://mon-backend.onrender.com/api` |
| `VITE_WHATSAPP_CHANNEL_URL` | Lien du canal WhatsApp affiché sur le site |
| `VITE_TELEGRAM_CHANNEL_URL` | Lien du canal Telegram |
| `VITE_FACEBOOK_URL`, `VITE_LINKEDIN_URL`, `VITE_TIKTOK_URL` | Réseaux sociaux optionnels |

## Configuration des services

### Cloudinary

- Créer un compte gratuit et récupérer `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Dans Settings → Security, autoriser la livraison des PDF et fichiers ZIP.
- Les fichiers sont envoyés en `resource_type: raw`, `type: authenticated`, dans le dossier `archives/`.
- Les téléchargements passent par le backend et utilisent des URLs signées de courte durée.

### Brevo

- Renseigner `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` et `BREVO_SENDER_NAME`.
- Vérifier l'expéditeur dans Brevo.
- Sans `BREVO_API_KEY`, le backend n'envoie rien et affiche le contenu des e-mails dans la console.

### Notifications push PWA

Générer une paire de clés VAPID :

```bash
cd backend
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Copier les clés dans `backend/.env`. Sans clés, le reste des notifications continue de fonctionner ; seul le push est désactivé. Le service worker n'est enregistré qu'en production.

## Base de données

Appliquer ou mettre à jour le schéma :

```bash
cd backend
npm run db:init
```

Le schéma est additif et peut être rejoué : les colonnes, index et tables récents sont créés avec `IF NOT EXISTS` ou des migrations idempotentes dans `backend/src/config/db.js`.

Tables principales : `users`, `documents`, `comments`, `likes`, `views`, `downloads`, `credit_transactions`, `favorites`, `follows`, `reports`, `notifications`, `push_subscriptions`, `admin_audit_log`.

## Déploiement

### Backend sur Render

1. Créer un Web Service connecté au dépôt.
2. Root directory : `backend`.
3. Build command : `npm install`.
4. Start command : `npm start`.
5. Ajouter toutes les variables de `backend/.env.example`.
6. Mettre `NODE_ENV=production`, `FRONTEND_URL=https://<frontend>` et `DATABASE_URL` avec SSL.
7. Vérifier `GET https://<backend>/api/health`.

### Frontend sur Cloudflare Pages ou Vercel

1. Root directory : `frontend`.
2. Build command : `npm run build`.
3. Output directory : `dist`.
4. Ajouter `VITE_API_URL=https://<backend>/api`.
5. Configurer les routes SPA vers `index.html` (Cloudflare Pages le fait généralement automatiquement, sinon ajouter une règle de fallback).

### Après déploiement

- Le backend doit être déployé avec les nouvelles routes SEO pour que le build frontend récupère `sitemap.xml` et `rss.xml`. Sinon, le sitemap statique de `frontend/public/` est conservé et le build affiche un avertissement.
- Vérifier que `FRONTEND_URL` correspond exactement à l'origine utilisée par le navigateur.
- En production, les cookies utilisent `SameSite=None` et `Secure` : le frontend et le backend doivent être servis en HTTPS.
- Configurer `FRONTEND_ORIGINS` si plusieurs domaines accèdent au backend.

## Commandes utiles

```bash
# Build frontend
cd frontend && npm run build

# Prévisualisation du build
cd frontend && npm run preview

# Démarrage backend
cd backend && npm start

# Vérification syntaxique d'un fichier backend
cd backend && node --check src/routes/documents.routes.js
```

## Vérifications manuelles recommandées

1. Inscription → réception du code → vérification → connexion.
2. Upload d'un PDF et d'un DOCX, puis rejet d'un fichier `.exe`.
3. Téléchargement avec crédits, puis blocage sans crédit.
4. Like, commentaire, vue et compteurs sans doublon.
5. Contact de l'auteur et réception de l'e-mail.
6. Passage d'un document en privé, partage, puis révocation.
7. Signalement, résolution dans l'administration et notification.
8. Export CSV et journal d'audit.
9. Recherche, tags, tri et pagination.
10. Affichage mobile et navigation clavier.
11. Suppression d’un compte de test depuis le profil, avec confirmation par mot de passe.

## Sécurité

- Les mots de passe sont hachés avec bcrypt.
- La suppression du compte est protégée par le mot de passe et limitée en fréquence.
- Les codes de vérification sont stockés hachés, expirent après 15 minutes, sont à usage unique et limités à 5 tentatives.
- Les limites sont appliquées par utilisateur pour le contact et l’upload, et par IP pour l’authentification et le trafic global.
- Les requêtes SQL sont paramétrées.
- Les uploads vérifient l'extension et le type MIME.
- Les entrées textuelles sont validées et affichées comme du texte brut.
- Les secrets ne doivent jamais être commités : utiliser les variables d'environnement.
