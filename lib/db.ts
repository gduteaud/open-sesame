import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
  drizzleDb: DB | undefined;
};

function getPostgres() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForDb.postgresClient) {
    globalForDb.postgresClient = postgres(url, {
      prepare: false,
      max: 1,
    });
  }
  return globalForDb.postgresClient;
}

function getDbInstance(): DB {
  if (!globalForDb.drizzleDb) {
    globalForDb.drizzleDb = drizzle(getPostgres(), { schema });
  }
  return globalForDb.drizzleDb;
}

/** Lazy DB proxy so importing this module does not require DATABASE_URL at build time. */
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDbInstance();
    const value: unknown = (real as unknown as Record<string | symbol, unknown>)[
      prop
    ];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(real);
    }
    return value;
  },
});
