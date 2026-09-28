# Direction produit PlateMate

Décisions de Maxence du 28 septembre 2026. Ces précisions prennent le pas sur les interprétations antérieures du Jalon 2.

## Expériences culinaires et confiance

Le visiteur choisit d'abord une expérience culinaire. L'hôte est visible sur la carte et sur la fiche : photo, présentation, langues, centres d'intérêt. La comparaison avec BlaBlaCar porte sur la visibilité de la personne qui accueille et les éléments de confiance. Les avis et badges devront provenir d'événements vérifiés, jamais de données décoratives.

Le terme « matchmaking » désigne des filtres : régime alimentaire, thème, cuisine, ambiance, ville, date, langues et nombre de personnes. Aucun score de compatibilité ou classement social n'est requis. Le questionnaire aide à renseigner ces filtres. Les données privées du questionnaire ne doivent pas devenir un profil public.

Les filtres se cumulent. Un résultat doit satisfaire tous les régimes sélectionnés, les autres critères et la disponibilité. Le régime déclaré par l'hôte concerne le repas proposé ; le régime personnel de l'hôte ne permet pas de conclure ce qu'il peut servir. Les allergies ne sont pas déduites d'une étiquette « vegan » ou « sans gluten ».

## Portefeuille demandé, inspiré de Vinted

L'existence d'un portefeuille est confirmée. La première version retenue pour le cadrage permet aux hôtes de consulter leurs gains, l'historique des mouvements et les retraits vers leur compte bancaire. Le réemploi du solde pour réserver un autre repas reste une décision ouverte, sans présumer de la réponse.

### États à implémenter

| État affiché | Sens métier | Conditions à développer |
| --- | --- | --- |
| Gains en attente | Part de l'hôte d'un paiement confirmé, pas encore retirable | Paiement rapproché d'une réservation et commission exclue |
| Solde disponible | Gains libérés après le repas et les contrôles applicables | Proposition de fonctionnement, délai et preuve de réalisation à définir |
| Retrait en cours | Montant affecté à un retrait | Compte bénéficiaire vérifié et identifiant de l'opération fournisseur |
| Retiré | Retrait effectivement confirmé | Événement fournisseur vérifié, pas un clic sur « retirer » |
| Montant bloqué | Gains indisponibles pour une réservation contestée | Traitement du litige et des remboursements à définir |

### Travail technique restant

- Intégrer les comptes hôtes et leur onboarding Stripe Connect en mode test.
- Choisir et tester le flux d'encaissement, de transfert et de retrait correspondant à la libération après repas. Le Checkout test actuel sur le compte plateforme n'implémente pas ce flux.
- Enregistrer les mouvements de gains, frais, remboursements et retraits dans un historique traçable, relié aux événements fournisseur, avec idempotence.
- Calculer les soldes à partir de ces mouvements ; aucun endpoint ne doit permettre de créditer arbitrairement un solde disponible.
- Tester les doublons de webhook, le paiement refusé, le remboursement, le litige, le retrait refusé et la reprise après incident.

Un paiement de réservation ne signifie pas qu'un solde est immédiatement retirable. Aucun portefeuille opérationnel ni retrait réel n'est annoncé à ce stade. Les clés de test et la configuration Connect seront nécessaires pour vérifier ces parcours chez Stripe.

## État de livraison

- Implémenté dans la PR : filtre des expériences, informations de l'hôte, profils privés, menu, dates, réservation et Checkout test après acceptation.
- À construire : interfaces, questionnaire relié aux filtres, upload photo, portefeuille/Connect, avis, messagerie, OAuth et règles d'annulation/remboursement.
- Tarification provisoire du prototype : 4 € de service par invité. Ce choix issu du ticket Figma n'est pas une décision commerciale confirmée.
