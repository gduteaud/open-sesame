import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "node:path";

// Next.js reads `.env.local` for the app; drizzle-kit only loads `.env` by default.
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
