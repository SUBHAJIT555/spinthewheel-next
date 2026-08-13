import postgres from "postgres";

/**
 * Server-only Postgres client for Supabase.
 * Prefer DATABASE_URL (pooled / transaction mode) on Vercel.
 * DIRECT_URL is optional (migrations / admin tools).
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "production") {
  console.warn(
    "[db] DATABASE_URL is not set. API routes that touch Postgres will fail.",
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __spin_sql__: ReturnType<typeof postgres> | undefined;
}

function createSql() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  return postgres(connectionString, {
    ssl: "require",
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

export function getSql() {
  if (process.env.NODE_ENV === "production") {
    return createSql();
  }

  if (!global.__spin_sql__) {
    global.__spin_sql__ = createSql();
  }
  return global.__spin_sql__;
}
