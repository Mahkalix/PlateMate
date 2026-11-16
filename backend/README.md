# Backend PlateMate (MVP connecté)

Le frontend actuel utilise **backend/mvp**, une API Express/TypeScript avec Auth0 et PostgreSQL 17. L'API écoute sur **3001**. Les fichiers directement dans backend correspondent à l'ancien backend : ses instructions restent dans [README.legacy.md](README.legacy.md). Ne pas mélanger les deux configurations Compose.

## Configuration initiale

Toutes les commandes suivantes se lancent depuis **la racine du dépôt**. Docker Desktop doit être démarré en mode conteneurs Linux.

~~~powershell
if (!(Test-Path backend/mvp/.env)) {
    Copy-Item backend/mvp/.env.example backend/mvp/.env
}
~~~

Compléter backend/mvp/.env sans le committer :

| Variable | Valeur attendue |
| --- | --- |
| AUTH0_ISSUER_BASE_URL | URL HTTPS du tenant Auth0, terminée par / |
| AUTH0_CLIENT_ID | Client ID de l'application PlateMate Regular Web Application |
| AUTH0_CLIENT_SECRET | Secret de cette même application, jamais celui de l'application de test M2M |
| AUTH0_CALLBACK_URL | http://localhost:3001/auth/callback pour la configuration locale actuelle |
| AUTH0_CONNECTION | Username-Password-Authentication |
| APP_ORIGIN | http://localhost:8080 |
| JWT_SECRET | Secret aléatoire d'au moins 32 octets |
| MVP_DB_PASSWORD | Mot de passe PostgreSQL aléatoire en hexadécimal |

L'exemple .env propose aussi un callback via le proxy sur 8080. Choisir une URL et l'enregistrer **exactement** dans Allowed Callback URLs de la même application Auth0. Ne pas changer un callback déjà fonctionnel sans mettre Auth0 à jour.

Pour générer un secret de 32 octets avec Node installé (exécuter deux fois pour obtenir deux secrets distincts) :

~~~powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
~~~

Compose construit DATABASE_URL avec le mot de passe et le service db. La valeur DATABASE_URL de l'exemple est destinée à une exécution Node hors Docker. Les variables Stripe sont facultatives pour démarrer ; utiliser uniquement des clés de test pour les essais de paiement.

## Démarrer front, API et base

~~~powershell
docker compose --env-file backend/mvp/.env -f compose.integration.yaml config --quiet
docker compose --env-file backend/mvp/.env -f compose.integration.yaml up --build -d --wait
docker compose --env-file backend/mvp/.env -f compose.integration.yaml ps
Invoke-RestMethod http://localhost:3001/health
~~~

Frontend : http://localhost:8080. API : http://localhost:3001. PostgreSQL n'expose pas de port sur le PC dans cette configuration.

Le [Dockerfile MVP](mvp/Dockerfile) applique les migrations avant de démarrer l'API. La base utilise un volume persistant. Le [Compose MVP](mvp/compose.yaml) attend que PostgreSQL soit prêt.

### Reconstruire uniquement le backend

~~~powershell
docker compose --env-file backend/mvp/.env -f compose.integration.yaml up --build -d --wait api
~~~

### Logs et arrêt sans perdre les données

~~~powershell
docker compose --env-file backend/mvp/.env -f compose.integration.yaml logs --tail=100 -f api db
docker compose --env-file backend/mvp/.env -f compose.integration.yaml down
~~~

Ctrl+C quitte les logs. Ne pas ajouter --volumes : cela supprimerait les données locales. Modifier MVP_DB_PASSWORD ne change pas le mot de passe d'une base déjà initialisée ; conserver la valeur utilisée lors de sa création.

## Tests backend

Node.js 24 et npm sur le PC, Docker pour une **base de test isolée**. Le Dockerfile applicatif n'inclut pas Vitest ni les dépendances de développement ; ne pas lancer npm test dans le conteneur api.

depuis la racine du dépôt :

~~~powershell
docker compose -f compose.test.yaml up -d --wait
npm ci --prefix backend/mvp
npm run typecheck --prefix backend/mvp
npm run lint --prefix backend/mvp
npm test --prefix backend/mvp
npm run test:coverage --prefix backend/mvp
docker compose -f compose.test.yaml down
~~~

La configuration Vitest utilise par défaut postgres://platemate:platemate@localhost:5433/platemate_test. TEST_DATABASE_URL peut la remplacer, mais doit toujours désigner une base jetable : les tests réinitialisent son schéma. La base de test est temporaire et indépendante des données de l'application.

Suites ciblées : npm run test:unit --prefix backend/mvp, npm run test:integration --prefix backend/mvp et npm run test:security --prefix backend/mvp. Démarrer la base de test avant ces commandes également.

## Vérification réelle

Les tests automatisés ne remplacent pas une connexion Auth0 réelle. Suivre le [parcours à deux comptes](../docs/connected-local.md#parcours-reel-a-verifier-avec-deux-comptes) : profil, publication hôte, réservation invitée, acceptation, confidentialité et déconnexion.

## Dépannage

- Variable requise manquante : compléter backend/mvp/.env et conserver --env-file dans la commande.
- Docker inaccessible : vérifier que Docker Desktop fonctionne et que le terminal peut exécuter docker info.
- API unhealthy : consulter les logs api et db (migrations, connexion PostgreSQL ou configuration Auth0).
- Callback refusé : comparer AUTH0_CALLBACK_URL avec les Allowed Callback URLs de l'application Auth0 utilisée.
- Port occupé : libérer 8080 ou 3001 ; les tests PostgreSQL utilisent 5433.

Les commandes opérateur appartiennent à ce README. Les Dockerfile définissent la construction et le processus de démarrage ; Compose gère services, ports, variables et volumes.
