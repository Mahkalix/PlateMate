# PlateMate

PlateMate met les expériences culinaires au centre. Les visiteurs découvrent le menu et l'hôte (photo, présentation, langues, centres d'intérêt), puis filtrent par cuisine, thème, ambiance, ville, date, régime et nombre de places. Le questionnaire peut alimenter ces filtres ; il n'y a pas de score de compatibilité. Voir le [périmètre fonctionnel du backend](backend/FONCTIONNALITES.md).

## Démarrer tout l'environnement

Depuis la racine du dépôt, avec Docker Compose :

```sh
docker compose up --build -d --wait
```

Ouvrir [l'accueil](http://localhost:8080/) ou [la page WhatsApp](http://localhost:8080/whatsapp/). L'API répond sur [localhost:3000/api/ready](http://localhost:3000/api/ready). La base PostgreSQL, les migrations, l'API, le worker et le frontend démarrent ensemble. Pour arrêter : `docker compose down`. Les données PostgreSQL et les médias restent dans des volumes Docker. Ce démarrage utilise l'authentification locale et les paiements Stripe en mode test uniquement ; pour renseigner les clés de test, voir le [guide backend](backend/README.md).

## Frontend

Le frontend React, TypeScript et Vite sert la page de maintenance sur `/`, la communauté sur `/whatsapp/`, puis l'équipe et les mentions légales. Vercel construit et publie `frontend/dist`.

```sh
cd frontend
npm ci
npm run start
```

Voir le [guide frontend](frontend/README.md) pour les routes, le SCSS et le build statique. Les parcours Auth0, réservation et paiement ne sont pas encore reliés à l'interface.

## Backend sans Docker Compose complet

Le [guide backend](backend/README.md) contient les commandes d'installation, les tests PostgreSQL, le parcours Stripe test, Auth0 et les conditions de déploiement. Le [catalogue fonctionnel](backend/FONCTIONNALITES.md) sépare les fonctions codées des fonctions prévues.

```sh
cd backend
npm ci
cp .env.example .env
docker compose up -d --wait db
npm run migrate
npm run dev
# puis dans un autre terminal : npm run demo
```

Le backend est réservé aux essais avec Stripe en mode test. Le détail des fonctions et des limites est dans le [catalogue fonctionnel](backend/FONCTIONNALITES.md).
