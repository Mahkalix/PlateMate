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
