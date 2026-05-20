# IAM Management Guide

This document explains the **Module-Based Access Control (MBAC)** system used in Leaex V2. Follow these patterns to register new features and manage permissions correctly.

## Architecture Overview

Leaex uses a multi-schema authorization system (the `iam` schema). Unlike simple RBAC, MBAC grants permissions on specific **Modules** to **Roles**.

### Core Tables
- `iam.modules`: The feature groups (e.g., `ai`, `crm`, `billing`).
- `iam.module_actions`: Specific actions within a module (e.g., `use`, `view`, `delete`).
- `iam.roles`: System-defined roles (e.g., `owner_partner`, `floor_staff`, `walk_in`).
- `iam.role_permissions`: The bridge table that grants `allowed_actions[]` to a `role_id` for a `module_id`.

---

## How to Register a New Module

When adding a new feature that requires authorization, you must register it in the `iam` schema.

### Recommended Migration Pattern (CTE)

Always use a **Common Table Expression (CTE)** for module registration migrations. This is safer than PL/pgSQL `DO` blocks as it avoids variable scope issues in SQL statements.

```sql
WITH mod_id AS (
  -- 1. Register the module
  INSERT INTO iam.modules (module_key, display_name, tier_min, is_active)
  VALUES ('my_new_feature', 'My New Feature', 'org', true)
  ON CONFLICT (module_key) DO UPDATE SET is_active = true
  RETURNING id
),
action_setup AS (
  -- 2. Register standard actions
  INSERT INTO iam.module_actions (module_id, action_key, risk_level)
  SELECT id, 'use', 'low' FROM mod_id
  ON CONFLICT (module_id, action_key) DO NOTHING
)
-- 3. Grant initial permissions to roles
INSERT INTO iam.role_permissions (role_id, module_id, allowed_actions)
SELECT r.id, m.id, ARRAY['use']
FROM iam.roles r, mod_id m
WHERE r.role_key IN ('owner_partner', 'mgr_partner', 'org_owner')
ON CONFLICT (role_id, module_id) DO UPDATE SET
  allowed_actions = public.array_distinct(array_append(iam.role_permissions.allowed_actions, 'use'));
```

---

## Best Practices

### 1. Use Role Keys, Not UUIDs
Never hardcode role UUIDs in migrations. Roles might have different IDs across dev, staging, and production. Always look them up by `role_key`:
```sql
SELECT id FROM iam.roles WHERE role_key = 'owner_partner';
```

### 2. Handle Array Uniqueness
When adding a permission to an existing set, use the `public.array_distinct` helper to avoid duplicate entries in the `allowed_actions` column:
```sql
allowed_actions = public.array_distinct(array_append(iam.role_permissions.allowed_actions, 'edit'));
```

### 3. Anonymous Access
If a module should be accessible by unauthenticated users (e.g., AI chat on the landing page), the API route guard must be explicitly told to allow it:
```typescript
const guard = await requirePermission("ai", "use", "org", orgId, { allowAnon: true });
```
In the database, ensure the `walk_in` or `customer` role also has the permission granted if they are logged in.

---

## Common Pitfalls

- **Variable Scope**: Inside a PL/pgSQL `DO` block, using `v_variable_id` inside an `ON CONFLICT DO UPDATE SET` clause can sometimes lead to "relation does not exist" errors. Use CTEs instead.
- **Missing Actions**: A module exists but has no actions registered in `iam.module_actions`. `iam.check_permission` will return `false`.
- **Debug Bypass**: Remember that `DEBUG=true` in `.env` bypasses all IAM checks. Always test with `DEBUG=false` to verify your permission migrations.
