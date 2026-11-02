# Schéma physique S0

```mermaid
erDiagram
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
