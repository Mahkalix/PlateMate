# Frontend PlateMate

React, TypeScript et Vite servent la page d’accueil. Les styles SCSS suivent les couches inspirées de Socle-SCSS. Les photos, les polices de titre et le logo se trouvent dans `public/home/`.

```sh
cd frontend
npm ci
npm run start
```

Ouvrir `http://localhost:8080/`. Le menu et les boutons de découverte mènent aux sections de la page. Les libellés juridiques du pied de page sont affichés en texte simple.

`npm run format:check` contrôle le formatage. `npm run build` vérifie TypeScript et génère `dist/`. `npm run preview` sert ce build localement. Vercel publie `frontend/dist`.

Pour servir le build avec Docker, lancer `docker compose up --build -d --wait frontend` depuis la racine du dépôt. Le site est accessible sur le port 8080. Relancer la commande après une modification ou utiliser `npm run start` pour le rechargement automatique en développement.
