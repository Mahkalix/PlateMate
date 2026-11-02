# Backlog de référence

Transcription du tableau 4.3 de [DEV JALON 2](https://docs.google.com/document/d/15GcjXfPS8XTEfGFUHw6okSjRYShX7Oqh8ZuFlFRzyZc/edit). Les arbitrages de maquette figurent dans decisions.md.

| ID | Story | Critères d’acceptation | Priorité | SP | Sprint |
|---|---|---|---|---:|---|
| US01 | Créer un compte et se connecter de façon sécurisée. | Inscription, connexion, déconnexion, message d’erreur si identifiants invalides. | Must | 3 | S1 |
| US02 | Gérer la session utilisateur. | Token stocké proprement, utilisateur reconnu après refresh, accès refusé si non connecté. | Must | 3 | S1 |
| US03 | Renseigner un profil de matching. | Langues, contraintes alimentaires, affinités relationnelles et description sauvegardées. | Must | 5 | S2 |
| US04 | Modifier son profil. | Les informations existantes sont pré-remplies et modifiables. | Must | 3 | S2 |
| US05 | Déclarer ses contraintes alimentaires. | Allergies, régimes et intolérances sélectionnables et persistées. | Must | 5 | S2 |
| US06 | Consulter des profils compatibles. | Liste de profils classés selon un score simple. | Must | 8 | S3 |
| US07 | Filtrer les résultats. | Filtres par langue, ambiance, contrainte alimentaire et contexte de rencontre. | Must | 5 | S3 |
| US08 | Refondre Explorer autour des profils. | Les cards affichent la personne, le contexte de rencontre, le niveau de compatibilité, la ville et les badges de confiance. | Must | 5 | S3 |
| US09 | Consulter le détail d’un profil/contexte. | Détail lisible, informations de confiance, préférences communes. | Should | 5 | S3 |
| US10 | Envoyer un premier message. | Un utilisateur connecté peut initier une conversation. | Should | 8 | S4 |
| US11 | Afficher une conversation. | Messages ordonnés, état vide, erreur gérée. | Should | 5 | S4 |
| US12 | Créer un profil hôte. | Un hôte peut proposer un contexte de rencontre. | Should | 5 | S4 |
| US13 | Afficher des badges de confiance. | Profil vérifié, avis, niveau de complétude visibles. | Should | 3 | S4 |
| US14 | Laisser un avis après rencontre. | Note, commentaire, rattachement à un profil. | Should | 5 | S4 |
| US15 | Préparer la minimisation RGPD. | Données personnelles limitées aux besoins réels du matching. | Must | 5 | Transverse |
| US16 | Créer une demande de réservation. | Demande associée à un profil/contexte, statut visible, confirmation possible par l’hôte. | Must | 8 | S5 |
| US17 | Confirmer une intention de paiement. | Paiement simulé ou préautorisation documentée, sans reversement hôte réel dans ce jalon. | Should | 5 | S5 |
| US18 | Paiement Stripe Connect complet. | Paiement sécurisé, rattachement à une réservation et préparation du reversement hôte. | Could | 13 | Post-MVP |
### Révision validée de US06–09 et US16
Le tableau conserve la transcription du jalon. Le contrat actuel compare le profil du visiteur aux langues, thèmes et régimes du repas. Chaque repas conserve sa propre carte. Le filtre langue interroge les langues annoncées pour le repas. À l’acceptation, contrôler à nouveau les allergies et intolérances courantes sans les dévoiler à l’hôte.
