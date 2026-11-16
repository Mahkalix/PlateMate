# Integration front et back du 16 novembre 2026

## Sauvegardes

- Frontend : `backup/frontend-2026-11-16-dc6e54a`, commit `dc6e54a41bce1d415eed3b0648956e95a2c16e20`.
- Backend : `backup/backend-2026-11-16-e334ca0`, commit `e334ca08da3d2512f440de5114c2a4a141b8e035`.
- Branche commune : `integration/front-back-2026-11-16`.

La fusion conserve les deux parents. Seul conflit : `docs/decisions.md`, resolu en conservant les deux documents et la priorite de la decision recente sur les allergies. Aucun merge dans `main`, aucune suppression des branches sources. Aucun secret dans le commit.

## Demarrer localement

Depuis la racine de cette branche, avec Docker Desktop demarre :

```sh
# Si aucune configuration locale n'existe encore :
cp backend/mvp/.env.example backend/mvp/.env
# Renseigner les valeurs locales Auth0 et les secrets dans ce fichier ignore par Git.
docker compose -f compose.integration.yaml config --quiet
docker compose -f compose.integration.yaml up --build -d --wait
```

Frontend : http://localhost:8080 ; API : http://localhost:3001/health ; connexion Auth0 : http://localhost:3001/auth/login.

Cette fusion rassemble les services et leur code. Elle ne raccorde pas automatiquement les formulaires React aux endpoints. Le bouton de connexion frontend et les donnees de compte restent en demonstration. Ne pas presenter le demarrage de deux services comme un parcours utilisateur connecte.

## Tests reproductibles

La base ci-dessous est reservee aux tests. Son contenu est temporaire et perdu a l'arret du conteneur. Ne pas utiliser une base utilisateur : la suite supprime puis recree le schema de test.

```sh
docker compose -f compose.test.yaml up -d --wait
npm ci --prefix frontend
npm run build --prefix frontend
npm run format:check --prefix frontend
npm run test:browser --prefix frontend
npm ci --prefix backend/mvp
npm run typecheck --prefix backend/mvp
npm run lint --prefix backend/mvp
npm run test:coverage --prefix backend/mvp
docker compose -f compose.test.yaml down
```

Chrome doit etre installe pour les tests navigateur. Les tests API utilisent un emetteur OIDC de test, pas le compte Auth0 reel. Le parcours Auth0 interactif reel necessite l'intervention du titulaire pour saisir ses identifiants. Stripe reste en mode test, sans paiement reel.

## Resultats de cette session locale

- Build TypeScript/Vite du frontend source exact : reussi.
- Formatage frontend : reussi.
- Integrite de fusion : arbre `frontend` identique a `dc6e54a`, dossier `backend/mvp` identique a `e334ca0`.
- `docker compose -f compose.test.yaml config --quiet` : reussi.
- Configuration de la pile applicative : bloquee par `AUTH0_ISSUER_BASE_URL` absent du fichier local. Aucun secret ni identifiant de tenant invente.
- Installation des dependances backend : `npm ci` tente, echec npm `Exit handler never called` dans cette session.
- Tests navigateur : tentative echouee avant les assertions. Le serveur Vite peut ecouter, mais les connexions de la session vers `127.0.0.1:4197` sont refusees avec `EACCES`.
- Docker : moteur initialement arrete. Apres tentative de lancement, acces au pipe `dockerDesktopLinuxEngine` refuse.
- Les suites PostgreSQL, les conteneurs et le parcours Auth0 local ne peuvent donc pas etre declares valides dans cette session. Les 123 tests reussis precedemment en CI concernent le backend `e334ca0` seul.

Il reste a executer les commandes ci-dessus depuis un terminal local autorise, puis a raccorder le frontend a l'API dans une etape d'integration fonctionnelle.
