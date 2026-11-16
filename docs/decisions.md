# Décisions produit

## Allergies partagées avec consentement explicite (16 novembre 2026)

- **Contexte :** profil invité, Figma `778:2253`, section « Mes préférences ».
- **Décision précédente :** ne pas divulguer les contraintes privées à un tiers.
- **Contradiction dans la maquette :** le texte annonçait la transmission du régime et des allergies à l’hôte dès la réservation.
- **Option retenue, explicitement validée par le propriétaire :** les allergies peuvent être transmises à l’hôte concerné uniquement avec le consentement explicite de l’invité. Une réservation ou l’enregistrement du profil ne vaut pas consentement. Cet arbitrage n’autorise pas la publication des allergies ni le partage du régime alimentaire.
- **Alternatives écartées :** transmission automatique à la réservation ; absence totale de partage même lorsque l’invité y consent.
- **Conséquences pour cette PR front :** correction du texte et vérification à 1440 et 390 px. Aucune donnée transmise, aucune collecte de consentement simulée et aucune modification du backend.
- **Travail d’intégration restant :** définir l’écran de consentement, les données concernées et le destinataire, puis implémenter et tester le contrôle serveur avant toute divulgation. Ce parcours n’est pas ajouté silencieusement à la maquette. Effort et sprint à estimer lorsque cet écran et ses critères seront définis.
