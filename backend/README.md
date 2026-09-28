# PlateMate : lancer et tester le backend

Le backend est une API Node.js/Express reliée à PostgreSQL. Il fournit les comptes, profils, expériences culinaires, filtres, menus, disponibilités, réservations et Stripe Checkout en mode test.

L'ancienne page WhatsApp est conservée sous `/whatsapp/`. L'API n'a pas encore d'interface graphique : ouvrir `/` sur son port ne montre pas l'application. Les commandes de ce guide fonctionnent dans un terminal macOS, Linux ou WSL. Sur Windows, Git Bash convient aux commandes `cp` et `curl`.

## 1. Prérequis

- Git.
- Node.js 22 ou 24 et npm.
- Docker avec Docker Compose et le moteur Docker démarré (Docker Desktop sur macOS/Windows).
- Un compte et la CLI Stripe uniquement pour le test de paiement externe.

Vérification :

```sh
node --version
npm --version
docker compose version
```

## 2. Récupérer la branche de travail

Les changements sont dans la [PR #1](https://github.com/Mahkalix/PlateMate/pull/1), branche `feat/backend-foundations`.

Si le dépôt n'est pas encore sur ton ordinateur :

```sh
git clone --branch feat/backend-foundations https://github.com/Mahkalix/PlateMate.git
cd PlateMate/backend
```

Si le dépôt existe déjà, depuis sa racine (conserver/committer tes modifications locales avant de changer de branche) :

```sh
git fetch origin
git switch feat/backend-foundations
git pull --ff-only
cd backend
```

Toutes les commandes suivantes sont à lancer depuis `backend/`, sauf indication contraire.

## 3. Installer et configurer

```sh
npm ci
cp .env.example .env
```

Si tu as déjà un `.env`, conserve-le et complète-le. Configuration locale minimale :

```dotenv
DATABASE_URL=postgres://platemate:platemate@localhost:5432/platemate
PORT=3000
NODE_ENV=development
APP_ORIGIN=http://localhost:3000
```

Les identifiants PostgreSQL ci-dessus concernent uniquement la base locale créée par Compose. Les `.env` et `.env.test` sont ignorés par Git. Les exemples ne contiennent aucune clé privée.

## 4. Lancer PostgreSQL et créer les tables

```sh
docker compose up -d --wait db
npm run migrate
```

`migrate` lit `.env` et applique les migrations `001` à `005`. La commande peut être relancée après une mise à jour. Les migrations créent ou complètent les tables sans effacer les données existantes.

Pour vérifier la base :

```sh
docker compose ps
docker compose exec db psql -U platemate -d platemate -c '\dt'
```

## 5. Démarrer l'API

Dans un premier terminal :

```sh
npm run dev
```

Cette commande charge `.env` et redémarre le serveur lors des changements de code. Résultat attendu : `PlateMate API :3000`.

Dans un deuxième terminal :

```sh
curl http://localhost:3000/api/health
```

Résultat attendu : `{"status":"ok"}`. Ce contrôle vérifie le serveur HTTP ; le parcours de démonstration ci-dessous vérifie aussi l'accès à la base.

`npm start` est destiné à un environnement où les variables sont déjà fournies par l'hébergeur. Il ne charge pas `.env` automatiquement.

## 6. Tester un parcours complet sans Stripe

Laisse l'API démarrée. Dans le deuxième terminal :

```sh
npm run demo
```

Le script utilise l'API pour :

1. Créer deux comptes temporaires distincts, hôte et invité, avec des mots de passe aléatoires.
2. Enregistrer leurs profils privés.
3. Créer une expérience marocaine, végan, thème Découverte, ambiance Calme.
4. Ajouter un plat et une date dans sept jours, capacité de quatre personnes.
5. Rechercher les expériences avec des filtres.
6. Créer une demande pour deux personnes et la faire accepter par l'hôte.
7. Vérifier le total de 64 € (2 × 28 € de menu + 2 × 4 € de frais) et les deux places restantes.

Le terminal affiche les identifiants utiles et le résultat. Aucun paiement n'est lancé avec cette commande. Les comptes et les réservations de démonstration restent dans la base ; le script ne supprime rien et n'affiche pas leurs secrets. Chaque exécution crée de nouveaux comptes. La limite de connexion/inscription reste active (20 requêtes par 15 minutes).

Si le serveur écoute sur un autre port :

```sh
API_BASE_URL=http://localhost:3001 npm run demo
```

Adapter aussi `PORT` et `APP_ORIGIN` dans `.env`, puis redémarrer l'API.

## 7. Tests automatisés

### Tests sans base

```sh
npm test
```

Sans `TEST_DATABASE_URL`, le test PostgreSQL est marqué `SKIP`. Les autres tests vérifient notamment les entrées, les photos HTTPS, les filtres, le prix, le refus du checkout avant acceptation et la signature du webhook. Ils n'appellent pas Stripe.

### Test avec une vraie base PostgreSQL dédiée

```sh
docker compose --profile test up -d --wait db-test
cp .env.test.example .env.test
npm run test:integration
```

La base de test utilise le port **5433**, distinct de la base de développement sur **5432**. Le test applique les migrations, démarre sa propre API sur un port temporaire et vérifie :

- création des comptes et des profils ;
- création d'une expérience et de sa date ;
- combinaison des filtres et exclusion des résultats incompatibles ;
- informations de l'hôte sans préférences privées ni score ;
- réservation, acceptation, capacité restante et refus d'une confirmation sans places ;
- exécution du script `demo` lui-même.

Le test ajoute des données à la base de test. Il ne nécessite pas que `npm run dev` tourne. Les appels externes Stripe sont désactivés dans ce test.

La même suite est configurée dans [GitHub Actions](../.github/workflows/backend.yml) avec un service PostgreSQL.

## 8. Tester Stripe Checkout et le webhook

Ce parcours nécessite tes identifiants **Stripe test**. Aucun identifiant n'est inclus dans le dépôt.

### A. Configurer Stripe

1. Dans le Dashboard Stripe, utiliser un environnement de test et récupérer sa clé secrète `sk_test_...`.
2. Installer la [CLI Stripe](https://docs.stripe.com/stripe-cli) et l'authentifier avec le même environnement Stripe.
3. Dans un terminal dédié, lancer :

```sh
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Laisse cette commande ouverte. Elle affiche un secret de signature `whsec_...`. Complète ton `.env` :

```dotenv
STRIPE_SECRET_KEY=sk_test_TA_CLE_DE_TEST
STRIPE_WEBHOOK_SECRET=whsec_LE_SECRET_AFFICHE_PAR_STRIPE_LISTEN
```

Ces valeurs sont des exemples à remplacer. Redémarre `npm run dev` après modification de `.env`. Une clé de paiement réel est refusée par l'application.

### B. Effectuer le paiement test

Dans un troisième terminal :

```sh
npm run demo:stripe
```

Le script refait le parcours hôte/invité, accepte la réservation puis affiche un lien Stripe Checkout. Ouvre ce lien et utilise une carte de test :

- numéro : `4242 4242 4242 4242` ;
- expiration : une date future ;
- CVC : trois chiffres.

Les détails des cartes et cas de refus sont dans la [documentation de test Stripe](https://docs.stripe.com/testing). Utilise uniquement des valeurs de test.

Le script attend jusqu'à dix minutes que le statut devienne `paid`. Le terminal Stripe CLI doit montrer le webhook reçu avec un statut HTTP `200`. Le succès affiché par le script prouve que l'API a traité la confirmation Stripe pour cette réservation.

Après le paiement, Stripe redirige vers `/reservations/:id?checkout=success`. Cet écran frontend n'existe pas encore : une page introuvable à cette adresse n'annule pas le paiement test. Lis le résultat du script et le Dashboard Stripe. Le paramètre `checkout=success` n'est jamais utilisé comme preuve de paiement.

Pour tester un refus, utiliser une carte de refus indiquée dans la documentation Stripe ; la réservation ne doit pas devenir `paid`. Tu peux ensuite essayer une carte valide dans le même Checkout. Un événement artificiel créé avec `stripe trigger` ne remplace pas le paiement d'une réservation existante : l'API vérifie aussi l'identifiant et le montant de la session.

## 9. Appels API utiles

### Recherche publique

```sh
curl --get http://localhost:3000/api/experiences \
  --data-urlencode 'city=Grenoble' \
  --data-urlencode 'diet=vegan' \
  --data-urlencode 'theme=Découverte' \
  --data-urlencode 'guests=2'
```

Filtres disponibles : `city`, `cuisine`, `theme`, `atmosphere`, `language`, `diet`, `date` (`YYYY-MM-DD` en Europe/Paris), `guests`. Tri : `sort=date`, `price_asc` ou `price_desc`. Pagination : `limit` et `offset`. Omettre les filtres vides. Plusieurs régimes, par exemple `diet=vegan,sans-gluten`, doivent tous être déclarés pour le repas. `/api/discover` est un alias de cette recherche.

### Compte et session avec curl

Pour un compte manuel, employer une adresse différente à chaque inscription. Exemple avec un mot de passe de démonstration (à remplacer pour un vrai compte) :

```sh
curl -i -c /tmp/platemate-demo.cookies http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"mon-test@example.com","password":"demo-local-change-me"}'

curl -b /tmp/platemate-demo.cookies http://localhost:3000/api/auth/me

curl -X PUT -b /tmp/platemate-demo.cookies http://localhost:3000/api/profile \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Maxence","city":"Grenoble","languages":["Français"],"dietaryPreferences":["vegan"]}'

curl -b /tmp/platemate-demo.cookies http://localhost:3000/api/profile

curl -i -X POST -b /tmp/platemate-demo.cookies http://localhost:3000/api/auth/logout
```

Le fichier de cookies permet de réutiliser la session dans curl. Ne le partager pas. Pour se reconnecter, appeler `POST /api/auth/login` avec le même JSON et l'option `-c`. `PUT /api/profile` remplace le profil complet : renvoyer tous les champs à conserver, les champs optionnels omis reprenant leur valeur par défaut.

### Endpoints métier

| Méthode et chemin | Accès | Utilité |
| --- | --- | --- |
| `GET /api/experiences` | Public | Expériences filtrées disposant de places |
| `GET /api/experiences/:id` | Public | Hôte, menu et dates |
| `POST /api/experiences` | Connecté avec profil | Créer une expérience (titre, ville, cuisine, `menuPriceCents`, thème, ambiance, `dietaryOptions`, `photoUrl`) |
| `POST /api/experiences/:id/menu` | Hôte propriétaire | Ajouter `{ title, description, position }` |
| `POST /api/experiences/:id/dates` | Hôte propriétaire | Ajouter `{ startsAt, capacity }` avec date ISO et fuseau |
| `POST /api/bookings` | Invité connecté | Demander `{ dateId, guests }` |
| `GET /api/bookings` | Connecté | Ses réservations comme invité ou hôte |
| `POST /api/bookings/:id/accept` | Hôte propriétaire | Accepter si des places restent |
| `POST /api/bookings/:id/decline` | Hôte propriétaire | Refuser une demande encore en attente |
| `POST /api/bookings/:id/checkout` | Invité concerné | Créer le Checkout après acceptation |
| `POST /api/stripe/webhook` | Signature Stripe requise | Recevoir la confirmation de paiement |

## 10. Dépannage

| Symptôme | Action |
| --- | --- |
| `.env` introuvable ou `DATABASE_URL est requis` | Vérifier le dossier courant, créer `.env`, utiliser `npm run dev` |
| `ECONNREFUSED` vers PostgreSQL | Démarrer Docker puis `docker compose up -d --wait db` |
| Table/colonne inexistante | Exécuter `npm run migrate` après le pull |
| Port 5432 occupé | Changer le port publié dans Compose et celui de `DATABASE_URL` ensemble |
| Port 3000 occupé | Changer `PORT`, `APP_ORIGIN`, `API_BASE_URL` et la cible Stripe CLI ensemble |
| HTTP 401 | Se connecter et conserver le cookie de session |
| HTTP 403 origine refusée | Utiliser la même origine que `APP_ORIGIN`, y compris protocole et port |
| HTTP 409 | Lire l'erreur : compte existant, places insuffisantes ou transition de réservation interdite |
| HTTP 429 | La limite d'authentification est atteinte ; attendre la fin de la fenêtre de 15 minutes |
| Recherche vide | Vérifier les filtres, les régimes déclarés, une date future et les places disponibles |
| HTTP 503 Stripe test non configuré | Ajouter une clé `sk_test_...` à `.env`, puis redémarrer |
| Webhook 400 / réservation non payée | Vérifier le `whsec_` du terminal Stripe CLI actif, le compte Stripe utilisé et la cible locale |
| Test PostgreSQL marqué `SKIP` | Utiliser `npm run test:integration` avec `.env.test` et `db-test` démarré |

Pour arrêter l'API : `Ctrl+C`. Pour arrêter les bases en conservant les données de développement :

```sh
docker compose --profile test stop
```

## 11. Ce qui reste à construire

L'interface principale, OAuth, l'upload photo, les avis, la messagerie, le portefeuille et Stripe Connect ne sont pas encore livrés. Le portefeuille demandé (gains, historique, solde, retraits) est cadré dans [la direction produit](../docs/product-direction.md). Le paiement test actuel ne simule ni crédit de portefeuille, ni retrait, ni reversement bancaire réel.

Le prototype ne traite pas encore les annulations/remboursements et les réservations acceptées mais non payées peuvent continuer à retenir leurs places. Les règles de libération des places et des gains devront être implémentées avant une utilisation réelle. Le montant de service de 4 € par invité reste une hypothèse de prototype.
