# PlateMate Backend

API Node.js 22, Express 5 et PostgreSQL 17. Le [catalogue fonctionnel](FONCTIONNALITES.md) décrit les parcours existants et prévus. Cette version est réservée aux essais : elle refuse les clés Stripe `sk_live_` et les webhooks `livemode=true`.

Pour lancer tout l'environnement en conteneurs (frontend, API, worker et base), exécuter `docker compose up --build -d --wait` depuis la racine du dépôt. L'API est sur `http://localhost:3000`, le frontend sur `http://localhost:8080`. Docker Compose migre la base avant l'API et utilise le mode local par défaut. Les variables `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `STRIPE_CONNECT_WEBHOOK_SECRET` peuvent être renseignées dans un `.env` à la racine, avec uniquement des clés Stripe de test. La CLI Stripe reste à lancer sur la machine hôte pour relayer les webhooks. `docker compose down` arrête les services sans effacer les volumes.

## Lancer en local

Depuis `backend/` :

```sh
npm ci
cp .env.example .env
docker compose up -d --wait db
npm run migrate
npm run dev
```

Dans un second terminal :

```sh
curl http://localhost:3000/api/ready
npm run demo
```

La démo crée deux comptes de test, un menu, une date, publie l'expérience, la filtre, demande deux places puis les fait accepter. Elle ne déclenche aucun paiement. `/api/health` vérifie HTTP ; `/api/ready` vérifie également PostgreSQL. Les données de démo restent en base. Arrêter avec `Ctrl+C`, puis `docker compose stop` si nécessaire.

`AUTH_MODE=local` utilise des sessions par cookie et des mots de passe locaux uniquement pour le développement. En production, `AUTH_MODE=auth0` est obligatoire et ces routes d'inscription, connexion et déconnexion renvoient 404. Le frontend gère la connexion et la déconnexion avec Auth0 Universal Login et transmet le jeton d'accès API dans `Authorization: Bearer ...`. Une session locale ne donne aucun accès au mode Auth0.

## Tester

```sh
npm test
# Intégration avec une base isolée sur le port 5433
cp .env.test.example .env.test
docker compose --profile test up -d --wait db-test
npm run test:integration
```

`npm test` lance les tests unitaires et les tests PostgreSQL quand `TEST_DATABASE_URL` est fourni (dans GitHub Actions, le service PostgreSQL est configuré). Le test Auth0 signe de vrais JWT avec une clé locale et vérifie l'audience et le sujet. La suite webhook vérifie la signature Stripe et la répétition d'événement sans accès externe. Pour contrôler les migrations répétées, le test d'intégration les exécute deux fois.

### Stripe en mode test

Activer le mode test dans Stripe, utiliser une clé secrète `sk_test_...` et des comptes Connect de test. Renseigner la clé dans `.env`. L'API et le worker refusent les clés live ; les webhooks refusent les événements live. Installer la [CLI Stripe](https://docs.stripe.com/stripe-cli) puis :

```sh
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe listen --forward-connect-to localhost:3000/api/stripe/connect-webhook
```

Lancer ces commandes dans deux terminaux, renseigner leurs secrets respectifs dans `STRIPE_WEBHOOK_SECRET` et `STRIPE_CONNECT_WEBHOOK_SECRET`, puis redémarrer le serveur. La deuxième route sert aux événements des comptes Connect. Les événements requis : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `refund.created`, `refund.updated`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, `payout.paid`, `payout.failed`.

```sh
npm run demo:stripe
```

Ouvrir l'URL Checkout imprimée et payer avec [la carte de test Stripe](https://docs.stripe.com/testing) `4242 4242 4242 4242`, une expiration future et un CVC à trois chiffres. Le script attend la confirmation du webhook et le revenu apparaît en attente dans le portefeuille test. Le frontend applicatif n'existe pas encore : le retour navigateur sur `/reservations/:id` affiche une page inexistante. Vérifier le statut dans le terminal ou via l'API ; cette URL de retour ne confirme jamais à elle seule le paiement.

## Configuration Auth0

