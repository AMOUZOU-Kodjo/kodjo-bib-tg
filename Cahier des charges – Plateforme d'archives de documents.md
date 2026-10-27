# Cahier des charges – Plateforme d'archives de documents

*Document destiné à l'agent de développement Big Pickle (Opencode). Il contient le cahier backend, le cahier frontend et les règles de livraison.*

## 1. Vision du projet

Construire un site web **100 % gratuit à héberger** qui sert d'archive collaborative de documents (PDF, Word, et autres formats bureautiques). Les utilisateurs créent un compte vérifié par e-mail, déposent des documents, en téléchargent d'autres, les commentent, les likent, et peuvent écrire par e-mail à la personne qui a déposé un document.

### Règles impératives pour l'agent

- **JavaScript uniquement. Aucun TypeScript** (pas de fichiers `.ts` / `.tsx`, pas de `tsconfig`).
- Frontend : React + Vite + Tailwind CSS.
- Backend : Node.js + Express (modules ES, `"type": "module"`).
- Base de données : **PostgreSQL hébergé sur Neon** (offre gratuite).
- Stockage des fichiers : **Cloudinary** (offre gratuite).
- E-mails transactionnels : **Brevo** (offre gratuite, API HTTP).
- Toutes les clés et secrets sont lus depuis des variables d'environnement, jamais écrits dans le code.
- Le code doit être simple, commenté en français, et organisé comme décrit plus bas.
- Interface en **français**.

## 2. Fonctionnalités

### 2.1 Comptes et authentification

1. Inscription : nom affiché, e-mail, mot de passe.
2. **Vérification de l'e-mail obligatoire** : un code à 6 chiffres (valable 15 minutes) est envoyé via Brevo. Tant que l'e-mail n'est pas vérifié, l'utilisateur ne peut pas se connecter à l'application.
3. Connexion : e-mail + mot de passe. Si le compte n'est pas vérifié, le backend renvoie une erreur spécifique et le frontend redirige vers la page de saisie du code, avec possibilité de renvoyer le code (limite : 1 renvoi par minute).
4. Mot de passe oublié : code à 6 chiffres envoyé par e-mail, puis nouveau mot de passe.
5. Déconnexion.
6. Profil : modifier son nom affiché, voir ses documents déposés et son solde de crédits.

### 2.2 Documents

