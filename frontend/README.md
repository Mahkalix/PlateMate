# Frontend PlateMate

React, TypeScript, Vite et SCSS. Le frontend communique avec le backend MVP dans backend/mvp (voir [son README](../backend/README.md)).

## Démarrer avec Docker (recommandé)

Toutes les commandes Docker ci-dessous se lancent depuis la racine du dépôt, pas depuis frontend.

Prérequis : Docker Desktop démarré avec les conteneurs Linux et backend/mvp/.env configuré selon le README backend. Ne pas remplacer un fichier .env déjà renseigné.

~~~powershell
docker compose --env-file backend/mvp/.env -f compose.integration.yaml config --quiet
docker compose --env-file backend/mvp/.env -f compose.integration.yaml up --build -d --wait
~~~

Ouvrir http://localhost:8080. L'API est sur http://localhost:3001 et PostgreSQL reste dans le réseau Docker.

### Après une modification du front

~~~powershell
docker compose --env-file backend/mvp/.env -f compose.integration.yaml up --build -d --wait frontend
~~~

Le conteneur sert un build : il n'y a pas de rechargement automatique des sources. Actualiser le navigateur après reconstruction.

### État, logs et arrêt

~~~powershell
docker compose --env-file backend/mvp/.env -f compose.integration.yaml ps
docker compose --env-file backend/mvp/.env -f compose.integration.yaml logs --tail=100 -f frontend
docker compose --env-file backend/mvp/.env -f compose.integration.yaml down
~~~

Ctrl+C quitte les logs. La commande down conserve les données PostgreSQL. Ne pas ajouter --volumes pour un arrêt normal.

## Développement avec rechargement automatique

Node.js 22 ou 24 et npm requis sur le PC. depuis la racine du dépôt, arrêter le conteneur frontend pour libérer le port 8080, garder l'API et la base dans Docker, puis lancer Vite :

~~~powershell
docker compose --env-file backend/mvp/.env -f compose.integration.yaml stop frontend
docker compose --env-file backend/mvp/.env -f compose.integration.yaml up -d --wait api
npm ci --prefix frontend
npm start --prefix frontend
~~~

Vite transmet /api/* vers localhost:3001 en retirant /api et transmet /auth/* sans changer le chemin. Utiliser localhost dans le navigateur pour conserver une origine cohérente avec Auth0.

## Vérifications (depuis la racine du dépôt)

~~~powershell
npm ci --prefix frontend
npm run build --prefix frontend
npm test --prefix frontend
npm run format:check --prefix frontend
npm run test:browser --prefix frontend
~~~

- build vérifie TypeScript et génère dist.
- test vérifie le client API, les sessions et le proxy.
- test:browser nécessite Chrome et un build préalable. CHROME_PATH permet de préciser le chemin de Chrome. Le script utilise les ports 4197 et 4198 et une API simulée. Il ne valide pas Auth0 ni PostgreSQL réels.
- Pour une preview du build hors Docker : npm run preview --prefix frontend (port 8080 libre, API démarrée).

## Parcours connecté

Connexion via Auth0 → Mon compte → Mon profil → Explorer → demande de réservation → Mes repas. Le menu Mon compte contient la déconnexion. Les pages du compte proposent Profil et Mes repas, dans un espace invité ou hôte.

Les jetons restent en mémoire ; le renouvellement utilise un cookie HttpOnly. Aucun secret Auth0 ne doit être ajouté au frontend.

Le serveur Docker transmet les requêtes à http://api:3001 via API_UPSTREAM. Publier dist seul sans ces proxies ne suffit pas. Les anciennes pages de démonstration non routées ont été retirées. Les pages connectées restent à valider visuellement contre Figma.

## Dockerfile et dépannage

Le [Dockerfile](Dockerfile) installe les dépendances, compile le front, puis lance node server.mjs. Les commandes docker compose s'exécutent dans le terminal, pas dans le Dockerfile.

- Ancien rendu : reconstruire frontend puis actualiser le navigateur.
- Port 8080 occupé : arrêter Vite ou le conteneur frontend avant de lancer l'autre.
- Erreur API : consulter aussi les logs api et son état dans Compose.
- Variable Auth0 manquante : corriger backend/mvp/.env, puis relancer Compose avec --env-file.

Voir le [guide du parcours réel à deux comptes](../docs/connected-local.md#parcours-reel-a-verifier-avec-deux-comptes).
