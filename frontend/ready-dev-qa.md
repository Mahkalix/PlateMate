# Ready for dev : suivi de conformité

Travail en cours. Cette livraison front n'est pas une certification de conformité complète. Aucune modification backend et aucun merge.

Références : fichier Figma `qtiIzlBfRLB3xK20yCRfuj`, page Wireframe `174:10`. Les dimensions sont extraites des calques, les mesures navigateur du build local. Aucune référence mobile correspondante n'a été identifiée : le responsive est adapté, pas certifié contre une maquette mobile.

| Écran | Frame Figma | Route | Statut |
| --- | --- | --- | --- |
| À propos | 516:2247 | /#/a-propos | Partiel |
| Devenir hôte | 448:984 | /#/devenir-hote | Partiel (FAQ proposée, vidéo à valider) |
| Connexion | 516:2813 | /#/connexion | Partiel (interaction locale, Auth0 non raccordé) |
| Profil 1, 2, 3 | 516:2871, 516:2976, 516:3108 | /#/profil | Partiel |
| Confirmation profil | 995:7471 | /#/profil | Partiel |
| Candidature hôte 1, 2, 3 | 722:1467, 722:1620, 722:1713 | /#/candidature | Partiel |
| Confirmation candidature | 722:1782 | /#/candidature | Partiel |

Explorer, portefeuille, messagerie et réservations ne sont pas inclus : aucun écran Ready for dev correspondant retenu.

## Résultats locaux

Chrome headless, DPR 1, polices chargées et images décodées. `npm run build` réussi. `npm run test:browser` : 63 assertions réussies, aucune ignorée. Vérifications à 1440 et 390 px : base html 10 px et body 16 px, navigation, menus, FAQ, validation des formulaires, retours conservant les champs, confirmations explicitement simulées. Aucun stockage persistant ni requête de création de compte, candidature ou paiement.

## Mesures et écarts encore ouverts

Mise à jour confirmations : 71 assertions passent désormais. Les cartes utilisent les groupes de la maquette (médaillon, titre et texte, actions, prochaines étapes). Le message de simulation est placé sous la carte. « Centre d'aide » reste un libellé sans destination, aucun écran correspondant n'étant fourni.

| Confirmation | Viewport | Propriété | Figma | DOM local |
| --- | ---: | --- | ---: | ---: |
| Profil | 1440 | Hauteur | 384 | 384.765625 |
| Hôte | 1440 | Hauteur | 723 | 722.734375 |
| Les deux | 1440 | Largeur | 600 | 600 |
| Les deux | 1440 | Padding | 32 | 32 |
| Les deux | 1440 | Fond du médaillon | #ffcc58 | rgb(255, 204, 88) |
| Profil | 390 | Largeur / hauteur | Non défini | 358 / 368.765625 |
| Hôte | 390 | Largeur / hauteur | Non défini | 358 / 822.3125 |

Ces hauteurs desktop passent la tolérance de 1 px. Les tests protègent maintenant largeur, hauteur et padding des confirmations. Les positions après le focus automatique ne sont pas comparées aux coordonnées de document Figma.

Valeurs en pixels CSS, sauf indication contraire. La tolérance géométrique demandée est de 1 px. Ces relevés ciblés ne remplacent pas une comparaison exhaustive de chaque propriété et état.

| Page | Viewport | Composant / propriété | Figma | DOM local | Source probable | Gravité / état |
| --- | ---: | --- | ---: | ---: | --- | --- |
| Profil étape 3 | 1440 | Carte / largeur | 734 | 734 | scss/8_sections/_forms.scss | Résolu |
| Profil étape 3 | 1440 | Carte / padding | 32 | 32 | scss/8_sections/_forms.scss | Résolu |
| Profil étape 3 | 1440 | Carte / hauteur | 484 | 481.984375 | scss/8_sections/_forms.scss | Mineur, ouvert |
| Profil étape 3 | 1440 | Carte / Y | 390.61 | 390.203125 | scss/8_sections/_forms.scss | Dans la tolérance |
| Candidature étape 3 | 1440 | Carte / largeur | 734 | 734 | scss/8_sections/_forms.scss | Résolu |
| Profil étape 3 | 390 | Carte / largeur | Non défini | 358 | scss/8_sections/_forms.scss | Adaptation responsive |
| Profil étape 3 | 390 | Carte / padding | Non défini | 24 | scss/8_sections/_forms.scss | Adaptation responsive |
| Candidature étape 3 | 390 | Carte / largeur | Non défini | 358 | scss/8_sections/_forms.scss | Adaptation responsive |

À compléter : géométrie détaillée de la candidature et des confirmations, audit exhaustif des couleurs et interlignes, états clavier/survol, nouvelle mesure sur Vercel. L'accès navigateur à la preview protégée avait été refusé ; les mesures actuelles sont exclusivement locales.

## Écarts éditoriaux et fonctionnels explicites

- FAQ rédigée à la demande du propriétaire ; les réponses absentes de Figma ne sont pas présentées comme des spécifications backend validées.
- Vidéo non générée, non publiée. Weave nécessite une liaison du compte Figma. Scénario dans `video-proposal.md`.
- SSO Google/Apple et mot de passe oublié ouvrent une explication de la limite de preview. Auth0 reste la solution prévue au raccordement.
- Revenus, assurance incluse et délais de validation sont des promesses de la maquette qui nécessitent confirmation métier. L'étape hôte affiche un avertissement de démonstration et demande des données fictives.
- Les emails de contact sont repris de la maquette ; leur délivrabilité n'a pas été vérifiée.
