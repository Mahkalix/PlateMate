# Préproduction et déploiement

## Environnements

- Préproduction : https://plate-mate-git-main-mahkalixs-projects.vercel.app/ (branche `main`).
- Production : https://weareplatemate.com/ (branche `production`, version antérieure à la PR #8).

Le projet Vercel `plate-mate` construit le frontend et l’API selon `vercel.json`. Les push sur `main` produisent des previews. Une publication publique nécessite une promotion explicite ; ne pas promouvoir un déploiement de test par défaut.

## Auth0

Utiliser l’application **PlateMate**, de type Regular Web Application, et conserver les URL locales encore utilisées.

| Paramètre Auth0 | URL de préproduction |
| --- | --- |
| Allowed Callback URLs | `https://plate-mate-git-main-mahkalixs-projects.vercel.app/auth/callback` |
| Allowed Logout URLs | `https://plate-mate-git-main-mahkalixs-projects.vercel.app` |
| Allowed Web Origins | `https://plate-mate-git-main-mahkalixs-projects.vercel.app` |

Dans les variables Vercel de l’environnement **Preview**, ciblant `main` :
- `APP_ORIGIN` correspond à l’origine ci-dessus.
- `AUTH0_CALLBACK_URL` correspond exactement au callback ci-dessus.
- `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` et `AUTH0_CONNECTION` correspondent à la même application Auth0.
- `DATABASE_URL` désigne la base de préproduction et `JWT_SECRET` reste un secret serveur.

Les autres options sont décrites dans [la configuration du backend](../backend/mvp/.env.example). Aucun secret ne doit être préfixé par `VITE_` ni inclus dans le dépôt. Une modification des variables nécessite un nouveau déploiement.

Une erreur **Callback URL mismatch** signifie que le `redirect_uri` envoyé n’est pas autorisé à l’identique dans Auth0. Privilégier l’URL stable de préproduction plutôt qu’une URL propre à un déploiement.

## Vérifier une livraison

1. Vérifier les workflows GitHub et le build Vercel.
2. Vérifier [la santé de l’API](https://plate-mate-git-main-mahkalixs-projects.vercel.app/api/health).
3. Tester connexion, création ou modification du profil, rechargement, réservation et déconnexion avec des comptes de test.
4. Contrôler les espaces hôte et invité, les états vides et les erreurs.
5. Consigner les résultats réels. Un test navigateur avec API simulée ne remplace pas le parcours réel.

Les migrations PostgreSQL sont exécutées par le build configuré dans `vercel.json`. La base doit donc être disponible au moment du déploiement. Les essais de paiement utilisent uniquement Stripe en mode test.
