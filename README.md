# PlateMate

PlateMate met les expériences culinaires au centre. Les visiteurs découvrent le menu et l'hôte (photo, présentation, langues, centres d'intérêt), puis filtrent par cuisine, thème, ambiance, ville, date, régime et nombre de places. Le questionnaire peut alimenter ces filtres ; il n'y a pas de score de compatibilité. Voir le [périmètre fonctionnel du backend](backend/FONCTIONNALITES.md).

## Démarrer avec Docker

Installer Docker avec le plugin Compose, puis lancer ces commandes **depuis la racine du dépôt** :

```sh
docker compose up --build -d --wait
```

Compose construit le frontend React et l'API, démarre PostgreSQL et le worker, puis applique les migrations avant de servir l'API. L'attente `--wait` vérifie les services dotés d'un healthcheck. Le premier build peut prendre plusieurs minutes.

| Adresse locale | Fonction |
|---|---|
| [localhost:8080](http://localhost:8080/) | Communauté WhatsApp (`/` et `/whatsapp/`) |
| [localhost:3000/api/ready](http://localhost:3000/api/ready) | API et connexion à PostgreSQL |
| `localhost:5432` | PostgreSQL, accessible uniquement depuis cette machine |

Le frontend public ne présente pas encore les écrans de réservation. Pour tester le parcours API après démarrage :

```sh
cd backend
npm ci
npm run demo
cd ..
```

Les comptes et réservations créés par la démo restent dans la base locale. Les commandes courantes, depuis la racine :

```sh
docker compose ps                      # état des services
docker compose logs -f api frontend    # logs en direct (Ctrl+C quitte les logs)
docker compose up --build -d --wait    # reconstruire après une modification
docker compose down                    # arrêter en conservant les données
docker compose down -v                 # réinitialiser aussi la base et les médias locaux
```

`down -v` efface les volumes Docker `pgdata` et `media` : l'utiliser uniquement pour repartir de zéro. En cas de port 3000, 5432 ou 8080 déjà utilisé, libérer ce port avant le démarrage.

Le mode par défaut est `AUTH_MODE=local`. Stripe reste limité aux clés de test ; sans clé, le paiement est indisponible. Pour tester Checkout et les webhooks, renseigner `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET` et `STRIPE_CONNECT_WEBHOOK_SECRET` dans un fichier `.env` **à la racine**, puis recréer les services API et worker avec `docker compose up --build -d --wait`. La CLI Stripe tourne sur la machine hôte. Voir le [guide backend](backend/README.md) pour la procédure de paiement test. Ne pas versionner `.env`.

## Frontend

Le frontend React, TypeScript et Vite sert la communauté WhatsApp sur `/` et `/whatsapp/`, puis l'équipe et les mentions légales. La page indique « Site en construction ». Vercel construit et publie `frontend/dist`.

```sh
cd frontend
npm ci
npm run start
```

Cette commande démarre le serveur de développement Vite sur `http://localhost:8080` et recharge les modifications React/SCSS. Si Docker tourne déjà, arrêter son frontend avec `docker compose stop frontend` depuis la racine pour libérer le port 8080. Docker sert le build compilé et ne recharge pas le code en direct. Voir le [guide frontend](frontend/README.md) pour les routes, le SCSS et le build statique. Les parcours Auth0, réservation et paiement ne sont pas encore reliés à l'interface.

## Backend sans Docker Compose complet

Le [guide backend](backend/README.md) contient les commandes d'installation, les tests PostgreSQL, le parcours Stripe test, Auth0 et les conditions de déploiement. Le [catalogue fonctionnel](backend/FONCTIONNALITES.md) sépare les fonctions codées des fonctions prévues.

```sh
docker compose up -d --wait db
cd backend
npm ci
cp .env.example .env
npm run migrate
npm run dev
# puis dans un autre terminal : npm run demo
```

Le backend est réservé aux essais avec Stripe en mode test. Le détail des fonctions et des limites est dans le [catalogue fonctionnel](backend/FONCTIONNALITES.md).
