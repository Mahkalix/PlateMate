# Ready for dev : audit front

> Archive des vérifications de la PR #6, avant raccordement à l’API. Les mesures et résultats ci-dessous ne décrivent pas la version connectée actuelle. Les anciennes pages de démonstration et leur script de test ont été retirés ; le test actif est `scripts/test-connected.cjs`.

PR #6, branche `feat/homepage-ready`. Aucun merge ni changement backend. Référence Figma : `qtiIzlBfRLB3xK20yCRfuj`, page Wireframe `174:10`.

## Périmètre

| Écran | Frame | Route | Statut |
| --- | --- | --- | --- |
| Explorer | 371:725 | /#/explorer | Implémenté, catalogue de démonstration avec invitation à se connecter |
| À propos | 516:2247 | /#/a-propos | Implémenté, audit détaillé partiel |
| Devenir hôte | 448:984 | /#/devenir-hote | Partiel (vidéo à valider) |
| Connexion | 516:2813 | /#/connexion | Partiel (preview sans Auth0) |
| Profil 1, 2, 3 | 516:2871, 516:2976, 516:3108 | /#/profil | Implémenté, interactions locales |
| Confirmation profil | 995:7471 | /#/profil | Implémenté, confirmation simulée |
| Candidature 1, 2, 3 | 722:1467, 722:1620, 722:1713 | /#/candidature | Implémenté, interactions locales |
| Confirmation candidature | 722:1782 | /#/candidature | Implémenté, confirmation simulée |

Six écrans supplémentaires : profils hôte (769:5506) et invité (778:2253), Mes repas invité (793:2402, 942:5355), Mes repas hôte (815:2783, 942:5537). Après-repas hôte 986:6642 exclu : le propriétaire confirme que cet écran n’est pas Ready for dev. Le cadre 986:6967 contient la création de repas, également hors périmètre.

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

### Six écrans supplémentaires (PR front)

| Écran | Figma | Route |
| --- | --- | --- |
| Profil hôte | 769:5506 | /#/mon-profil/hote |
| Profil invité | 778:2253 | /#/mon-profil/invite |
| Repas invité remplis | 793:2402 | /#/mes-repas/invite |
| Repas invité vides | 942:5355 | /#/mes-repas/invite/vide |
| Repas hôte remplis | 815:2783 | /#/mes-repas/hote |
| Repas hôte vides | 942:5537 | /#/mes-repas/hote/vide |

Après retrait de l’après-repas et corrections de géométrie : build réussi, 203 assertions réussies. Les contrôles à 1440 et 390 px, DPR 1, couvrent les états vides, les liens vers Explorer et Devenir hôte, la bascule invité/hôte, les trois sections de profil, le verrouillage des champs et leur édition, le minimum de trois intérêts, les historiques et les messages honnêtes des actions sans API. Les mesures détaillées de conformité Figma restent en cours ; ces assertions ne constituent pas un audit visuel complet.

Mesures locales après chargement des polices et décodage des images (desktop 1440 px). Base html 10 px, body 16 px, pas de débordement horizontal à 1440 ou 390 px. Les hauteurs des cartes suivantes sont dans la tolérance de 1 px ; leurs positions et tous les styles descendants ne sont pas encore certifiés.

| Composant | Figma largeur × hauteur | DOM largeur × hauteur |
| --- | --- | --- |
| Statistiques des profils | 1320 × 140 | 1320 × 139.984375 |
| Informations personnelles (hôte et invité) | 932 × 335 | 932 × 334.390625 |
| À propos du profil hôte | 932 × 562 | 932 × 561.171875 |
| À propos du profil invité | 932 × 558 | 932 × 557.578125 |
| Ma table | 932 × 338 | 932 × 338.390625 |
| Préférences invité | 932 × 326 | 932 × 326.390625 |
| Carte vide avec action | 1320 × 228 | 1320 × 228.78125 |
| Carte vide sans action | 1320 × 174 | 1320 × 174.390625 |
| Repas hôte à venir, liste | 1320 × 210 | 1320 × 210 |
| Repas hôte passés, liste | 1320 × 146 | 1320 × 146 |
| Repas invité passés, liste | 1320 × 142 | 1320 × 142 |
| Repas invité annulés, liste | 1320 × 58 | 1320 × 57 |
| Réservation confirmée invité | 957 × 268 | 957 × 267.578125 |

