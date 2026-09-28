# PlateMate

PlateMate met les expériences culinaires au centre. Les visiteurs découvrent le menu et l'hôte (photo, présentation, langues, centres d'intérêt), puis filtrent par cuisine, thème, ambiance, ville, date, régime et nombre de places. Le questionnaire peut alimenter ces filtres ; il n'y a pas de score de compatibilité. Voir le [cadrage produit](docs/product-direction.md).

## Démarrer tout l'environnement

Depuis la racine du dépôt, avec Docker Compose :

```sh
docker compose up --build -d --wait
```

Ouvrir [l'accueil](http://localhost:8080/) ou [la page WhatsApp](http://localhost:8080/whatsapp/). L'API répond sur [localhost:3000/api/ready](http://localhost:3000/api/ready). La base PostgreSQL, les migrations, l'API, le worker et le frontend démarrent ensemble. Pour arrêter : `docker compose down`. Les données PostgreSQL et les médias restent dans des volumes Docker. Ce démarrage utilise l'authentification locale et les paiements Stripe en mode test uniquement ; pour renseigner les clés de test, voir le [guide backend](backend/README.md).

## Accueil provisoire

La page communautaire est l'accueil provisoire sur `/`, avec la mention « Site en construction ». Elle reste également accessible sous [`/whatsapp/`](frontend/public/whatsapp/). Les fichiers publiés sont dans `frontend/public/`, le dossier servi par Vercel. Pour les voir localement :

```sh
cd frontend
npm run start
# http://localhost:8080/ et http://localhost:8080/whatsapp/
```

Les sources et commandes SCSS sont décrites dans le [guide frontend](frontend/README.md). Les feuilles compilées sont versionnées pour l'hébergement statique.

Le site statique n'est pas l'application de réservation. Le logo WhatsApp est issu de Simple Icons. Les licences des polices sont conservées avec leurs fichiers.

## Backend sans Docker Compose complet

Le [guide backend](backend/README.md) contient les commandes d'installation, les tests PostgreSQL, le parcours Stripe test, Auth0, les routes et les conditions de déploiement.

```sh
cd backend
npm ci
cp .env.example .env
docker compose up -d --wait db
npm run migrate
npm run dev
# puis dans un autre terminal : npm run demo
```

L'API gère les profils privés et fiches hôte publiques, les expériences et menus, la publication, les dates et capacités, les demandes acceptées par l'hôte, Stripe Checkout, les annulations/remboursements, la messagerie, les avis et les revenus des hôtes avec Stripe Connect. Cette version accepte uniquement Stripe en mode test. L'authentification Auth0 est imposée pour un déploiement HTTPS ; les comptes locaux servent à la démo de développement. Les confirmations de paiement viennent exclusivement des webhooks signés.

La [PR #1](https://github.com/Mahkalix/PlateMate/pull/1) livre un socle backend à tester pendant la construction du frontend. Les URL Auth0 dépendront des routes du futur frontend ; les parcours Stripe Connect doivent être essayés avec des comptes de test. Le site `/whatsapp/` conserve son chemin. Aucun paiement réel n'est activé.
