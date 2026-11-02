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
 text password_hash
 timestamptz created_at
 }
 migrations {
 text name PK
 }
```

Le schéma PostgreSQL platemate_mvp isole ces tables du backend historique. migrations sert au déploiement sans écran utilisateur. Les tables des sprints suivants figurent comme propositions dans traceability.md.
