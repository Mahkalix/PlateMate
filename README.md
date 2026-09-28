# PlateMate

La page de liens WhatsApp, disponible sous `/whatsapp/`, sert à organiser des repas à Grenoble : un header simple, une photo, une courte présentation et un seul groupe WhatsApp. HTML, CSS et JavaScript, sans backend ni compilation.

## Aperçu local

Ouvrir `whatsapp/index.html`, ou lancer `python3 -m http.server 8080` puis consulter http://localhost:8080/whatsapp/. Sur Vercel, `/` redirige temporairement vers `/whatsapp/` jusqu'à la livraison de l'application principale.

## Groupe WhatsApp

Un seul groupe réunit hôtes et invités. Le lien d’invitation est directement dans `whatsapp/index.html`, sur le bouton « Rejoindre le groupe WhatsApp ». Il fonctionne sans JavaScript.

Le logo WhatsApp est conservé dans `whatsapp/assets/whatsapp.svg` (source : Simple Icons, https://github.com/simple-icons/simple-icons).

## Identité visuelle

Logo exporté du hero Figma `232:540`, photo fournie par le porteur du projet. Jaune `#F5D000`, bordeaux `#803037`. BBB ReadMe Black Italic hébergée dans `whatsapp/assets/fonts`, issue de https://gitlab.com/bye-bye-binary/bbb-readme (notice conservée). DM Sans via Google Fonts.

Le site peut être publié sur un hébergement statique. Aucun service Azure ou Azurite n’est utilisé.

## Backend (premier socle)

Pour lancer l'API et tester les parcours : **[guide backend complet](backend/README.md)** (installation, PostgreSQL, démonstration, tests et Stripe test).

Le backend dans `backend/` couvre les comptes, profils, expériences, filtres, réservations et le paiement test. Il n'est pas encore relié aux pages publiques. La direction confirmée le 28 septembre 2026 met l'expérience culinaire au centre, accompagnée d'informations sur l'hôte. Le « matchmaking » correspond à des filtres, sans score de compatibilité. Voir [le cadrage produit](docs/product-direction.md), qui remplace l'interprétation précédente du Jalon 2.

Prérequis : Node.js 20+ et Docker Compose (ou une instance PostgreSQL existante). Dans `backend/` :

```sh
cp .env.example .env
docker compose up -d db
npm ci
node --env-file=.env src/server.js --migrate
node --env-file=.env src/server.js
npm test
```

API sur `http://localhost:3000` : `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/profile`, `PUT /api/profile`. Les deux routes POST de compte attendent `{ "email": "...", "password": "..." }` (12 caractères minimum). Le profil attend `displayName`, `city`, et accepte `bio`, `photoUrl` (HTTPS ou null), `interests`, `languages`, `dietaryPreferences`, `allergies`, `preferredCuisines`, `experienceGoals`, `preferredAtmospheres`, `meetingContext`. Les appels de profil nécessitent une session. Les préférences culinaires et allergies restent privées. Publier une expérience expose seulement la photo, le nom public, la présentation, les langues et les centres d'intérêt de son hôte. Le champ historique `discoverable` n'est plus utilisé ni accepté par l'API ; aucune migration ne supprime les données de profil existantes.

Le navigateur conserve un cookie HTTP only pendant sept jours ; les sessions sont révoquées à la déconnexion. Les routes d'authentification sont limitées à 20 requêtes par 15 minutes et par adresse IP (limite en mémoire adaptée à une seule instance). En production, configurer `NODE_ENV=production`, `APP_ORIGIN` et HTTPS.

Pour intégrer l'API au site, servir le site et `/api` sous la même origine via un reverse proxy, puis ajouter les écrans de compte/profil. Le site statique seul ne fournit pas de proxy API. Le Jalon 2 propose OAuth/JWT ; ce socle utilise des sessions opaques côté serveur afin de permettre une déconnexion révocable, et ne prétend pas livrer OAuth.

## Explorer : des filtres sur les expériences

`GET /api/experiences` est public. `/api/discover` est un alias et renvoie désormais `experiences`, plus une liste de profils notés. Les deux endpoints partagent les paramètres suivants :

| Paramètre | Exemple | Effet |
| --- | --- | --- |
| `city`, `cuisine` | `Grenoble`, `Marocaine` | Correspondance exacte sans distinction de casse |
| `theme`, `atmosphere` | `Découverte`, `Calme` | Thème et ambiance déclarés par l'hôte |
| `language` | `Français` | Langue déclarée par l'hôte |
| `diet` | `vegan,sans-gluten` | Tous les régimes demandés doivent figurer dans les options de l'expérience |
| `date` | `2030-12-01` | Date du repas dans le fuseau Europe/Paris |
| `guests` | `2` | Date disposant d'au moins 2 places (1 par défaut, maximum 10) |
| `sort` | `date`, `price_asc`, `price_desc` | Prochaine date ou prix total par invité, frais inclus |
| `limit`, `offset` | `20`, `0` | Pagination avec `hasMore` (maximum 50 résultats par page) |

Omettre les filtres vides. Les filtres sont combinés par un ET, validés et appliqués avant pagination. Les expériences sans date future disponible sont exclues. Les régimes utilisent des identifiants cohérents entre le questionnaire et l'hôte (par exemple `vegan`, `vegetarien`, `sans-gluten`, `sans-lactose`, `halal`, `casher`). Aucune équivalence entre régimes n'est supposée. La réponse contient les informations publiques de l'hôte, les options alimentaires du repas et la prochaine date disponible ; aucun score, email ou préférence privée de l'hôte.

Le questionnaire peut renseigner les filtres du formulaire. Il ne publie pas les réponses privées. Les allergies doivent faire l'objet d'un échange avec l'hôte : une option de régime déclarée ne constitue pas une garantie d'absence d'allergènes.

## Parcours Figma et réservation Stripe test

Le [wireframe PlateMate](https://www.figma.com/design/qtiIzlBfRLB3xK20yCRfuj/PlateMate?node-id=174-10) montre Explorer, la fiche hôte avec menu, dates disponibles, nombre d'invités, tarif du menu, frais de service et le bouton « Réserver ce repas ». Il affiche « Aucun prélèvement avant confirmation de l'hôte ». Le backend suit cette séquence :

1. L'hôte connecté crée une expérience (`POST /api/experiences`), ajoute des éléments de menu (`POST /api/experiences/:id/menu`) et des dates (`POST /api/experiences/:id/dates`).
2. Tout visiteur consulte `GET /api/experiences?city=Grenoble&diet=vegan` et `GET /api/experiences/:id` (avec places restantes). Un invité connecté envoie `{ "dateId": "uuid", "guests": 1 }` à `POST /api/bookings`. Le prix est figé et calculé côté serveur en centimes : tarif du menu + 4 € de frais par invité (hypothèse de prototype issue du ticket Figma, tarification finale à valider).
3. L'hôte consulte `GET /api/bookings`, puis accepte `POST /api/bookings/:id/accept` ou refuse `POST /api/bookings/:id/decline`. La confirmation contrôle la capacité de la date sous verrou PostgreSQL. Aucune session Stripe n'existe avant acceptation.
4. L'invité accepté appelle `POST /api/bookings/:id/checkout` et suit l'URL Stripe Checkout. Seules les clés `sk_test_` sont acceptées. Le webhook signé `POST /api/stripe/webhook` passe la réservation à `paid` uniquement si Stripe confirme le paiement, l'identifiant de session et le total attendu. Une session expirée ou un paiement asynchrone échoué rend une nouvelle tentative possible.

Pour essayer le paiement, ajouter `STRIPE_SECRET_KEY=sk_test_...` à `backend/.env`, puis lancer `stripe listen --forward-to localhost:3000/api/stripe/webhook` et copier le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`. Redémarrer l'API. Utiliser une carte de test Stripe sur Checkout. Les URL de retour `/reservations/:id` sont prévues pour l'application à construire ; le retour navigateur n'est jamais une preuve de paiement. La configuration Stripe, les clés et les comptes de test ne sont pas présents dans le dépôt.

**Limites actuelles :** le paiement est en mode test sur le compte plateforme. Stripe Connect, le portefeuille, les reversements aux hôtes, OAuth, la messagerie, les avis, les badges vérifiés, la modération, l'upload des photos et l'interface de réservation ne sont pas livrés. Le contrat API accepte déjà des URL HTTPS de photos. Les règles du portefeuille sont décrites dans [le cadrage produit](docs/product-direction.md) et son implémentation reste un lot distinct.
