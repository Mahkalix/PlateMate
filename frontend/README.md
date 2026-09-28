# Frontend PlateMate

Les deux premières pages sont l'accueil provisoire (`/`) et la page communautaire (`/whatsapp/`). Elles restent en HTML statique pendant la construction de l'application. Les pages équipe et mentions légales de l'ancien site utilisent aussi la feuille communautaire.

## Lancer et modifier

Depuis la racine du dépôt :

```sh
npm ci --prefix frontend
npm run build --prefix frontend
python3 -m http.server 8080 --directory frontend/public
```

Ouvrir `http://localhost:8080/` ou `http://localhost:8080/whatsapp/`. Pour compiler après chaque modification : `npm run watch --prefix frontend`. Avant une PR : `npm run format:check --prefix frontend` et `npm run check:css --prefix frontend`.

Les sources sont dans `frontend/scss/`. La compilation écrit `frontend/public/maintenance.css` et `frontend/public/whatsapp/styles.css` dans les chemins utilisés par les pages. Ces CSS sont versionnés car l'hébergement Vercel sert des fichiers statiques sans étape de build. Vercel publie uniquement `frontend/public/`, indiqué dans `vercel.json` ; la page d'attente est son `index.html` à la route `/`, sans routeur JavaScript.

## Architecture

Le [Socle-SCSS](https://github.com/Mahkalix/Socle-SCSS) sert de référence pour l'ordre des couches et les préfixes de classes :

| Couche | Rôle dans ce dépôt |
| --- | --- |
| `1_settings` | Couleurs de la maquette et de l'ancienne page, breakpoints |
| `2_tools` | Mixin de focus clavier |
| `3_generic` | Police et reset ciblé |
| `4_elements` | Styles de base de l'accueil |
| `5_layout` | Coquille de page `l-` |
| `6_objects` | Bouton réutilisable `o-` |
| `7_components` | En-tête et pied de page `c-` |
| `8_sections` | Page d'attente `s-` et styles communautaires existants |
| `9_utilities` | Réservé aux futurs utilitaires nécessaires |

`main.scss` charge les fondations, `modules.scss` et la section d'attente. `community.scss` produit la feuille de l'ancien site et conserve ses classes HTML afin de ne pas casser les pages équipe et mentions légales. Le reset du socle n'est pas recopié tel quel : les liens et les indicateurs de focus restent visibles.

Le frontend applicatif (connexion Auth0, expériences, réservations) n'est pas encore créé. Cette PR ne branche pas l'API ni Stripe aux pages statiques.
