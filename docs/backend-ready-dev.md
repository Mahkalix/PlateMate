# Backend des �crans Ready for dev (16 novembre 2026)

Base : PR #5, `f0ab3de`. R�f�rence frontend : PR #6, `f0f03f0`.
Figma : fichier `qtiIzlBfRLB3xK20yCRfuj`, profils `769:5506` et `778:2253`, repas `815:2783` et `793:2402` lus directement. �tats vides r�f�renc�s par le frontend : `942:5537`, `942:5355`.

## Contrat ajout�

Tous ces endpoints utilisent le bearer PlateMate obtenu par le parcours Auth0 existant. Aucune identit� utilisateur n'est accept�e dans le corps pour d�signer le propri�taire.

| Endpoint | Usage |
| --- | --- |
| `PATCH /me/profile` | �diter une section sans effacer les autres. Pr�sentation limit�e � 400 caract�res, au moins 3 int�r�ts lorsqu'ils sont modifi�s. T�l�phone, date de naissance ISO et motivations facultatifs. |
| `GET /me/account-summary` | Email Auth0, date d'inscription, r�le h�te et statistiques r�ellement calcul�es. |
| `GET /me/table` | Informations de table et adresse, pour leur propri�taire h�te uniquement. |
| `PUT /me/table` | Remplacement valid� de la table : `specialties`, `supportedDiets`, `languages`, `additionalInformation`, `address`. Adresse nullable, sinon `street`, `postalCode`, `city`, `instructions`. |
| `GET /me/meals?view=guest` | R�servations personnelles regroup�es dans `sections.upcoming`, `past`, `cancelled`. |
| `GET /me/meals?view=host` | Cr�neaux de l'h�te, y compris sans r�servation, avec capacit�, places confirm�es/restantes et demandes en attente. |
| `GET /bookings/:id/allergy-consent` | Lire le consentement de sa r�servation. |
| `PUT /bookings/:id/allergy-consent` | `{ "consent": true }` autorise le partage des allergies actuelles avec l'h�te de cette r�servation. `false` le r�voque. |
| `GET /bookings/:id/shared-allergies` | Lecture r�serv�e � cet h�te ; allergies uniquement si r�servation accept�e, consentement pr�sent et profil inchang�. |

Pagination des repas : `limit` de 1 � 100 (50 par d�faut), `offset` de 0 � 100000. Le d�coupage en sections s'applique � la page tri�e par date et identifiant. Les tableaux vides et `isHost` permettent au frontend de choisir ses �tats vides sans donn�es fictives.

L'adresse est retourn�e uniquement � l'invit� d'une r�servation `accepted`. Elle dispara�t des r�ponses lorsque la r�servation est annul�e ou termin�e. Les coordonn�es personnelles, r�gimes et intol�rances ne sont jamais ajout�s aux r�ponses publiques. Le changement d'email reste g�r� par Auth0, pas par l'�dition du profil.

## Confidentialit�

La d�cision du 16 novembre dans la PR #6 pr�vaut sur le texte Figma encore ancien : r�server ne donne aucun consentement. Le consentement de collecte du profil ne donne pas non plus de consentement de partage. Le serveur conserve les allergies explicitement autoris�es pour une r�servation donn�e ; toute modification des allergies ou retrait du consentement de collecte efface les autorisations de partage existantes, m�me si les anciennes allergies sont restaur�es plus tard. R�gimes et intol�rances restent priv�s.

Les donn�es de table et les consentements sont inclus dans l'export personnel existant et supprim�s par cascade avec le compte. Le frontend doit encore pr�senter les allergies exactes et l'h�te destinataire avant l'appel explicite : aucun �cran de consentement n'a �t� invent� ni raccord�.

## Arbitrages conserv�s et limites

- Le compteur `???` n'a pas de sens m�tier valid� et n'est pas invent� c�t� serveur.
- `cuisinesDiscovered` vaut `null` : le mod�le actuel d�crit un type de repas (`kind`), pas une cuisine. Le transformer en nombre de cuisines donnerait un r�sultat faux.
- Les statistiques h�te comptent les cr�neaux termin�s distincts et les comptes invit�s distincts. Les accompagnants anonymes ne deviennent pas des personnes identifi�es.
- La valeur 90 % reste une donn�e de maquette ; aucun faux score n'est enregistr� c�t� backend.
- La politique d'annulation existante (remboursement int�gral avant cl�ture) est conserv�e. Le d�lai de 48 h pr�sent dans Figma exige un arbitrage avant de modifier le comportement financier existant.
- Auth0, Stripe test, candidatures et cr�ation de repas existants restent en place. Apr�s-repas et cr�ation de repas ne sont pas de nouveaux �crans Ready for dev dans la PR #6.
- Aucun raccordement frontend n'est inclus. Photos, v�rification d'identit� et coordonn�es bancaires ne sont pas simul�es par de nouveaux champs libres.

## V�rification

Tests HTTP ajout�s dans `backend/mvp/test/integration/account.test.ts` : �dition partielle, validation, isolation, �tats vides, capacit�, adresse conditionnelle, consentement explicite et r�vocation d�finitive apr�s changement d'allergies.

La validation compl�te n�cessite PostgreSQL de test et les d�pendances du lockfile. Dans la session locale, Docker ne d�marre pas ; `npm ci` �choue avec `EPERM`. Le contr�le TypeScript initial trouve une d�pendance existante manquante (`openid-client`) ; ESLint du code source passe. Aucun succ�s des tests PostgreSQL n'est d�clar� sur cette base.
