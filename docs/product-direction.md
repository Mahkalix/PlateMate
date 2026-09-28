# Direction produit PlateMate

Décisions de Maxence du 28 septembre 2026. Ces précisions prennent le pas sur les interprétations antérieures du Jalon 2.

## Expériences culinaires et confiance

Le visiteur choisit d'abord une expérience culinaire. L'hôte est visible sur la carte et sur la fiche : photo, présentation, langues, centres d'intérêt. La comparaison avec BlaBlaCar porte sur la visibilité de la personne qui accueille et les éléments de confiance. Les avis et badges devront provenir d'événements vérifiés, jamais de données décoratives.

Le terme « matchmaking » désigne des filtres : régime alimentaire, thème, cuisine, ambiance, ville, date, langues et nombre de personnes. Aucun score de compatibilité ou classement social n'est requis. Le questionnaire aide à renseigner ces filtres. Les données privées du questionnaire ne doivent pas devenir un profil public.

Les filtres se cumulent. Un résultat doit satisfaire tous les régimes sélectionnés, les autres critères et la disponibilité. Le régime déclaré par l'hôte concerne le repas proposé ; le régime personnel de l'hôte ne permet pas de conclure ce qu'il peut servir. Les allergies ne sont pas déduites d'une étiquette « vegan » ou « sans gluten ».

## Portefeuille demandé, inspiré de Vinted

L'existence d'un portefeuille est confirmée. La première version retenue pour le cadrage permet aux hôtes de consulter leurs gains, l'historique des mouvements et les retraits vers leur compte bancaire. Le réemploi du solde pour réserver un autre repas reste une décision ouverte, sans présumer de la réponse.

### États du backend

| État affiché | Sens métier | Règle implémentée ou à valider |
| --- | --- | --- |
| Gains en attente | Part de l'hôte d'un paiement confirmé, pas encore retirable | Paiement rapproché d'une réservation et commission exclue |
| Solde disponible | Gains libérés après le repas et les contrôles applicables | Libération 48 h après la date du repas ; preuve de réalisation et délai commercial à valider |
| Retrait en cours | Montant affecté à un retrait | Compte bénéficiaire vérifié et identifiant de l'opération fournisseur |
| Retiré | Retrait effectivement confirmé | Événement fournisseur vérifié, pas un clic sur « retirer » |
| Montant bloqué | Gains indisponibles pour une réservation contestée | Blocage au webhook de litige ; procédures de résolution à compléter |

### État de la réalisation et décisions encore ouvertes

La PR contient l'onboarding Stripe Connect Express, un historique par réservation, des gains en attente puis disponibles après 48 h, les transferts, les retraits et la reprise des opérations Stripe recherchées par identifiant. Les remboursements et litiges empêchent la libération des gains encore sur la plateforme. Ces flux n'ont été testés qu'avec des doublures Stripe et PostgreSQL ; il faudra les exécuter avec un compte Connect test et vérifier les cas tardifs après retrait bancaire.

Le solde n'est pas réutilisable pour payer un autre repas. Il n'existe pas d'endpoint permettant de créditer librement le portefeuille. Le tarif de service retenu dans le prototype est de 4 € par invité ; la politique retenue par défaut est le remboursement intégral jusqu'à 24 h avant le repas pour l'invité, et avant le début du repas pour l'hôte. Ces deux règles exigent une validation commerciale et juridique.

Le frontend principal, les notifications, la modération, les badges vérifiés, la vérification de présence après le repas et les procédures de litige et de suppression/export des données restent à créer avant la mise en vente. Les clés Auth0 et Stripe, les comptes connectés et l'hébergement sont externes au dépôt.
