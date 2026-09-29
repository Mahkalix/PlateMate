# Frontend PlateMate

React, TypeScript et Vite servent toutes les pages. Les styles SCSS suivent les couches inspirées de Socle-SCSS. Les fichiers statiques (photos, police, logo) sont dans `public/`.

```sh
cd frontend
npm ci
npm run start
```

Ouvrir `http://localhost:8080/` (communauté WhatsApp et mention « Site en construction »), `/whatsapp/` (même page), `/equipe` et `/mentions-legales`. Les anciennes URL `/whatsapp/equipe.html` et `/whatsapp/mentions-legales.html` restent utilisables.

`npm run build` vérifie TypeScript et génère `dist/`. `npm run preview` sert ce build localement. Vercel construit le frontend et publie `frontend/dist` ; sa réécriture vers `index.html` permet l'accès direct aux pages du routeur. Docker Compose construit le même frontend et le sert sur le port 8080 avec l'API et PostgreSQL (`docker compose up --build -d --wait` depuis la racine). Pour suivre le frontend : `docker compose logs -f frontend` depuis la racine. Le conteneur sert un build figé ; relancer `docker compose up --build -d --wait` après une modification du code. `npm run start` utilise Vite et recharge les changements pendant le développement.

Le frontend est pour l'instant composé des pages publiques. Auth0, la consultation des expériences, les réservations et Stripe ne sont pas encore raccordés. Aucun secret API ne doit être mis dans les variables `VITE_`.
