# API du matching · S0 et S1

URL locale http://localhost:3001. Corps et erreurs JSON. La réponse d’erreur contient la clé error. Les erreurs de syntaxe JSON donnent 400 et les corps de plus de 16 Kio donnent 413.

| Méthode et chemin | Entrée | Succès | Accès et erreurs |
|---|---|---|---|
| GET /health | — | 200 {status:"ready"} | Public, 503 base indisponible |
| GET /auth/register | Navigation du navigateur | 302 vers Universal Login avec écran d’inscription | Public, cookie temporaire HttpOnly et SameSite=Lax |
| GET /auth/login | Navigation du navigateur | 302 vers la connexion email / mot de passe Auth0 | Public, state, nonce et PKCE S256 |
| GET /auth/callback | Code à usage unique, state et cookie temporaire du même navigateur | 303 vers APP_ORIGIN avec cookie refresh HttpOnly | 401 si tentative invalide, email non vérifié ou identité hors Database. 409 en cas de collision d’email. Les anciens POST avec mot de passe renvoient 404. |
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
### Révision du contrat de matching
POST /me/contexts accepte languages et themes, deux listes facultatives. Les données antérieures gardent des listes vides, sans héritage de l’hôte. GET /explorer compte et pagine les repas. Le détail expose languages et themes propres au repas. PATCH /bookings/:id/status renvoie 409 booking_no_longer_eligible si la compatibilité stricte ne peut plus être établie à l’acceptation. La demande reste en attente.
### Invités du créneau et avis publiés
GET /me/slots/:id/guests exige le jeton de l’hôte du repas. Réponse 200 avec capacity, confirmedPlaces, remainingPlaces, pendingRequests et guests (prénom et taille du groupe). Les places acceptées et terminées sont comptabilisées. Les demandes en attente sont comptées séparément. Créneau inconnu ou appartenant à autrui : 404.

GET /profiles/:id/reviews exige une session valide. Réponse 200 avec items et nextOffset. Les champs sont authorFirstName, rating, comment et createdAt. Paramètres sort (recent par défaut, highest ou lowest), limit (1 à 50) et offset (positif ou nul). Les avis antérieurs à la migration 008 conservent une date inconnue (null). Profil inexistant : 404. Paramètres invalides : 422.
