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

Prérequis : Node.js 20+ et Docker Compose (ou une instance PostgreSQL existante). Dans `backend/` :

```sh
cp .env.example .env
docker compose up -d db
npm ci
node --env-file=.env src/server.js --migrate
node --env-file=.env src/server.js
npm test
```

API sur `http://localhost:3000` : `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/profile`, `PUT /api/profile`, `GET /api/discover`. Les deux routes POST de compte attendent `{ "email": "...", "password": "..." }` (12 caractères minimum). Le profil attend `displayName`, `city`, et accepte `bio`, `languages`, `dietaryPreferences`, `allergies`, `preferredCuisines`, `experienceGoals`, `preferredAtmospheres`, `meetingContext`, `discoverable` (false par défaut). Les appels de profil et de découverte nécessitent une session. La découverte liste au plus 100 profils consentants, classés selon langue commune (50 points), même ville (30 points) et préférence alimentaire commune (20 points). Les préférences culinaires d'un autre utilisateur et ses allergies ne sont pas renvoyées par la découverte. Ce score ne vérifie **jamais** la sécurité d'un repas en présence d'allergies. Le navigateur conserve un cookie HTTP only pendant sept jours ; les sessions sont révoquées à la déconnexion. Les routes d'authentification sont limitées à 20 requêtes par 15 minutes et par adresse IP (limite en mémoire adaptée à une seule instance). En production, configurer `NODE_ENV=production`, `APP_ORIGIN` et HTTPS.

Pour intégrer l'API au site, servir le site et `/api` sous la même origine via un reverse proxy, puis ajouter les écrans de compte/profil. Le site statique seul ne fournit pas de proxy API. Le scoring simple et les réservations existent côté API ; l'interface, les filtres avancés et la messagerie restent à construire. Le Jalon 2 propose OAuth/JWT ; ce premier socle utilise des sessions opaques côté serveur afin de permettre une déconnexion révocable, et ne prétend pas livrer OAuth.

## Parcours Figma et réservation Stripe test

Le [wireframe PlateMate](https://www.figma.com/design/qtiIzlBfRLB3xK20yCRfuj/PlateMate?node-id=174-10) montre Explorer, la fiche hôte avec menu, dates disponibles, nombre d'invités, tarif du menu, frais de service et le bouton « Réserver ce repas ». Il affiche « Aucun prélèvement avant confirmation de l'hôte ». Le backend suit cette séquence :

1. L'hôte connecté crée une expérience (`POST /api/experiences`), ajoute des éléments de menu (`POST /api/experiences/:id/menu`) et des dates (`POST /api/experiences/:id/dates`).
2. Tout visiteur consulte `GET /api/experiences?city=&cuisine=` et `GET /api/experiences/:id` (avec places restantes). Un invité connecté envoie `{ "dateId": "uuid", "guests": 1 }` à `POST /api/bookings`. Le prix est figé et calculé côté serveur en centimes : tarif du menu + 4 € de frais par invité.
3. L'hôte consulte `GET /api/bookings`, puis accepte `POST /api/bookings/:id/accept` ou refuse `POST /api/bookings/:id/decline`. La confirmation contrôle la capacité de la date sous verrou PostgreSQL. Aucune session Stripe n'existe avant acceptation.
4. L'invité accepté appelle `POST /api/bookings/:id/checkout` et suit l'URL Stripe Checkout. Seules les clés `sk_test_` sont acceptées. Le webhook signé `POST /api/stripe/webhook` passe la réservation à `paid` uniquement si Stripe confirme le paiement, l'identifiant de session et le total attendu. Une session expirée ou un paiement asynchrone échoué rend une nouvelle tentative possible.

Pour essayer le paiement, ajouter `STRIPE_SECRET_KEY=sk_test_...` à `backend/.env`, puis lancer `stripe listen --forward-to localhost:3000/api/stripe/webhook` et copier le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`. Redémarrer l'API. Utiliser une carte de test Stripe sur Checkout. Les URL de retour `/reservations/:id` sont prévues pour l'application à construire ; le retour navigateur n'est jamais une preuve de paiement. La configuration Stripe, les clés et les comptes de test ne sont pas présents dans le dépôt.

**Limites actuelles :** le paiement est en mode test sur le compte plateforme. Stripe Connect, les reversements aux hôtes, OAuth, la messagerie, les avis, les badges vérifiés, la publication/modération et l'interface de réservation ne sont pas livrés. Les écrans Figma mettent encore fortement l'accent sur un catalogue de repas, alors que le Jalon 2 repositionne le matching social au centre ; ce point nécessite un arbitrage produit avant d'implémenter le front principal. Les contraintes alimentaires déclarées ne prouvent jamais l'absence d'allergènes dans un repas.
