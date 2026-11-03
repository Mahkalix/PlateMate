# Schéma physique S0

```mermaid
erDiagram
 users ||--o{ sessions : ouvre
 sessions {
 uuid id PK
 uuid user_id FK
 text refresh_hash UK
 timestamptz expires_at
 }
 users { 
 uuid id PK
 text email UK
 text auth_issuer
 text auth_subject
 timestamptz created_at
 }
 migrations {
 text name PK
 }
```

Le schéma PostgreSQL platemate_mvp isole ces tables du backend historique. migrations sert au déploiement sans écran utilisateur. Les tables des sprints suivants figurent comme propositions dans traceability.md.
## Modèle après S5

```mermaid
erDiagram
 users ||--o| profiles : personnalise
 users ||--o{ sessions : ouvre
 profiles ||--o| host_profiles : accueille
 host_profiles ||--o{ contexts : propose
 contexts ||--|{ context_slots : planifie
 context_slots ||--o{ bookings : recoit
 users ||--o{ bookings : demande
 bookings ||--|{ booking_status_events : trace
 bookings ||--o{ reviews : autorise
 users ||--o{ messages : ecrit_ou_recoit
 users ||--o{ reviews : publie_ou_recoit
```

Les colonnes physiques et leurs contraintes sont définies par les sept migrations de backend/mvp/sql. Les deux membres d’un échange sont identifiés par sender_id et recipient_id. Un événement de réservation conserve son acteur et son horodatage. Le profil validé est stocké dans details en JSONB pour être remplacé atomiquement. Le badge et la date du consentement restent séparés du document modifiable par le propriétaire.
