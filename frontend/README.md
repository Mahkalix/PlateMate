# Frontend PlateMate

React, TypeScript et Vite servent la page d’accueil. Les styles SCSS suivent les couches inspirées de Socle-SCSS. Les photos, les polices de titre et le logo se trouvent dans `public/home/`.

## Écrans Ready for dev

Routes supplémentaires : `/#/a-propos`, `/#/devenir-hote`, `/#/connexion`, `/#/profil` et `/#/candidature`. Les deux formulaires comportent trois étapes et une confirmation. Les données restent en mémoire et disparaissent au changement de page. Aucun appel d'authentification, paiement ou dépôt de candidature n'est effectué dans cette PR front.

La FAQ est une proposition éditoriale demandée par le propriétaire du projet. La vidéo reste indisponible jusqu'à génération et validation (voir `video-proposal.md`). Les garanties d'assurance et les revenus affichés par la maquette ne constituent pas des fonctionnalités validées du backend.

### Tests des parcours

Après `npm run build`, lancer `npm run test:browser` avec Node 22 et Chrome installé. `CHROME_PATH` permet de préciser le chemin de Chrome. Le script lance une preview locale et un navigateur headless avec un profil temporaire, à 1440 et 390 px, DPR 1. Il vérifie la base rem, les champs obligatoires, les groupes requis, les retours entre étapes, les confirmations simulées et l'absence de débordement à l'étape finale.

Ces tests ne couvrent ni les API, ni Auth0, ni Stripe, ni la délivrabilité des emails. Ils ne certifient pas à eux seuls la conformité complète aux propriétés Figma ou l'accessibilité complète. La comparaison DOM avec Figma est un contrôle distinct. La preview Vercel protégée n'a pas encore été mesurée.

```sh
cd frontend
npm ci
npm run start
```

Ouvrir `http://localhost:8080/`. Le menu et les boutons de découverte mènent aux sections de la page. Les libellés juridiques du pied de page sont affichés en texte simple.

`npm run format:check` contrôle le formatage. `npm run build` vérifie TypeScript et génère `dist/`. `npm run preview` sert ce build localement. Vercel publie `frontend/dist`.

Pour servir le build avec Docker, lancer `docker compose up --build -d --wait frontend` depuis la racine du dépôt. Le site est accessible sur le port 8080. Relancer la commande après une modification ou utiliser `npm run start` pour le rechargement automatique en développement.