1. API Auth0 créée avec l'audience `https://weareplatemate.com/api`, algorithme **RS256** et un tenant de développement HTTPS. Le frontend applicatif avec connexion n'existe pas encore : ses URL de retour, de déconnexion et son origine Auth0 seront fixées selon ses routes réelles. Configurer ensuite le frontend (Client ID `rwmckSUTScqswy4vZoSxp88Ru0aJ47Hk`) pour demander un jeton d'accès à cette audience ; autoriser alors l'application à accéder à l'API Auth0.
2. Définir `AUTH_MODE=auth0`, `AUTH0_ISSUER_BASE_URL=https://dev-s4cqy56nmufsd1nf.us.auth0.com/` et `AUTH0_AUDIENCE=https://weareplatemate.com/api` côté API. L'API vérifie la signature via le JWKS Auth0, l'émetteur, l'audience et l'expiration. L'identité durable est le `sub`. Les comptes ne sont jamais rapprochés par e-mail.
3. Si l'e-mail doit être transmis à Stripe, une Action Auth0 peut ajouter au **jeton d'accès** les claims `https://weareplatemate.com/email` et `https://weareplatemate.com/email_verified`. Le serveur n'utilise l'e-mail que si le second claim est `true`. Configurer la vérification d'e-mail, la récupération du mot de passe, MFA et les fournisseurs souhaités dans Auth0. Le secret client Auth0 ne va jamais au navigateur.

En mode Auth0, tester `GET /api/auth/me` avec `-H "Authorization: Bearer $TOKEN"`. La page de profil est `PUT /api/profile` (remplacement de tous les champs). `GET /api/profile` inclut les préférences privées ; la fiche expérience expose seulement nom, photo, bio, langues et centres d'intérêt de l'hôte.

## Périmètre fonctionnel

Le [catalogue des fonctionnalités](FONCTIONNALITES.md) détaille les parcours implémentés, les routes, les règles du prototype et ce qui reste à construire.

## Worker et déploiement

```sh
npm run worker       # un passage
npm run worker:dev   # toutes les minutes
```

Le worker libère les revenus 48 h après la date, ferme les demandes acceptées sans paiement après 24 h, et reprend les retraits en cours. Faire tourner **une instance** supervisée du worker en production. Les migrations utilisent un verrou PostgreSQL et une table de versions ; exécuter `node src/server.js --migrate` avant de démarrer l'API. Le [Dockerfile](Dockerfile) démarre l'API avec un utilisateur non privilégié. Monter un volume persistant sur `/data/media` ou définir `MEDIA_DIR` sur un stockage persistant partagé entre instances. Prévoir sauvegardes PostgreSQL, restauration testée, TLS, proxy HTTPS, secret manager, journalisation et alertes. `API_PUBLIC_URL` doit être l'URL HTTPS publique de l'API ; `APP_ORIGIN` celle du frontend autorisé par CORS.

Variables obligatoires pour déployer l'API dans un environnement de test HTTPS : `DATABASE_URL`, `NODE_ENV=production`, `AUTH_MODE=auth0`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_AUDIENCE`, `APP_ORIGIN` HTTPS, `API_PUBLIC_URL` HTTPS, `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `MEDIA_DIR`. Le mot `production` dans `NODE_ENV` durcit l'exécution Node, mais n'active pas Stripe live. Ne jamais committer `.env` ni transmettre une clé privée au frontend.

### Points à valider avant toute vente réelle

Le backend n'a **pas** été testé de bout en bout avec le tenant Auth0 ni avec un compte Stripe Connect de test du projet. Il faut d'abord vérifier ces parcours avec des données de test pendant la construction du frontend. Les taxes/factures applicables, les remboursements et litiges tardifs, les notifications, la conservation des données et la disponibilité de l'hébergement restent à traiter avant toute ouverture commerciale. La conciliation automatique des transferts Stripe après une interruption prolongée doit encore être éprouvée. Cette version interdit les paiements réels ; leur activation demandera un changement explicite du code et de nouveaux essais.