Les dimensions des listes et de la réservation confirmée sont désormais protégées par cinq assertions Figma supplémentaires dans `test:browser`. Le contour intérieur et les séparateurs des listes sont dessinés sans augmenter leurs dimensions, comme les strokes intérieurs Figma.

Corrections : fond des statistiques sur le token `Surface/card-secondary` #ffe1a2, colonnes de 185 px espacées de 64 px, padding vertical 20 px ; actions et mention privée sur la même ligne ; titre des historiques 36 px ; sous-titre de confidentialité au-dessus de la carte ; liens Profil et Mes repas reliés aux écrans correspondants. Les cartes utilisent un padding CSS de 23 px plus une bordure de 1 px pour retrouver l’offset intérieur Figma de 24 px.

Points ouverts : le libellé de la statistique « 4 » du profil invité vaut « ??? » dans Figma (précision demandée). Arbitrage validé : les allergies peuvent être transmises à l’hôte concerné uniquement avec consentement explicite. Le texte du profil est corrigé ; aucun transfert ni collecte de consentement n’est implémenté. Les interactions restent locales, sans authentification, envoi de message, avis, annulation ou versement réel. Les pages sont publiées dans la PR #6 ; le contrôle de la preview déployée reste ouvert.

- La preview Vercel protégée n'a pas été mesurée : permission navigateur précédemment refusée. Une réactivation a été demandée. Les relevés sont locaux.
- Audit exhaustif des sous-composants, des couleurs, interlignes et états interactifs encore incomplet. Aucun audit externe d'accessibilité, test de charge ou test API.
- L'avertissement de démonstration est placé sous la carte de vérification et sous les confirmations ; il ajoute de la hauteur à la page, volontairement documentée.
- La vidéo n'est pas générée ni publiée. Weave nécessite une liaison Figma ; validation du résultat requise avant intégration. Voir `video-proposal.md`.
- FAQ proposée à la demande du propriétaire. Promesses de revenus, assurance et délais reprises de la maquette à confirmer côté produit. Les emails de contact ne sont pas vérifiés.
- Google/Apple et mot de passe oublié expliquent la limite de preview. Auth0 sera raccordé dans le périmètre d'intégration. Le centre d'aide reste sans destination faute d'écran.

Contrôle complémentaire des six routes à 1440 et 390 px : les SVG du compte conservent leurs dimensions natives ; les polices réellement utilisées, relevées dans Chrome, sont BBB ReadMe (titres) et DM Sans 9pt (onglets). Le cadenas était étiré à 24 × 24 px ; il mesure désormais 18 × 20 px dans son conteneur de 24 × 24 px. La flèche de vérification utilise le SVG Figma de 24 × 24 px. Ces contrôles ajoutent 36 assertions. Build et formatage réussis, 200 assertions passées, aucun échec.

Correction des traits intérieurs du compte : les bordures des onglets et de la barre de choix du rôle ajoutaient chacune 1 px au flux. Elles sont désormais dessinées en ombre intérieure. Sur la vue invité vide (942:5367), le premier bloc commence à 400.984375 px, contre 402.984375 avant correction et 401 px dans Figma. Le test de position a échoué avant la correction, puis réussi. Suite complète : 201 assertions passées ; build et formatage réussis. Aucune référence mobile correspondante n'est inventée.

Arbitrage du propriétaire : la complétion du profil hôte vaut 90 % pour le texte et la barre. Le dessin Figma 771:2279 (256 px sur 312 px) est donc écarté sur ce point uniquement. Le composant progress conserve value=90, max=100, et reçoit son nom accessible depuis le titre. Deux assertions vérifient le texte et la position native 0.9 à 1440 et 390 px. Résultat local : 203 assertions réussies, build réussi.

Validation du texte sur les allergies : build et formatage réussis, 205 assertions navigateur réussies à 1440 et 390 px. Le test vérifie la présence de la condition de consentement dans le texte ; il ne prouve pas un contrôle de divulgation serveur, absent de cette PR. Décision consignée dans docs/decisions.md.
