# PlateMate

PlateMate met les expériences culinaires au centre. Les visiteurs découvrent le menu et l'hôte (photo, présentation, langues, centres d'intérêt), puis filtrent par cuisine, thème, ambiance, ville, date, régime et nombre de places. Le questionnaire peut alimenter ces filtres ; il n'y a pas de score de compatibilité. Voir le [cadrage produit](docs/product-direction.md).

## Ancienne page

La page statique du groupe WhatsApp reste dans [`/whatsapp/`](whatsapp/). Sur l'hébergement statique actuel, `/` redirige temporairement vers `/whatsapp/`. Pour la voir localement :

```sh
python3 -m http.server 8080
# http://localhost:8080/whatsapp/
```

Le site statique n'est pas l'application de réservation. Son identité visuelle reprend le Figma PlateMate ; le logo WhatsApp est issu de Simple Icons. Les licences des polices sont conservées avec leurs fichiers.

## Backend

Le [guide backend](backend/README.md) contient les commandes d'installation, les tests PostgreSQL, le parcours Stripe test, Auth0, les routes et les conditions de déploiement.

```sh
cd backend
npm ci
cp .env.example .env
docker compose up -d --wait db
npm run migrate
npm run dev
# puis dans un autre terminal : npm run demo
```

L'API gère les profils privés et fiches hôte publiques, les expériences et menus, la publication, les dates et capacités, les demandes acceptées par l'hôte, Stripe Checkout, les annulations/remboursements, la messagerie, les avis et les revenus des hôtes avec Stripe Connect. L'authentification Auth0 est imposée en mode production ; les comptes locaux servent à la démo de développement. Les confirmations de paiement viennent exclusivement des webhooks signés.

La [PR #1](https://github.com/Mahkalix/PlateMate/pull/1) reste en brouillon : le frontend principal, la configuration des comptes Auth0/Stripe Connect et les essais réels de bout en bout restent à faire avant d'ouvrir les ventes. Le site `/whatsapp/` conserve son chemin.
