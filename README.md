# PlateMate

La page de liens WhatsApp, disponible sous `/whatsapp/`, sert à organiser des repas à Grenoble : un header simple, une photo, une courte présentation et un seul groupe WhatsApp. HTML, CSS et JavaScript, sans backend ni compilation.

## Aperçu local

Ouvrir `whatsapp/index.html`, ou lancer `python3 -m http.server 8080` puis consulter http://localhost:8080/whatsapp/. Sur Vercel, `/` redirige temporairement vers `/whatsapp/` jusqu'à la livraison de l'application principale.

## Groupe WhatsApp

Un seul groupe réunit hôtes et invités. Le lien d’invitation est directement dans `whatsapp/index.html`, sur le bouton « Rejoindre le groupe WhatsApp ». Il fonctionne sans JavaScript.

Le logo WhatsApp est conservé dans `assets/whatsapp.svg` (source : Simple Icons, https://github.com/simple-icons/simple-icons).

## Identité visuelle

Logo exporté du hero Figma `232:540`, photo fournie par le porteur du projet. Jaune `#F5D000`, bordeaux `#803037`. BBB ReadMe Black Italic hébergée dans `assets/fonts`, issue de https://gitlab.com/bye-bye-binary/bbb-readme (notice conservée). DM Sans via Google Fonts.

Le site peut être publié sur un hébergement statique. Aucun service Azure ou Azurite n’est utilisé.

## Backend (premier socle)

Le site de lancement reste statique et son parcours WhatsApp continue de fonctionner indépendamment de l'API. Le backend dans `backend/` prépare les sprints S1 et S2 du Jalon 2 : comptes, sessions et profils de matching. Il n'est pas encore relié aux pages publiques.

Prérequis : Node.js 20+ et PostgreSQL. Créer une base `platemate`, puis dans `backend/` :

```sh
cp .env.example .env
# Définir DATABASE_URL dans l'environnement (ou charger .env avec le lanceur Node)
npm ci
node --env-file=.env src/server.js --migrate
node --env-file=.env src/server.js
npm test
```

API sur `http://localhost:3000` : `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/profile`, `PUT /api/profile`. Les deux routes POST de compte attendent `{ "email": "...", "password": "..." }` (12 caractères minimum). Le profil attend `displayName`, `city`, et accepte `bio`, `languages`, `dietaryPreferences`, `allergies`, `meetingContext`. Les appels de profil nécessitent la session créée par inscription ou connexion. Le navigateur conserve un cookie HTTP only pendant sept jours ; les sessions sont révoquées à la déconnexion. Les champs de santé potentiellement sensibles (allergies) sont privés et ne sont exposés que sur `/api/profile` au propriétaire connecté.

Pour intégrer l'API au site, servir le site et `/api` sous la même origine via un reverse proxy, puis ajouter les écrans de compte/profil. Le site statique seul ne fournit pas de proxy API. La recherche, le scoring, la messagerie, les réservations et les paiements restent les lots suivants du Jalon 2. Le Jalon 2 propose OAuth/JWT ; ce premier socle utilise des sessions opaques côté serveur afin de permettre une déconnexion révocable, et ne prétend pas livrer OAuth.
