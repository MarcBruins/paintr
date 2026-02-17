import { sql } from "drizzle-orm";
import { db } from "./index";

export async function withOrgContext<T>(
  organizationId: string,
  fn: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_org_id', ${organizationId}, TRUE)`,
    );
    return await fn(tx as unknown as typeof db);
  });
}
