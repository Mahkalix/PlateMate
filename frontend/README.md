# Frontend PlateMate

La page communautaire est l'accueil provisoire sur `/` et reste disponible à `/whatsapp/`. Elle affiche « Site en construction » pendant le développement de l'application. Les pages équipe et mentions légales restent sous `/whatsapp/`.

## Lancer et modifier

Depuis `frontend/` :

```sh
npm ci
npm run start
```

Ouvrir `http://localhost:8080/` ou `http://localhost:8080/whatsapp/`. Pour compiler après une modification SCSS : `npm run build` (ou `npm run watch` dans un second terminal). Avant une PR : `npm run format:check` et `npm run check:css`.

Depuis la racine du dépôt, `docker compose up --build -d --wait` démarre aussi le frontend avec l'API, le worker et PostgreSQL. Pour le seul frontend : `docker compose up --build frontend`.

Les sources sont dans `frontend/scss/`. La compilation écrit `frontend/public/whatsapp/styles.css`, utilisé par les deux chemins. Ce CSS est versionné car Vercel sert des fichiers statiques sans étape de build. Vercel publie uniquement `frontend/public/`, indiqué dans `vercel.json` ; le fichier `index.html` est servi sur `/`, sans routeur JavaScript.

## Architecture

Le [Socle-SCSS](https://github.com/Mahkalix/Socle-SCSS) sert de référence pour l'ordre des couches et les préfixes de classes :

| Couche | Rôle dans ce dépôt |
| --- | --- |
| `1_settings` | Couleurs de la maquette et de la communauté |
| `2_tools` | Mixin de focus clavier |
| `3_generic` | Police et reset ciblé |
| `8_sections` | Styles de la page communautaire et des pages associées |

`community.scss` charge les fondations et les styles communautaires. Les couches `4_elements` à `7_components` seront ajoutées selon les besoins du futur frontend applicatif. Le reset du socle n'est pas recopié tel quel : les liens et les indicateurs de focus restent visibles.

Le frontend applicatif (connexion Auth0, expériences, réservations) n'est pas encore créé. Cette PR ne branche pas l'API ni Stripe aux pages statiques.
