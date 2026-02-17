import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// biome-ignore lint/style/noNonNullAssertion: DATABASE_URL is required at runtime
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client, schema });
