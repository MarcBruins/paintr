import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: env var is required at runtime
    url: process.env.DATABASE_URL_DIRECT!,
  },
} satisfies Config;
