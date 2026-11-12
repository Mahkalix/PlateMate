# Ready for dev : audit front

PR #6, branche `feat/homepage-ready`. Aucun merge ni changement backend. Référence Figma : `qtiIzlBfRLB3xK20yCRfuj`, page Wireframe `174:10`.

## Périmètre

| Écran | Frame | Route | Statut |
| --- | --- | --- | --- |
| À propos | 516:2247 | /#/a-propos | Implémenté, audit détaillé partiel |
| Devenir hôte | 448:984 | /#/devenir-hote | Partiel (vidéo à valider) |
| Connexion | 516:2813 | /#/connexion | Partiel (preview sans Auth0) |
| Profil 1, 2, 3 | 516:2871, 516:2976, 516:3108 | /#/profil | Implémenté, interactions locales |
| Confirmation profil | 995:7471 | /#/profil | Implémenté, confirmation simulée |
| Candidature 1, 2, 3 | 722:1467, 722:1620, 722:1713 | /#/candidature | Implémenté, interactions locales |
| Confirmation candidature | 722:1782 | /#/candidature | Implémenté, confirmation simulée |

Explorer, portefeuille, messagerie et réservations n'ont pas de frame Ready for dev retenue ici. La maquette n'a pas été modifiée.

## Vérifications réelles

Build TypeScript/Vite et formatage réussis. `npm run test:browser` : **105 assertions réussies**, aucune ignorée. Chrome headless local à 1440 et 390 px, DPR 1, polices chargées et images décodées. Base html 10 px et body 16 px ; reset inchangé.

Styles de champs contrôlés : token Figma `Text/placeholder` #6d717f, rendu calculé `rgb(109, 113, 127)` aux deux viewports ; libellés `DM Sans SemiBold` de graisse 600 (contre 500 auparavant). Texte des options et aides en graisse 500, tracking des libellés et options -0.028rem d'après les propriétés exportées. Le gris est centralisé dans `--pm-placeholder`. Ces changements ne modifient pas les dimensions du tableau ci-dessous.

Parcours : champs et groupes obligatoires, consentements, retour avec conservation des champs, toutes les étapes, confirmations explicitement simulées, menus mobiles, FAQ, connexion de démonstration et retour aux tables de l'accueil. Aucun débordement horizontal aux étapes contrôlées.

Sélection de document : fichier fictif, nom visible, focus clavier visible. Le contenu n'est ni lu ni envoyé ; revenir en arrière réinitialise la sélection. Les données de formulaire restent en mémoire, sans création de compte, candidature ou paiement réel.

## Mesures desktop (pixels CSS)

Toutes les dimensions ci-dessous proviennent des calques ou du DOM. Tolérance géométrique demandée : 1 px. Ces relevés ne certifient pas à eux seuls chaque couleur, état, interligne et sous-composant.

| Page / composant | Figma largeur × hauteur | DOM largeur × hauteur | Padding DOM | État |
| --- | --- | --- | --- | --- |
| Profil 1 | 734 × 562 | 734 × 562 | 32 | Dans la tolérance |
| Profil 2 | 734 × 628 | 734 × 627 | 32 | Dans la tolérance |
| Profil 3 | 734 × 484 | 734 × 484 | 32 | Dans la tolérance |
| Hôte 1 | 734 × 654 | 734 × 654 | 32 | Dans la tolérance |
| Hôte 2 | 736 × 554 | 736 × 554 | 32 | Dans la tolérance |
| Hôte 3 | 736 × 872 | 736 × 872.390625 | 32 | Dans la tolérance |
| Confirmation profil | 600 × 384 | 600 × 384.765625 | 32 | Dans la tolérance |
| Confirmation hôte | 600 × 723 | 600 × 722.734375 | 32 | Dans la tolérance |
| Connexion | 440 × 554 | 440 × 553.171875 | 32 | Dans la tolérance |
| FAQ hôte fermée | 1440 × 618 | 1440 × 617.59375 | 80 / 184 | Dans la tolérance |
| Invitation hôte | 1440 × 317 | 1440 × 317.578125 | 80 | Dans la tolérance |
| Mission À propos | 1440 × 490 | 1440 × 490.25 | 112 / 83 | Dans la tolérance |
| Équipe | 1440 × 702 | 1440 × 701.59375 | 72 / 80 | Dans la tolérance |
| Valeurs | 1440 × 447.992 | 1440 × 447.625 | 88 / 112 / 96 | Dans la tolérance |
| Contact | 1440 × 502 | 1440 × 502.96875 | 80 | Dans la tolérance |

Les 112 px horizontaux de la section Valeurs regroupent les 80 px extérieurs et 32 px intérieurs de Figma. Les wrappers diffèrent, mais leur somme est conservée. Les sources sont `scss/8_sections/_forms.scss`, `_host.scss` et `_about.scss`.

Corrections principales : colonnes de préférences alimentaires sur quatre rangées et champ allergies simple ; boutons de formulaire de 44 px ; zone document de 152 px (icône 24 px dans cercle 48 px) ; jours disponibles sur deux rangées ; largeur 736 px propre aux étapes hôte 2/3 ; groupes des confirmations et fond jaune #ffcc58. Le récapitulatif des frais utilise #f2f2f3 et sa hauteur de 212.5 px est testée à 1 px près.

## Responsive à 390 px

Pas de frame mobile correspondante identifiée : adaptation responsive vérifiée, fidélité à une maquette mobile non certifiée. Les cartes mesurent 358 px de large, padding 24 px.

| Carte | Hauteur mesurée |
| --- | ---: |
| Profil 1 | 839.1875 |
| Profil 2 | 868.1875 |
| Profil 3 | 613.1875 |
| Hôte 1 | 951.1875 |
| Hôte 2 | 830.1875 |
| Hôte 3 | 991.078125 |
| Confirmation profil | 368.765625 |
| Confirmation hôte | 822.3125 |

## Limites et contrôles encore ouverts

- La preview Vercel protégée n'a pas été mesurée : permission navigateur précédemment refusée. Une réactivation a été demandée. Les relevés sont locaux.
- Audit exhaustif des sous-composants, des couleurs, interlignes et états interactifs encore incomplet. Aucun audit externe d'accessibilité, test de charge ou test API.
- L'avertissement de démonstration est placé sous la carte de vérification et sous les confirmations ; il ajoute de la hauteur à la page, volontairement documentée.
- La vidéo n'est pas générée ni publiée. Weave nécessite une liaison Figma ; validation du résultat requise avant intégration. Voir `video-proposal.md`.
- FAQ proposée à la demande du propriétaire. Promesses de revenus, assurance et délais reprises de la maquette à confirmer côté produit. Les emails de contact ne sont pas vérifiés.
- Google/Apple et mot de passe oublié expliquent la limite de preview. Auth0 sera raccordé dans le périmètre d'intégration. Le centre d'aide reste sans destination faute d'écran.
