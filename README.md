# PlateMate

PlateMate permet de rencontrer des hôtes locaux autour d’un repas fait maison. Le projet réunit découverte de tables, préférences alimentaires, profils hôte et invité et suivi des réservations.

**[Ouvrir la préproduction PlateMate](https://plate-mate-git-main-mahkalixs-projects.vercel.app/)**

L’application est disponible en ligne : aucune installation locale n’est nécessaire pour la découvrir et tester les parcours.

## Environnements

| Environnement | Adresse | Branche |
| --- | --- | --- |
| Préproduction, pour tester les évolutions | [PlateMate preview](https://plate-mate-git-main-mahkalixs-projects.vercel.app/) | `main` |
| Site public | [weareplatemate.com](https://weareplatemate.com/) | `production` |

Les push sur `main` créent des previews Vercel sans publier les évolutions sur le domaine public. La production conserve la version antérieure à la PR #8. Une livraison publique nécessite une validation et une promotion explicites ; l’attribution automatique des domaines de production est désactivée.

Utiliser le lien stable de préproduction ci-dessus, notamment pour la connexion Auth0. L’accès peut demander une autorisation Vercel selon les droits du compte.

## Parcours de l’application

1. Découvrir PlateMate, son fonctionnement et la présentation des hôtes.
2. Se connecter ou créer un compte via la page sécurisée Auth0.
3. Compléter son profil, ses langues, ses centres d’intérêt et ses préférences.
4. Explorer les repas et envoyer une demande de réservation.
5. Retrouver son profil et ses réservations dans **Mon compte**, puis **Mes repas**.

L’espace invité sert à découvrir et réserver. L’espace hôte permet de renseigner sa table, publier des créneaux et gérer les demandes. La déconnexion se trouve dans le menu du compte.

La préproduction sert aux essais : utiliser des données fictives. Les paiements restent limités au mode test. Les tests automatisés ne certifient pas à eux seuls le parcours réel Auth0, les emails et les opérations Stripe ; leur validation se fait aussi avec deux comptes de test.

## Organisation technique

| Répertoire | Rôle |
| --- | --- |
| `frontend/` | Interface React, TypeScript, Vite et SCSS |
| `backend/mvp/` | API active Express/TypeScript, Auth0, PostgreSQL et migrations |
| `api/` | Point d’entrée de l’API sur Vercel |
| `docs/` | Contrat HTTP, décisions, schéma et guides de vérification |
| `backend/src/`, `backend/sql/`, `backend/test/` | Backend historique, conservé avec sa suite de tests |

Vercel construit le frontend et expose l’API sous la même origine via `/api/*` et `/auth/*`. Le service PostgreSQL doit être accessible au backend déployé. Le contrôle de disponibilité est [`/api/health`](https://plate-mate-git-main-mahkalixs-projects.vercel.app/api/health).

## Consignes de contribution

- Partir de `main` et ouvrir une PR vers `main`.
- Nommer les branches en minuscules avec des tirets : `feat/<sujet>`, `fix/<sujet>`, `chore/<sujet>` ou `docs/<sujet>`.
- Conserver `production` pour les livraisons validées. Les branches `archive/*` contiennent du travail non entièrement fusionné.
- Suivre les écrans Figma validés Ready for dev et les décisions produit documentées.
- Vérifier les états chargement, vide et erreur, l’affichage mobile et la navigation clavier.
- Faire passer les contrôles CI concernés avant fusion, puis vérifier le parcours sur la préproduction.
- Ne jamais committer de secrets, de fichiers `.env` ni de données personnelles de test. Les secrets Auth0 et Stripe restent côté serveur.
- Supprimer une branche de travail après fusion. Avant de supprimer du code ou des ressources, vérifier leurs usages et leurs tests.

## Documentation

- [Frontend : architecture, développement et tests](frontend/README.md)
- [Backend actif : configuration, Docker et tests](backend/README.md)
- [Déploiement et configuration Auth0 de la préproduction](docs/deployment.md)
- [Contrat API](docs/api.md)
- [Schéma du MVP](docs/schema-mvp.md)
- [Décisions produit](docs/decisions.md)
- [Parcours de vérification à deux comptes](docs/connected-local.md#parcours-reel-a-verifier-avec-deux-comptes)
- [Backend historique](backend/README.legacy.md)

Le développement local est facultatif. Pour travailler sur le code, les commandes sont dans les guides frontend et backend. La pile connectée utilise `compose.integration.yaml` ; le `compose.yaml` racine concerne le backend historique.
