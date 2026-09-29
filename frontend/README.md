# Frontend PlateMate

React, TypeScript et Vite servent toutes les pages. Les styles SCSS suivent les couches inspirées de Socle-SCSS. Les fichiers statiques (photos, police, logo) sont dans `public/`.

```sh
cd frontend
npm ci
npm run start
```

Ouvrir `http://localhost:8080/` (accueil de l’application), `/explorer` (recherche), `/devenir-hote`, `/a-propos`, `/connexion` (écran d’attente) et `/whatsapp/` (page communautaire d’origine). Les anciennes URL `/whatsapp/equipe.html` et `/whatsapp/mentions-legales.html` restent utilisables.

Les pages de l’application suivent la maquette PlateMate dans `src/app/pages/`. `src/app/components/` contient les boutons, cartes et navigation ; `scss/app.scss` charge les couches de styles, avec les couleurs dans `scss/3_generic/_app-base.scss`. La recherche et la fiche d’expérience interrogent l’API publique via `VITE_API_BASE_URL` (par défaut `http://localhost:3000`). Par exemple, pour un backend distant, créer un fichier `.env.local` dans `frontend/` avec `VITE_API_BASE_URL=https://api.example.test` (URL publique uniquement). La page WhatsApp existante et ses styles restent séparés.

Cette PR est un aperçu visuel et de navigation. Les photographies de l’accueil, de la galerie et du recrutement hôte ainsi que le logo proviennent des images source de la maquette Figma (`public/figma/`). Les couleurs principales reproduisent les remplissages Figma ; la collection de variables « color shades [oser] » est transcrite en map Sass dans `_tokens.scss`. Les cartes utilisent les photos renvoyées par l’API et affichent un fond neutre si elles manquent. Le parcours Auth0 et la réservation ne sont pas encore actifs ; `/connexion` l’indique clairement.

`npm run build` vérifie TypeScript et génère `dist/`. `npm run preview` sert ce build localement. Vercel construit le frontend et publie `frontend/dist` ; sa réécriture vers `index.html` permet l'accès direct aux pages du routeur. Docker Compose construit le même frontend et le sert sur le port 8080 avec l'API et PostgreSQL (`docker compose up --build -d --wait` depuis la racine). Pour suivre le frontend : `docker compose logs -f frontend` depuis la racine. Le conteneur sert un build figé ; relancer `docker compose up --build -d --wait` après une modification du code. `npm run start` utilise Vite et recharge les changements pendant le développement.

Les expériences publiques sont consultables lorsque l’API est disponible. Auth0, les réservations et Stripe ne sont pas encore raccordés. Aucun secret API ne doit être mis dans les variables `VITE_`.
