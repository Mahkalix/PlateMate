# Fonctionnalités du backend PlateMate

Ce document décrit le périmètre produit et l'état du code au 28 septembre 2026. **Implémenté** signifie que l'API existe dans ce dépôt, pas qu'elle a été validée avec les comptes Auth0 et Stripe du projet. Les paiements sont limités au **mode test**. L'application complète et la vente réelle ne sont pas prêtes.

## Parcours produit

Le repas et l'expérience culinaire guident la découverte. La fiche présente aussi la personne qui accueille (photo, bio, langues, centres d'intérêt), comme élément de confiance. Le « matchmaking » demandé est un ensemble de **filtres**, sans score de compatibilité ni mise en relation automatisée. Le questionnaire doit préremplir ces filtres et rester privé. Les rencontres sont conviviales, pas un service de rencontre amoureuse.

| Domaine | Déjà implémenté dans l'API | Prévu ou à compléter |
| --- | --- | --- |
| Comptes et identité | Inscription, connexion et déconnexion locales pour le développement ; sessions en cookie ; `GET /api/auth/me`. En mode Auth0, validation des JWT via l'émetteur, l'audience et les clés publiques ; identification par `sub`. | Frontend Auth0 Universal Login, URL de retour et déconnexion, configuration du tenant, vérification d'e-mail, récupération de compte et MFA. Tester le parcours réel de bout en bout. |
| Profils | Lecture et remplacement du profil privé (`GET/PUT /api/profile`) : nom, ville, photo, bio, langues, centres d'intérêt, régimes, allergies et préférences. Seuls les champs publics de l'hôte sont exposés sur la fiche d'expérience. | Interface de questionnaire pour remplir les préférences ; choix de visibilité et parcours d'édition. Ne pas publier les allergies ou les réponses privées. |
| Photos | Envoi authentifié (`POST /api/media`) et lecture publique (`GET /api/media/:filename`) ; limite de 3 Mo et 20 mégapixels, rotation, réduction et réencodage WebP. | Stockage partagé/persistant pour l'hébergement final, politique de suppression des images et modération. |
| Expériences et menus | Création et modification par l'hôte ; dates, capacité, plats, prix du menu, cuisine, thème, ambiance, régime servi et photo. Publication après ajout d'un menu et d'une date future ; retrait de la découverte ; verrouillage de certaines modifications après demande/réservation. | Interface hôte, aperçu avant publication, modération et règles précises de qualité. |
| Découverte | `GET /api/experiences` (alias `/api/discover`) avec filtres cumulables `city`, `cuisine`, `theme`, `atmosphere`, `language`, `diet`, `date`, `guests`, tri et pagination. Fiche publique avec menu, disponibilités et profil de l'hôte. | Questionnaire qui renseigne les filtres, expérience utilisateur de recherche et tests métier sur les cas de régimes multiples. Le régime du repas ne se déduit pas de celui de l'hôte ; les allergies exigent une confirmation explicite. |
| Réservations | Demande de places, liste et fiche de réservation ; calcul du tarif côté serveur ; clé d'idempotence optionnelle ; acceptation ou refus par l'hôte avec contrôle transactionnel de la capacité. | Parcours frontend invité/hôte et notifications des changements d'état. |
| Paiement test | Stripe Checkout seulement après acceptation, session limitée à 30 minutes et suffisamment avant le repas. Webhooks signés et dédoublonnés ; confirmation du paiement par événement Stripe, jamais par URL de retour. La clé `sk_live_` et les événements live sont rejetés. | Essais de bout en bout avec les comptes Stripe du projet, gestion opérationnelle des incidents et validation commerciale des prix. **Aucun paiement réel activé.** |
| Annulations et litiges | Annulation d'une demande ou réservation ; remboursement Stripe demandé après paiement dans les délais codés ; événements de remboursement et litige pris en compte. | Définir les exceptions, les litiges tardifs et la procédure de support ; vérifier les remboursements et transferts après retrait bancaire. |
| Messagerie et avis | Messages privés associés à une réservation, accessibles aux participants. Avis d'un invité après un repas payé et passé ; lecture publique des avis hôte. | Modération, signalement, anti-abus et présentation des avis vérifiés. Pas de badge vérifié aujourd'hui. |
| Portefeuille hôte | Historique et montants en attente, disponibles ou en retrait (`GET /api/wallet`) ; Stripe Connect Express, vérification de capacité, transfert des gains et retrait bancaire manuel ; reprise par identifiant et webhooks de résultat. Worker de régularisation. | Tester Connect avec un vrai compte de **test**, rapprocher les cas d'interruption prolongée, traiter les litiges après retrait. Décider si un solde pourra un jour servir à réserver : **aucun crédit ou paiement par portefeuille n'existe**. |
| Exploitation | Migrations PostgreSQL versionnées, santé HTTP et disponibilité de la base, worker, tests automatisés, Docker Compose pour l'environnement de développement. | Hébergement HTTPS, sauvegardes/restauration, supervision, secrets, rétention/export/suppression des données, conformité fiscale et facturation avant ouverture commerciale. |

## Règles du prototype à confirmer

- Le prix du menu revient à l'hôte ; les frais de service sont fixés dans le code à **4 € par convive** pour la plateforme. Ce tarif n'est pas une décision commerciale finale.
- Les gains de l'hôte deviennent disponibles **48 h après le repas** si le paiement est confirmé et qu'aucun blocage ne s'applique. La preuve de présence et le délai réel de libération restent à définir.
- Un invité peut annuler une réservation payée avec remboursement intégral au moins **24 h avant** le repas ; l'hôte peut l'annuler avant le début. Ces règles doivent être validées juridiquement et commercialement.
- Le portefeuille représente les revenus des hôtes chez Stripe Connect. Il ne stocke pas un crédit librement rechargeable et ne sert pas à payer une autre expérience.
- Les badges et avis de confiance devront être liés à des événements vérifiés. Aucun badge décoratif ne doit être inventé.

## Routes existantes par parcours

| Parcours | Routes principales |
| --- | --- |
| Identité et profil | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` (local), `/api/auth/me`, `GET/PUT /api/profile` |
| Photos | `POST /api/media`, `GET /api/media/:filename` |
| Découverte | `GET /api/experiences`, `/api/discover`, `/api/experiences/:id`, `/api/hosts/:id/reviews` |
| Gestion hôte | `GET /api/my/experiences[/:id]`, `POST/PUT /api/experiences[/:id]`, `/api/experiences/:id/menu`, `/dates`, `/publish`, `/unpublish` ; `PUT/DELETE` d'un plat ou d'une date par ID |
| Réservation | `POST/GET /api/bookings`, `GET /api/bookings/:id`, `POST /api/bookings/:id/accept`, `/decline`, `/checkout`, `/cancel` |
| Échanges | `GET/POST /api/bookings/:id/messages`, `POST /api/bookings/:id/review` |
| Paiement et portefeuille | `POST /api/stripe/webhook`, `/api/stripe/connect-webhook`, `GET /api/wallet`, `POST /api/connect/onboarding`, `GET /api/connect/status`, `POST /api/wallet/withdrawals`, `/api/wallet/withdrawals/:id/retry` |
| Exploitation | `GET /api/health`, `/api/ready` |

Le [README backend](README.md) explique comment lancer et tester ces parcours. Les routes `/hote/paiements` et `/reservations/:id` utilisées comme retours Stripe sont des **pages du futur frontend** et ne sont pas fournies par l'API actuelle.
