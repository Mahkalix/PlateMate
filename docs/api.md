# API du matching · S0 et S1

URL locale http://localhost:3001. Corps et erreurs JSON. La réponse d’erreur contient la clé error. Les erreurs de syntaxe JSON donnent 400 et les corps de plus de 16 Kio donnent 413.

| Méthode et chemin | Entrée | Succès | Accès et erreurs |
|---|---|---|---|
| GET /health | — | 200 {status:"ready"} | Public, 503 base indisponible |
| POST /auth/register | email, password (12 caractères minimum, 72 octets maximum) | 201 {id,email} | Public, 422 invalide, 409 doublon |
| POST /auth/login | email, password | 200 {accessToken} et cookie refresh | Public, 422 invalide, 401 invalid_credentials |
| POST /auth/refresh | Cookie refresh | 200 {accessToken} et nouveau cookie | 401 si absent, inconnu, expiré ou déjà consommé |
| GET /me | Authorization Bearer | 200 {id,email} | 401 sans session valide |
| POST /auth/logout | Authorization Bearer | 204 et suppression du cookie | 401 sans session valide |

Les routes /auth partagent une limite de dix appels par minute et par IP. Le dépassement renvoie 429 et Retry-After. Le cookie est limité au chemin /auth/refresh. La déconnexion supprime la session en base, ce qui invalide immédiatement ses deux jetons.
## Routes authentifiées de S2 à S5

Toutes demandent Authorization: Bearer et répondent 401 si la session manque ou est invalide. Les validations de structure répondent 422. GET n’a pas de corps.

| Route | Entrée | Réponse ou erreur métier |
|---|---|---|
| GET /me/profile | — | 200 {profile:null} ou profil privé et badges |
| PUT /me/profile | firstName, lastName, city, languages[], affinities[], publicInterests[], ambiences[], diets[], allergies[], intolerances[], cuisines[], consent. description et neighborhood facultatifs | 200 {profile}. Remplacement intégral, 422 sans consentement pour les données alimentaires sensibles |
| GET /explorer | language, ambience, diet, kind facultatifs. offset ≥ 0, limit de 1 à 50 | 200 {items,total,nextOffset}. Liste vide autorisée |
| GET /profiles/:host/contexts/:context | deux UUID | 200 carte, informations publiques, points communs autorisés et créneaux. 404 absent ou incompatible |
| POST /me/host | {} | 201 {hostId}, 409 si profil absent ou déjà hôte |
| POST /me/contexts | title, kind, ambience, safeFor[], supportedDiets[], slots[{startsAt,capacity}] | 201 {id}, 403 si non hôte, 422 pour date passée ou doublée |
| GET /me/bookings | view=host ou guest | 200 {items}, historique des statuts et interlocuteur par réservation |
| POST /bookings | slotId, partySize | 201 {id,status}, 403 pour son contexte, 404 si inaccessible, 409 doublon ou capacité |
| PATCH /bookings/:id/status | status | 200 {id,status}, 403 pour rôle interdit, 404 si tiers, 409 si transition ou capacité invalide |
| POST /bookings/:id/payment-intent | — | 200 {paymentIntentStatus:"simulated"}, 404 si réservation non acceptée ou non possédée |
| GET /conversations | — | 200 {items} résumant les fils de l’appelant |
| GET /conversations/:peer/messages | UUID du correspondant | 200 {items} ordonnés du plus ancien au plus récent, 404 si profil inconnu |
| POST /conversations/:peer/messages | body de 1 à 4 000 caractères | 201 {id}, 404 pour destinataire invalide, 409 si émetteur sans profil |
| POST /bookings/:id/review | rating entier de 1 à 5, comment de 1 à 1 000 caractères | 201 {rating,comment}, 404 si tiers, 409 si rencontre inachevée ou avis déjà laissé |
| GET /me/export | — | 200 fichier JSON de données personnelles, sans secrets d’authentification |
| DELETE /me/account | {confirm:true} | 204 après suppression en base, 422 sans confirmation explicite |