1. **Upload** (utilisateur connecté et vérifié) : un fichier + titre, description, catégorie (liste libre ou prédéfinie). Formats acceptés : PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT. Taille maximale configurable (par défaut **10 Mo**, limite de l'offre gratuite Cloudinary pour les fichiers non-image).
2. **Liste** des documents avec recherche par titre, filtre par catégorie, tri (récents, plus likés, plus vus, plus téléchargés) et pagination.
3. **Page de détail** d'un document : métadonnées, auteur, compteurs (vues, likes, téléchargements), bouton télécharger, bouton like, commentaires, bouton « Contacter l'auteur ».
4. **Téléchargement** (utilisateur connecté et vérifié) soumis à la règle de crédits (section 2.3).
5. Suppression et modification (titre, description, catégorie) possibles uniquement par l'auteur ; suppression = fichier retiré de Cloudinary + ligne supprimée en base.

### 2.3 Règle de crédits de téléchargement

Interprétation retenue de la consigne « on upload un document et on télécharge 2 documents » : **chaque document uploadé donne droit à 2 téléchargements** de documents.

- À l'inscription, le solde de crédits est de `CREDITS_INITIAUX` (par défaut **0**, configurable).
- Chaque upload validé ajoute `CREDITS_PAR_UPLOAD` crédits (par défaut **2**).
- Chaque téléchargement d'un document consomme 1 crédit.
- Télécharger **son propre document** est gratuit et ne consomme rien.
- Re-télécharger un document déjà téléchargé par le même utilisateur est gratuit.
- Les trois valeurs sont dans des variables d'environnement pour pouvoir changer la règle sans toucher au code (mettre `CREDITS_INITIAUX` à une grande valeur permet de désactiver la contrainte).
- Chaque mouvement de crédit est enregistré dans une table d'historique.
- Pour éviter les abus : un crédit n'est accordé qu'une fois par document, et la suppression d'un document **ne** rend **pas** les crédits.

### 2.4 Interactions

- **Commentaires** : ajout, affichage (plus récents d'abord, paginé), suppression par l'auteur du commentaire ou par l'auteur du document. Longueur maximale 1 000 caractères, texte brut (échapper l'affichage).
- **Likes** : un utilisateur peut liker / unliker un document ; un seul like par utilisateur et par document (contrainte unique en base).
- **Vues** : une vue est comptée par utilisateur connecté et par document **une seule fois par 24 heures** (ou par visiteur anonyme identifié par un hash d'IP si la consultation publique est activée). Le compteur affiché est le total.
- **Contacter l'auteur** : formulaire (sujet + message) → le backend envoie un e-mail via Brevo à l'auteur du document, avec le nom et l'e-mail de l'expéditeur dans `replyTo`. **L'adresse e-mail de l'auteur n'est jamais exposée au frontend.** Limite : 5 messages par heure et par utilisateur.

### 2.5 Accès public ou privé

- La **liste et la page de détail** sont consultables sans compte (pour le référencement et la découverte), mais le téléchargement, le like, le commentaire, l'upload et le contact exigent un compte vérifié.
- Ce comportement doit pouvoir être désactivé par la variable `PUBLIC_BROWSING=false` (tout exige alors la connexion).

## 3. Architecture et hébergement gratuit

| Élément | Service gratuit recommandé |
| --- | --- |
| Frontend (React) | Cloudflare Pages ou Vercel |
| Backend (Express) | Render (offre gratuite, mise en veille après inactivité) ou Koyeb |
| Base de données | Neon (PostgreSQL) |
| Fichiers | Cloudinary |
| E-mails | Brevo |

Notes importantes :

- Le backend gratuit sur Render se met en veille : prévoir une route `GET /api/health` et un message de chargement côté frontend pour le premier appel.
- Neon met aussi la base en veille : utiliser la chaîne de connexion **avec pooler** (`-pooler` dans le nom d'hôte) et `ssl` activé.
- Sur Cloudinary gratuit, la livraison des PDF peut être bloquée par défaut : activer dans les paramètres du compte (Settings → Security) l'option autorisant la livraison des PDF et fichiers ZIP.
- Brevo gratuit : environ 300 e-mails par jour. Le backend doit gérer proprement l'échec d'envoi (erreur claire, pas de plantage).
- Configurer CORS pour n'autoriser que l'URL du frontend (`FRONTEND_URL`).

## 4. CAHIER BACKEND

### 4.1 Technologies

- Node.js 20+, Express, modules ES.
- Base : paquet `pg` (requêtes SQL paramétrées, **pas d'ORM**) ou `postgres`.
- Authentification : `bcryptjs` (hachage), `jsonwebtoken` (JWT).
- Validation : `zod` (utilisable en JavaScript) ou `express-validator`.
- Upload : `multer` (stockage mémoire) + SDK `cloudinary`.
- E-mails : appels HTTP à l'API Brevo (`https://api.brevo.com/v3/smtp/email`) avec la clé `BREVO_API_KEY`, ou le SDK officiel.
- Sécurité : `helmet`, `cors`, `express-rate-limit`, `cookie-parser`.
- Outils : `dotenv`, `nodemon`, `morgan`.

### 4.2 Structure des dossiers

```
backend/
├── package.json
├── .env.example
├── sql/
│   └── schema.sql
└── src/
    ├── server.js
    ├── app.js
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── cloudinary.js
    ├── middlewares/
    │   ├── auth.js
    │   ├── requireVerified.js
    │   ├── upload.js
    │   ├── rateLimit.js
    │   └── errorHandler.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── documents.routes.js
    │   ├── comments.routes.js
    │   ├── users.routes.js
    │   └── contact.routes.js
    ├── controllers/
    ├── services/
    │   ├── email.service.js
    │   ├── cloudinary.service.js
    │   └── credits.service.js
    └── utils/
```

### 4.3 Schéma de base de données (PostgreSQL)

Fournir le fichier `sql/schema.sql` suivant et un script `npm run db:init` qui l'exécute.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  cloudinary_resource_type TEXT NOT NULL DEFAULT 'raw',
  view_count INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_created ON documents (created_at DESC);
CREATE INDEX idx_documents_owner ON documents (owner_id);

CREATE TABLE likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, document_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_doc ON comments (document_id, created_at DESC);

CREATE TABLE views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  viewer_key TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_views_lookup ON views (document_id, viewer_key, viewed_at DESC);

CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('initial','upload','download')),
  document_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Les compteurs (`like_count`, `view_count`, etc.) sont mis à jour **dans la même transaction** que l'action correspondante.

### 4.4 Variables d'environnement (`.env.example`)

```
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=changer_cette_valeur_longue_et_aleatoire
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=Archives
MAX_FILE_SIZE_MB=10
CREDITS_INITIAUX=0
CREDITS_PAR_UPLOAD=2
PUBLIC_BROWSING=true
```

### 4.5 Authentification et sécurité

- Mots de passe : minimum 8 caractères, hachés avec bcrypt (coût 10 ou plus).
- JWT signé, transmis dans un **cookie `httpOnly`, `secure` en production, `sameSite`** adapté (ou, si le frontend et le backend sont sur des domaines différents, en-tête `Authorization: Bearer`, à choisir et documenter clairement).
- Codes de vérification : 6 chiffres générés avec `crypto.randomInt`, **stockés hachés**, expiration 15 minutes, 5 tentatives maximum, usage unique.
- Rate limiting : inscription / connexion / renvoi de code (strict), contact (5/heure), upload (10/heure), global (modéré).
- Messages d'erreur génériques pour la connexion (ne pas révéler si l'e-mail existe) et pour le mot de passe oublié.
- Toutes les requêtes SQL sont paramétrées. Toutes les entrées sont validées côté serveur.
- Vérification du type MIME **et** de l'extension à l'upload, côté serveur.
- Les titres, descriptions et commentaires sont traités comme du texte brut.
- `helmet` activé, CORS restreint à `FRONTEND_URL`.

### 4.6 Fichiers sur Cloudinary

- Upload via `upload_stream` avec `resource_type: 'raw'`, dossier `archives/`, et `type: 'authenticated'` (ou `private`) afin que le fichier ne soit pas accessible par une URL publique permanente.
- Le téléchargement passe **toujours par le backend** : après contrôle (connexion, e-mail vérifié, crédits), le backend génère une **URL signée à courte durée** (environ 5 minutes) avec l'option de téléchargement en pièce jointe, et la renvoie au frontend, qui déclenche le téléchargement.
- Conserver le nom de fichier d'origine pour l'utilisateur.
- En cas d'échec d'insertion en base après l'upload Cloudinary, supprimer le fichier Cloudinary (nettoyage).
- Suppression d'un document : supprimer d'abord sur Cloudinary, puis en base.

### 4.7 E-mails Brevo

Créer `email.service.js` avec une fonction générique `sendEmail({ to, subject, html, replyTo })` et ces modèles (HTML simple, en français) :

1. **Code de vérification** d'e-mail.
2. **Code de réinitialisation** du mot de passe.
3. **Message à l'auteur d'un document** : mention du titre du document, nom de l'expéditeur, message, `replyTo` = e-mail de l'expéditeur.
4. (Optionnel) E-mail de bienvenue après vérification.

Prévoir un mode développement : si `BREVO_API_KEY` est absent, afficher le contenu de l'e-mail (et le code) dans la console au lieu d'envoyer.

### 4.8 Routes de l'API

Préfixe `/api`. Toutes les réponses sont en JSON, avec un format d'erreur uniforme `{ "error": { "code": "...", "message": "..." } }`.

**Auth**

| Méthode | Route | Description | Accès |
| --- | --- | --- | --- |
| POST | `/auth/register` | Crée le compte et envoie le code | Public |
| POST | `/auth/verify-email` | Vérifie le code, ouvre la session | Public |
| POST | `/auth/resend-code` | Renvoie un code (limité) | Public |
| POST | `/auth/login` | Connexion (refus si non vérifié) | Public |
| POST | `/auth/logout` | Déconnexion | Connecté |
| POST | `/auth/forgot-password` | Envoie un code de réinitialisation | Public |
| POST | `/auth/reset-password` | Nouveau mot de passe avec le code | Public |
| GET | `/auth/me` | Utilisateur courant et solde de crédits | Connecté |

**Documents**

| Méthode | Route | Description | Accès |
| --- | --- | --- | --- |
| GET | `/documents` | Liste (paramètres `q`, `category`, `sort`, `page`, `limit`) | Public\* |
| GET | `/documents/:id` | Détail (hors lien de fichier) | Public\* |
| POST | `/documents` | Upload (multipart : `file`, `title`, `description`, `category`) | Vérifié |
| PATCH | `/documents/:id` | Modifier les métadonnées | Auteur |
| DELETE | `/documents/:id` | Supprimer | Auteur |
| POST | `/documents/:id/view` | Enregistre une vue (dédoublonnée sur 24 h) | Public\* |
| POST | `/documents/:id/like` | Bascule like / unlike, renvoie le nouvel état | Vérifié |
| POST | `/documents/:id/download` | Contrôle les crédits, renvoie l'URL signée | Vérifié |
| POST | `/documents/:id/contact` | Envoie un e-mail à l'auteur | Vérifié |

**Commentaires**

| Méthode | Route | Description | Accès |
| --- | --- | --- | --- |
| GET | `/documents/:id/comments` | Liste paginée | Public\* |
| POST | `/documents/:id/comments` | Ajouter | Vérifié |
| DELETE | `/comments/:id` | Supprimer | Auteur du commentaire ou du document |

**Utilisateurs**

| Méthode | Route | Description | Accès |
| --- | --- | --- | --- |
| GET | `/users/me/documents` | Mes documents déposés | Connecté |
| GET | `/users/me/credits` | Solde et historique | Connecté |
| PATCH | `/users/me` | Modifier le nom affiché | Connecté |

**Divers** : `GET /health` (statut du serveur et de la base).

\* Public uniquement si `PUBLIC_BROWSING=true`.

Les réponses de liste et de détail incluent, pour l'utilisateur connecté, `likedByMe` et `isOwner`. Elles n'incluent **jamais** l'e-mail de l'auteur, seulement son nom affiché.

### 4.9 Logique critique à implémenter avec soin

- **Téléchargement** : transaction SQL qui (1) verrouille la ligne utilisateur (`SELECT ... FOR UPDATE`), (2) vérifie si le document est à lui ou déjà téléchargé, (3) sinon vérifie `credits >= 1` (erreur `INSUFFICIENT_CREDITS` avec un message expliquant qu'il faut uploader un document), (4) décrémente le crédit, insère dans `downloads` et `credit_transactions`, incrémente `download_count`, (5) génère l'URL signée.
- **Upload** : après l'upload Cloudinary et l'insertion en base, ajouter `CREDITS_PAR_UPLOAD` crédits et l'historique, dans la même transaction que l'insertion du document.
- **Like** : insertion ou suppression dans `likes` et mise à jour de `like_count` dans une transaction, sans jamais descendre sous zéro.
- **Vue** : n'incrémenter que s'il n'existe pas de vue du même `viewer_key` pour ce document dans les dernières 24 h.

## 5. CAHIER FRONTEND

### 5.1 Technologies

- React 18, **Vite**, JavaScript (fichiers `.jsx` et `.js`).
- **Tailwind CSS** (installation standard avec Vite, configuration dans `tailwind.config.js`).
- `react-router-dom` pour la navigation.
- `axios` pour les appels API (instance unique avec `baseURL` depuis `VITE_API_URL`, gestion globale des erreurs, envoi des cookies si cookie `httpOnly`).
- État global : React Context pour l'authentification (pas de bibliothèque d'état supplémentaire).
- Icônes : `lucide-react`. Notifications : `react-hot-toast`.
- Pas de TypeScript, pas de PropTypes obligatoires.

### 5.2 Structure des dossiers

```
frontend/
├── package.json
├── .env.example            (VITE_API_URL)
├── tailwind.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── api/
    │   ├── client.js
    │   ├── auth.js
    │   ├── documents.js
    │   └── comments.js
    ├── context/
    │   └── AuthContext.jsx
    ├── hooks/
    ├── components/
    │   ├── layout/ (Navbar, Footer, Layout)
    │   ├── documents/ (DocumentCard, DocumentList, UploadForm, FileIcon)
    │   ├── comments/ (CommentList, CommentForm)
    │   ├── contact/ (ContactModal)
    │   └── ui/ (Button, Input, Modal, Spinner, Pagination, EmptyState)
    ├── pages/
    │   ├── Home.jsx
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── VerifyEmail.jsx
    │   ├── ForgotPassword.jsx
    │   ├── ResetPassword.jsx
    │   ├── Documents.jsx
    │   ├── DocumentDetail.jsx
    │   ├── Upload.jsx
    │   ├── Profile.jsx
    │   └── NotFound.jsx
    ├── routes/
    │   └── ProtectedRoute.jsx
    └── utils/ (formatSize, formatDate)
```

### 5.3 Pages et comportement

| Route | Page | Contenu | Accès |
| --- | --- | --- | --- |
| `/` | Accueil | Présentation, barre de recherche, derniers et plus populaires documents, explication de la règle « 1 upload = 2 téléchargements » | Public |
| `/documents` | Catalogue | Recherche, filtre par catégorie, tri, grille de cartes, pagination | Public\* |
| `/documents/:id` | Détail | Titre, description, auteur, date, taille, type, compteurs, boutons Télécharger / Like / Contacter, commentaires | Public\* |
| `/upload` | Dépôt | Formulaire avec glisser-déposer, barre de progression, validation du type et de la taille | Vérifié |
| `/profile` | Profil | Mes documents (modifier / supprimer), solde et historique de crédits, nom affiché | Connecté |
| `/login` | Connexion | E-mail, mot de passe, lien mot de passe oublié | Invité |
| `/register` | Inscription | Nom, e-mail, mot de passe (avec confirmation) | Invité |
| `/verify-email` | Vérification | Saisie du code à 6 chiffres, renvoi avec compte à rebours de 60 s | Invité |
| `/forgot-password`, `/reset-password` | Mot de passe oublié | Deux étapes | Invité |

Comportements attendus :

- Un utilisateur non connecté qui clique sur Télécharger, Like, Commenter ou Contacter est invité à se connecter, puis ramené sur la page d'origine.
- Après l'inscription et après une connexion avec compte non vérifié, redirection automatique vers `/verify-email`.
- **Bouton Télécharger** : appelle `POST /documents/:id/download`, puis ouvre l'URL signée reçue. Si l'erreur est `INSUFFICIENT_CREDITS`, afficher une fenêtre expliquant qu'il faut déposer un document pour gagner des téléchargements, avec un bouton vers `/upload`.
- **Like** : mise à jour optimiste du compteur et de l'état du bouton, avec retour arrière en cas d'erreur.
- **Vue** : appel de `POST /documents/:id/view` une seule fois à l'ouverture de la page de détail.
- **Commentaires** : ajout immédiat dans la liste, suppression avec confirmation, bouton « Charger plus ».
- **Contacter l'auteur** : modale avec sujet et message, état d'envoi, message de confirmation ; ne jamais afficher l'e-mail de l'auteur.
- Le solde de crédits est visible dans la barre de navigation lorsque l'utilisateur est connecté.
- Toutes les actions asynchrones affichent un état de chargement et gèrent les erreurs avec un message en français.
- Le premier appel au backend gratuit peut être lent : afficher un message du type « Le serveur se réveille, patientez quelques secondes ».

### 5.4 Design et Tailwind

- Approche **mobile d'abord**, entièrement responsive (la majorité des utilisateurs sont sur téléphone).
- Design sobre, moderne, lisible : une couleur principale (par exemple indigo ou bleu), fond clair, cartes avec coins arrondis et ombre légère, bon contraste.
- Icône distincte par type de fichier (PDF, Word, Excel, PowerPoint, texte), avec une couleur par type.
- Composants UI réutilisables (`Button`, `Input`, `Modal`, `Spinner`) pour garder des classes Tailwind cohérentes.
- Accessibilité de base : libellés de formulaire, focus visibles, textes alternatifs, boutons accessibles au clavier.
- Mode sombre facultatif (si le temps le permet, via la classe `dark`).

### 5.5 Sécurité côté frontend

- Ne jamais stocker de mot de passe ni de secret côté client.
- Si le JWT est transmis par en-tête, le stocker de la façon la plus sûre possible et le supprimer à la déconnexion et sur erreur 401 ; avec un cookie `httpOnly`, aucun stockage manuel.
- Afficher les contenus saisis par les utilisateurs comme du texte (jamais via `dangerouslySetInnerHTML`).
- Valider les formulaires avant envoi (le backend reste l'autorité).

## 6. Plan de réalisation pour l'agent

Procéder dans cet ordre et valider chaque étape avant de passer à la suivante.

1. **Initialisation** : dépôt avec deux dossiers `backend/` et `frontend/`, `package.json`, `.env.example`, `.gitignore`.
2. **Base de données** : `schema.sql`, `db.js`, script `db:init`, route `/health`.
3. **Authentification** : inscription, codes, vérification d'e-mail, connexion, middlewares, e-mails Brevo, mot de passe oublié.
4. **Documents** : upload vers Cloudinary, liste, détail, modification, suppression.
5. **Crédits et téléchargement** : transactions, URL signées, historique.
6. **Interactions** : likes, vues, commentaires, contact par e-mail.
7. **Frontend socle** : Vite, Tailwind, routeur, contexte d'authentification, composants UI, pages d'authentification.
8. **Frontend documents** : catalogue, détail, upload, profil, interactions.
9. **Finitions** : gestion d'erreurs, états de chargement, responsive, accessibilité.
10. **Déploiement et documentation** : `README.md` avec installation locale, création des comptes Neon / Cloudinary / Brevo, variables d'environnement, déploiement du frontend (Cloudflare Pages ou Vercel) et du backend (Render), commandes utiles.

## 7. Critères d'acceptation

- Un nouvel utilisateur peut s'inscrire, reçoit un code par e-mail, le saisit et se retrouve connecté ; sans vérification, il ne peut pas utiliser l'application.
- Un utilisateur vérifié peut déposer un PDF ou un fichier Word, et son solde augmente de 2 crédits.
- Un utilisateur ayant des crédits peut télécharger un document ; son solde diminue de 1 ; sans crédit, il reçoit un message clair l'invitant à déposer un document.
- Les likes, vues, commentaires et compteurs se mettent à jour correctement et sans doublon.
- Le formulaire de contact envoie un e-mail à l'auteur sans jamais révéler son adresse.
- Aucun secret n'apparaît dans le code ; l'application démarre uniquement avec les variables d'environnement.
- Aucun fichier TypeScript dans le projet.
- Le site fonctionne correctement sur mobile et sur ordinateur.
- Le `README.md` permet à une personne de déployer le projet de bout en bout avec uniquement des offres gratuites.

## 8. Consignes finales pour l'agent

- Si une décision n'est pas précisée ici, choisir l'option **la plus simple et la plus sûre**, la noter dans le `README.md`, et continuer.
- Ne pas ajouter de fonctionnalités hors périmètre (pas de paiement, pas de messagerie interne, pas de notifications push).
- Produire du code lisible plutôt que du code astucieux, avec des noms de variables et de fonctions explicites.
- À la fin de chaque étape du plan, résumer en quelques lignes ce qui a été fait et comment le tester.
