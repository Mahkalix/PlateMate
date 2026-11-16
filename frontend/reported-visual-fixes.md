# Corrections des captures (16 novembre 2026)

Références Figma : Explorer `371:725`, Devenir hôte `448:984`, lecteur `651:1376`. Comparaison depuis les composants et styles Figma, puis mesures DOM. Base html 10 px et body 16 px inchangée.

| Élément | Écart observé | Référence et correction | Gravité |
| --- | --- | --- | --- |
| Titre des cartes Explorer | Couleur héritée #0f0909 | `Text/heading-turquoise` #236d77 dans `TableCard` | Notable |
| Flèche des cartes Explorer | Asset blanc de la variante pleine | Variante contour réutilisable, SVG Figma sombre de 24 × 24 px, fond transparent | Notable |
| Bandeau de connexion | Couleur héritée #0f0909 | Texte #ffcc58, fond #d12e31, hauteur desktop 40 px | Notable |
| Les deux « Commencer » | Fond transparent, texte clair | Composant `Button`, variante jaune #ffcc58, texte #0f0909, rayon 100 px | Notable |
| Lecteur vidéo | Icône seule étirée à 96 px | Cercle 87 × 87 px, icône native 67 × 67 px, bord blanc 2 px, fond blanc à 13 %, flou 18.55 px | Notable |
| Image vidéo | Voile sombre absent | Superposition noire à 27 %, poster conservé | Notable |

Les mesures locales à 1440 et 390 px confirment les couleurs, le cercle de 87 px et l’icône de 67 px. Les deux boutons mesurent 42.390625 px de haut, dans la tolérance de 1 px de la référence 42 px. Le bandeau mesure 40 px. Les cartes Explorer utilisent une colonne sur petit écran pour préserver la taille native de la flèche et la lisibilité. Aucun débordement horizontal détecté.

Validation : build et formatage réussis ; 222 assertions navigateur réussies, dont 17 contrôles supplémentaires sur ces corrections. Les variantes pleines des cartes de la homepage restent disponibles. Aucune dépendance ajoutée, aucun changement backend ou maquette. La vidéo elle-même reste indisponible : le bouton explique cette limite.
