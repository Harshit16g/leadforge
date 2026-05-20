#!/usr/bin/env python3
"""
Filters a Supabase pg_dump for safe restore into a fresh Supabase project.

Strips:
  - Neon-specific \restrict command
  - All DDL and data for Supabase-internal schemas:
    auth, storage, realtime, pgbouncer, vault,
    graphql, graphql_public, supabase_migrations, extensions
Keeps:
  - All application schemas: analytics, audit, billing, comms,
    crm, iam, inventory, ops, orgs, platform, public, scheduling
"""

import re
import sys

SKIP_SCHEMAS = {
    'auth', 'storage', 'realtime', 'pgbouncer', 'vault',
    'graphql', 'graphql_public', 'supabase_migrations', 'extensions',
}

def schema_of(text):
    m = re.match(r'(\w+)\.', text)
    return m.group(1) if m else None

def should_skip(schema):
    return schema and schema.lower() in SKIP_SCHEMAS

def process(input_path, output_path):
    with open(input_path, encoding='utf-8') as f:
        lines = f.readlines()

    out = []
    skip_copy  = False   # inside a COPY block for a skipped schema
    skip_stmt  = False   # inside a multi-line SQL statement for a skipped schema

    for line in lines:
        s = line.strip()

        # --- Neon-specific meta-command ---
        if s.startswith('\\restrict'):
            continue

        # --- Inside a COPY data block for a skipped schema ---
        if skip_copy:
            if s == '\\.':
                skip_copy = False
            continue

        # --- Inside a multi-line SQL statement for a skipped schema ---
        if skip_stmt:
            if ';' in line:
                skip_stmt = False
            continue

        # --- COPY <schema>.<table> ---
        m = re.match(r'^COPY\s+(\w+)\.', s)
        if m and should_skip(m.group(1)):
            skip_copy = True
            continue

        # --- CREATE SCHEMA <name> ---
        m = re.match(r'^CREATE SCHEMA\s+(?:IF NOT EXISTS\s+)?(\w+)\s*;', s)
        if m and should_skip(m.group(1)):
            continue

        # --- Multi-keyword DDL: CREATE TABLE/INDEX/SEQUENCE/TRIGGER/POLICY,
        #     ALTER TABLE/SEQUENCE, CREATE OR REPLACE FUNCTION/TRIGGER ---
        m = (
            re.match(r'^CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX|SEQUENCE|TRIGGER|POLICY)\s+(?:IF NOT EXISTS\s+)?(?:ONLY\s+)?(\w+)\.', s) or
            re.match(r'^CREATE\s+OR\s+REPLACE\s+(?:FUNCTION|TRIGGER|PROCEDURE)\s+(\w+)\.', s) or
            re.match(r'^ALTER\s+(?:TABLE|SEQUENCE|INDEX)\s+(?:ONLY\s+)?(\w+)\.', s) or
            re.match(r'^DROP\s+\S+\s+(?:IF EXISTS\s+)?(\w+)\.', s)
        )
        if m and should_skip(m.group(1)):
            skip_stmt = ';' not in line
            continue

        # --- Single-line GRANT/REVOKE on skipped schema objects ---
        m = re.match(r'^(?:GRANT|REVOKE)\s+.+\s+ON\s+(?:TABLE|SEQUENCE|FUNCTION|SCHEMA)?\s*(\w+)(?:\.|\s)', s)
        if m and should_skip(m.group(1)):
            if ';' not in line:
                skip_stmt = True
            continue

        out.append(line)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.writelines(out)

    print(f"Done: {len(lines)} lines in → {len(out)} lines out", file=sys.stderr)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: filter_dump.py <input.sql> <output.sql>", file=sys.stderr)
        sys.exit(1)
    process(sys.argv[1], sys.argv[2])
