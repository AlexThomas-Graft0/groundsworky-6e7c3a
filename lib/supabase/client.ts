import { createBrowserClient } from "@supabase/ssr";

// Per-build data schema. DuckByte generates each app into its own Postgres schema and sets
// NEXT_PUBLIC_DB_SCHEMA at build time, so every `.from(...)` query hits that schema, not public.
// Auth is unaffected (the db.schema option only scopes PostgREST, not the auth endpoints).
const schema = process.env.NEXT_PUBLIC_DB_SCHEMA;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    schema ? { db: { schema } } : undefined,
  );
}
