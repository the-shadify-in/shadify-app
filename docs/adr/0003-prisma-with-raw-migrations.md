# ADR 0003: Prisma Type-Safe Client with Explicit SQL Migrations

## Status

Accepted (2026-10-18)

## Context

Shadify requires advanced PostgreSQL features that standard ORM abstractions either obfuscate or fail to generate cleanly:

1. Regex check constraints (e.g. `chk_slug_format` ensuring `^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$`).
2. Schema-level JSON object validation (`chk_theme_config_object` verifying `theme_config IS NULL OR jsonb_typeof(theme_config) = 'object'`).
3. Database triggers guarding against reserved platform URL namespace collisions (error code `23514`).
4. Row-Level Security (RLS) policies for tenant isolation.

Tools like `prisma db push` bypass migration histories, drop tables without warnings in edge cases, and cannot track custom PostgreSQL functions or triggers.

## Decision

1. Maintain `prisma/schema.prisma` pinned to Prisma 5.22.0 LTS as the authoritative schema for application models and TypeScript client generation (`@prisma/client`).
2. Manage all production schema changes through hand-crafted or diffed versioned SQL migrations under `prisma/migrations/<migration_name>/migration.sql`.
3. Prohibit `prisma db push` in all environments. Production and staging deployments must strictly execute `prisma migrate deploy`.
4. Separate the application runtime connection (`DATABASE_URL` with connection pooling) from the migration execution connection (`DIRECT_URL` bypassing PgBouncer).

## Consequences

- **Positive**: Every database modification is visible, diffable, reviewed in Git, and fully reproducible across local, staging, and production databases.
- **Positive**: PostgreSQL-native performance constraints and triggers are preserved without ORM impedance.
- **Trade-off**: Requires running `prisma migrate deploy` and `prisma generate` during build or deployment phases.
