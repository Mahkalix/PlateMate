# Frontend connecte a l'API

Branche `integration/front-back`, dossier `integration-local`. Les sauvegardes
initiales front/back sont conservees. Aucun changement dans `main`.

## Fonctionnalites raccordees

- Auth0 Universal Login et inscription, renouvellement de session et deconnexion.
  Cookie HttpOnly gere par le backend ; token d'acces en memoire, jamais dans
  localStorage/sessionStorage. Renouvellement mutualise pour les appels concurrents.
- Profil lu et sauvegarde, statistiques de compte, activation hote et table.
- Explorer, details, disponibilites et demandes de reservation.
- Repas invites/hotes, etats vides reels, pagination, publication d'un repas,
  acceptation/refus/annulation/cloture, avis apres repas termine.
- Consentement alimentaire prive et accord distinct par reservation pour partager
  des allergies. Adresse affichee uniquement lorsque l'API l'autorise.
- Paiement avec un portefeuille deja credite. Recharge Stripe et onboarding
  bancaire ne disposent pas encore de formulaire connecte dans ce frontend.

Les anciennes pages de demonstration restent dans les sources comme reference.
Les routes du compte utilisent des formulaires connectes avec les styles du
projet et les champs du contrat API. Leur conformite pixel par pixel aux maquettes
precedentes n'est pas validee. Les pages publiques restent editoriales.

## Lancement

Depuis **integration-local**, configurer `backend/mvp/.env` (ignore par Git).
Copier `.env.example` seulement si aucun fichier local n'existe. Renseigner le
tenant Auth0, le client Regular Web Application, son secret, JWT_SECRET et le
mot de passe PostgreSQL. Connexion Database Auth0 et email verifie requis.

```dotenv
APP_ORIGIN=http://localhost:8080
AUTH0_CALLBACK_URL=http://localhost:8080/auth/callback
```

Enregistrer exactement ce callback dans les Allowed Callback URLs Auth0.
Utiliser `localhost` partout pendant le parcours. En production, utiliser HTTPS.

```powershell
docker compose -f compose.integration.yaml config --quiet
docker compose -f compose.integration.yaml up --build -d --wait
```

Ouvrir http://localhost:8080. L'API migre sa base au demarrage. Le serveur front
transmet `/auth/*` sans modifier le chemin des cookies et `/api/*` a `http://api:3001`
en retirant `/api`. Pas de CORS necessaire. `/api/health` verifie PostgreSQL.

Sans conteneur frontend : API sur 3001, puis `npm ci --prefix frontend` et
`npm start --prefix frontend`. Pour le build : `npm run build --prefix frontend`
puis `npm run preview --prefix frontend`. Ce serveur utilise `API_UPSTREAM`
(par defaut `http://127.0.0.1:3001`). Un hebergement purement statique doit fournir
les memes reverse proxies ; publier seulement `dist` ne suffit pas.

## Tests

```powershell
npm test --prefix frontend
npm run build --prefix frontend
npm run format:check --prefix frontend
npm run test:browser --prefix frontend
```

Le test navigateur utilise une API fictive en memoire sur 4198 et le vrai serveur
frontend/proxy sur 4197. Il couvre connexion simulee, cookie de refresh, profil
apres rechargement, exploration, reservation, annulation, absence de consentement
par defaut, erreurs serveur, deconnexion et largeur mobile. Il ne prouve pas le
fonctionnement d'Auth0/PostgreSQL. Chrome et Node 22 requis (`CHROME_PATH` facultatif).
`test-ready.cjs` est l'ancien controle de maquette, pas celui des routes connectees.

Backend (base exclusivement reservee aux tests, son schema est efface par la suite) :

```powershell
docker compose -f compose.test.yaml up -d --wait
npm ci --prefix backend/mvp
npm run typecheck --prefix backend/mvp
npm run lint --prefix backend/mvp
npm run test:coverage --prefix backend/mvp
docker compose -f compose.test.yaml down
```

## Parcours reel a verifier avec deux comptes

1. Connexion Auth0, profil sauvegarde puis rechargement pour verifier la persistance.
2. Activation hote, table enregistree et publication d'un repas futur gratuit.
3. Dans un autre profil navigateur : second compte, profil, Explorer, reservation.
4. Acceptation par l'hote ; verification des listes et de l'adresse cote invite.
5. Allergies masquees par defaut ; donner puis retirer l'accord de partage sur la
   reservation et verifier chaque changement cote hote.
6. Annulation ; pour un autre repas passe, cloture par l'hote puis avis invite.
7. Deconnexion et rechargement d'une route privee : connexion de nouveau requise.

## Resultats du 16 novembre 2026

- Client API : 8 tests reussis (concurrence, renouvellement, expiration, erreurs,
  deconnexion, reponse 204, refresh tardif, mapping proxy).
- Build TypeScript/Vite : reussi.
- Formatage frontend et verification syntaxique des scripts : reussis.
- Navigateur : tente, bloque avant les assertions par `EACCES` sur localhost.
- Installation backend : `npm ci` echoue avec `Exit handler never called`.
  Typecheck initial bloque par `openid-client` absent des dependances locales.
- Suite backend avec couverture tentee : erreur au demarrage de Vitest/Vite
  (`code.charCodeAt is not a function`) avec ces dependances locales incompletes.
  Aucun test backend valide dans cette session ; le rapport a 0 % n'est pas une
  mesure exploitable de la couverture du code.
- Auth0 local non configure et acces Docker refuse dans cette session.
  Le parcours complet Auth0 + PostgreSQL n'est **pas encore valide**.

Aucun secret invente. Aucune authentification fictive dans le code applicatif :
l'API fictive existe uniquement dans le script de test.
