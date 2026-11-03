# Tester la homepage et le backend ensemble

Cette branche réunit les PR #5 et #6.

Configurer le fichier local backend/mvp/.env selon le README (client Auth0 web serveur, secret, callback et PostgreSQL), puis lancer depuis la racine.

```sh
docker compose -f compose.integration.yaml up --build -d --wait
docker compose -f compose.integration.yaml ps
```

La homepage est servie sur http://localhost:8080 et l’API sur http://localhost:3001. Le parcours réel Auth0 commence sur http://localhost:3001/auth/login et revient vers la homepage après authentification.

Le bouton de connexion de la homepage affiche encore la fenêtre de démonstration. Les cartes restent des exemples éditoriaux. La présence des deux services dans la pile permet de tester leur démarrage et le retour Auth0. Le raccordement des écrans aux données et l’affichage de la session nécessitent une étape supplémentaire.

Les variables Auth0 restent exclusivement dans le backend. Le fichier .env est ignoré par Git.
