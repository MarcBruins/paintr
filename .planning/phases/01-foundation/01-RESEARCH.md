# Phase 1: Foundation - Research

**Researched:** 2026-02-17
**Domain:** Authentication, multi-tenant authorization, Postgres RLS, Next.js 16 app setup
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create an account with email and password | Better Auth `emailAndPassword` plugin; `auth.api.signUpEmail` + `auth.api.signInEmail` |
| AUTH-02 | User session persists across browser refresh | Better Auth cookie-based session with optional `cookieCache`; session validated server-side via `auth.api.getSession({ headers: await headers() })` |
| AUTH-03 | User can create or join a team (organization) | Better Auth `organization` plugin; `authClient.organization.create()` and `acceptInvitation()` flows |
| AUTH-04 | Team owner can invite members via email | Better Auth `organization` plugin `sendInvitationEmail` callback; `authClient.organization.inviteMember()` |
| AUTH-05 | Team members see shared quotes within their organization | Supabase RLS policy filtering by `organization_id`; all business tables include `organization_id` column with index |
| AUTH-06 | Role-based access: owner (full access) and estimator (create/edit quotes) | Better Auth `createAccessControl` + `ac.newRole` for custom `estimator` role alongside `owner` |
</phase_requirements>

---

## Summary

This phase establishes the complete secure foundation: user accounts, organization multi-tenancy, role-based access, and row-level data isolation. The stack is pre-decided and well-integrated: **Better Auth 1.4** handles authentication and organization management; **Drizzle ORM** connects to **Supabase Postgres** (Frankfurt) with **Supabase RLS** enforcing tenant isolation at the database layer; **Next.js 16** with the app router provides the server-rendered frontend.

The two highest-complexity integration points are (1) the schema generation workflow — Better Auth's CLI generates Drizzle schema for auth tables, while application tables must be hand-authored with matching column references — and (2) RLS policy design, where Postgres policies must correctly extract the active organization from JWT claims or a `set_config` transaction variable, and must be tested from the client SDK (not the SQL editor, which bypasses RLS).

Next.js 16 introduces important structural changes compared to 15: `middleware.ts` is now `proxy.ts`, all dynamic APIs (`cookies()`, `headers()`, `params`) are fully async (no sync compatibility shim), and Turbopack is the default build tool. These are not optional — building without handling them will fail.

**Primary recommendation:** Generate all auth schema via `npx @better-auth/cli@latest generate`, run Drizzle migrations, add `organization_id` columns to all business tables with RLS policies, and validate isolation from the Supabase client SDK before shipping.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | 1.4.x | Authentication, sessions, organization plugin | GDPR-compliant; self-hosted PII; built-in org/invite flow; Drizzle adapter |
| drizzle-orm | 0.45.x | Type-safe ORM for Postgres | Better Auth ships Drizzle adapter; schema-as-code; migration tooling |
| drizzle-kit | 0.31.x | Migration CLI for Drizzle | Generates/applies migrations; required companion to drizzle-orm |
| postgres (npm) | 3.x | Postgres driver for Drizzle | Official recommendation for Drizzle + Supabase |
| next | 16.x | App framework | Pre-decided; React 19.2 support; app router; proxy (ex-middleware) |
| react | 19.2 | UI runtime | Ships with Next.js 16; stable compiler support |
| typescript | 5.7+ | Type safety | Minimum 5.1 required by Next.js 16 |
| tailwindcss | 4.x | Utility CSS | Pre-decided; zero-config auto-discovery; CSS-native config |
| @tailwindcss/postcss | 4.x | PostCSS plugin for Tailwind v4 | Required for v4 integration with PostCSS pipeline |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @biomejs/biome | latest | Linting + formatting (replaces ESLint + Prettier) | All JS/TS files; 10–25x faster than ESLint + Prettier combined |
| shadcn/ui | latest CLI | Pre-built accessible UI components | Use `pnpm dlx shadcn@latest add [component]` per component |
| vitest | latest | Unit and integration testing | Pre-decided; fast, TypeScript-native |
| @better-auth/cli | latest | Schema generation for auth tables | Run before every DB migration when auth config changes |
| resend / nodemailer | any | Transactional email for invitations | Required by Better Auth `sendInvitationEmail`; any SMTP/API provider works |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | Clerk | Clerk is faster to setup but stores PII externally — rejected for GDPR |
| Better Auth | NextAuth v5 | NextAuth lacks built-in organization/invite flow; would require hand-rolling |
| Supabase RLS | Application-layer filtering | App-layer filtering requires every query to be correct; RLS enforces at DB level unconditionally |
| Drizzle | Prisma | Drizzle adapter is first-class in Better Auth; Prisma adapter is also available but less maintained |

### Installation

```bash
# Core
pnpm add better-auth drizzle-orm postgres
pnpm add -D drizzle-kit @biomejs/biome

# shadcn/ui (run once to initialize)
pnpm dlx shadcn@latest init

# Tailwind v4
pnpm add tailwindcss @tailwindcss/postcss postcss

# Email (choose one provider)
pnpm add resend
# or: pnpm add nodemailer @types/nodemailer
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts          # Better Auth catch-all handler
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── accept-invitation/[id]/page.tsx
│   ├── (app)/                        # Protected routes (checked via auth.api.getSession)
│   │   ├── layout.tsx                # Server-side session gate
│   │   └── dashboard/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── auth.ts                       # Better Auth server instance (single source of truth)
│   ├── auth-client.ts                # Better Auth browser client
│   └── db/
│       ├── index.ts                  # Drizzle db instance
│       └── schema/
│           ├── auth.ts               # Generated by @better-auth/cli (do not hand-edit)
│           └── app.ts                # Hand-authored application tables (quotes, etc.)
├── components/
│   └── ui/                          # shadcn/ui components (copied, not imported from package)
├── proxy.ts                          # Next.js 16 proxy (was middleware.ts in v15)
└── drizzle.config.ts
```

### Pattern 1: Better Auth Server Instance

**What:** Single `auth` object in `src/lib/auth.ts` that configures all plugins and adapters. Imported everywhere on the server.

**When to use:** Always — it is the central config.

```typescript
// Source: https://www.better-auth.com/docs/installation
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAccessControl } from "better-auth/plugins/access";
import { db } from "./db";

// Define custom resource permissions
const statement = {
  quote: ["create", "read", "update", "delete", "share"],
} as const;

const ac = createAccessControl(statement);

// Custom roles for the painting business
const owner = ac.newRole({
  quote: ["create", "read", "update", "delete", "share"],
});

const estimator = ac.newRole({
  quote: ["create", "read", "update"],
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // usePlural: true, // if your schema uses plural table names
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      ac,
      roles: { owner, estimator },
      creatorRole: "owner",
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        // Send email via your provider (Resend, nodemailer, etc.)
        // data.email, data.inviter.user.name, data.organization.name
        await sendEmail({ to: data.email, inviteLink });
      },
    }),
    nextCookies(), // MUST be last plugin
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache; reduces DB hits
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

### Pattern 2: Better Auth Browser Client

**What:** Client instance with organization plugin configured. Used in client components.

```typescript
// Source: https://www.better-auth.com/docs/integrations/next
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient()],
});

export const { signIn, signUp, signOut, useSession, organization } = authClient;
```

### Pattern 3: Next.js 16 Route Handler

**What:** Catch-all API route that mounts Better Auth at `/api/auth/*`.

```typescript
// Source: https://www.better-auth.com/docs/integrations/next
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Pattern 4: Server Component Session Check

**What:** Reading session in React Server Components. In Next.js 16, `headers()` is async.

```typescript
// Source: https://www.better-auth.com/docs/integrations/next + Next.js 16 async APIs
// src/app/(app)/layout.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // headers() is fully async in Next.js 16 — must await
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
```

### Pattern 5: Next.js 16 Proxy (Route Guard)

**What:** `proxy.ts` replaces `middleware.ts`. Runs in Node.js runtime (not edge). Does lightweight cookie presence check only — NOT full session validation (do that in Server Components).

```typescript
// Source: https://nextjs.org/docs/app/guides/upgrading/version-16
// src/proxy.ts  (NOT middleware.ts — that name is deprecated in Next.js 16)
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Optimistic redirect: check for session cookie presence only
  // Full validation happens in protected Server Components
  const sessionCookie = request.cookies.get("better-auth.session_token");

  const isAuthRoute = request.nextUrl.pathname.startsWith("/sign-");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  if (!sessionCookie && !isAuthRoute && !isApiRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Pattern 6: Drizzle + Supabase Connection

**What:** Drizzle client configured for Supabase's Transaction pool mode.

```typescript
// Source: https://orm.drizzle.team/docs/connect-supabase
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// CRITICAL: { prepare: false } required for Supabase Transaction pool mode
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client, schema });
```

### Pattern 7: RLS Policy for Organization Isolation

**What:** Postgres RLS using `current_setting('request.jwt.claims')` to extract `activeOrganizationId` from the JWT, or using `app.current_org_id` set via `set_config` in a server transaction.

**Option A — JWT claims approach (recommended for Supabase projects using Supabase Auth):**
Since this project uses Better Auth (not Supabase Auth), Supabase's `auth.uid()` function will NOT have org data. Use Option B.

**Option B — `set_config` approach (correct for Better Auth + Supabase RLS):**

```typescript
// Server Action or API route wrapper — sets org context before queries
// src/lib/db/with-org-context.ts
import { db } from "./index";
import { sql } from "drizzle-orm";

export async function withOrgContext<T>(
  organizationId: string,
  fn: () => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Set org context for the duration of this transaction
    await tx.execute(
      sql`SELECT set_config('app.current_org_id', ${organizationId}, TRUE)`
    );
    return await fn();
  });
}
```

```sql
-- SQL: Enable RLS and create isolation policy
-- Run via Supabase SQL editor or drizzle migration
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON quotes
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id', TRUE)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_org_id', TRUE)::uuid);

-- Index the org column for policy performance
CREATE INDEX idx_quotes_organization_id ON quotes(organization_id);
```

```typescript
// Drizzle schema with RLS policy defined in code
// Source: https://orm.drizzle.team/docs/rls
import { pgTable, uuid, text, timestamp, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    pgPolicy("org_isolation", {
      for: "all",
      using: sql`${table.organizationId} = current_setting('app.current_org_id', true)::uuid`,
      withCheck: sql`${table.organizationId} = current_setting('app.current_org_id', true)::uuid`,
    }),
  ]
);
```

### Pattern 8: Schema Generation Workflow

**What:** Two-phase schema management — Better Auth CLI generates auth tables, Drizzle Kit manages migrations.

```bash
# Step 1: Generate Better Auth schema (auth tables, org tables, etc.)
npx @better-auth/cli@latest generate
# Writes to: src/lib/db/schema/auth.ts (do not hand-edit this file)

# Step 2: Generate Drizzle migration
npx drizzle-kit generate

# Step 3: Apply migration to Supabase
npx drizzle-kit migrate
```

### Pattern 9: Tailwind v4 + PostCSS Setup

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

```css
/* src/app/globals.css — single import replaces all v3 directives */
@import "tailwindcss";

/* CSS-based configuration (no tailwind.config.js needed in v4) */
@theme {
  --color-brand: #your-brand-color;
}
```

### Pattern 10: Biome Configuration

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "ignoreUnknown": false,
    "ignore": ["node_modules", ".next", "src/lib/db/schema/auth.ts"]
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  }
}
```

```json
// package.json scripts
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

### Anti-Patterns to Avoid

- **Using Supabase Auth alongside Better Auth:** The project uses Better Auth exclusively. Do not enable Supabase Auth. `auth.uid()` in Supabase RLS will not work — use `set_config` pattern instead.
- **Testing RLS from the Supabase SQL editor:** The SQL editor runs as a superuser and bypasses all RLS policies. Always test from a client connection with a normal role.
- **Checking sessions only in `proxy.ts`:** The proxy does a cookie presence check only. Every server-rendered protected page must independently call `auth.api.getSession()`.
- **Using `middleware.ts` in Next.js 16:** The file must be named `proxy.ts` and the export must be named `proxy`. The old name is deprecated and will generate warnings/errors.
- **Forgetting `prepare: false` for Supabase pooler:** Supabase's Transaction pool mode rejects prepared statements. The Drizzle client must be initialized with `{ prepare: false }`.
- **Using `sync` cookies/headers in Next.js 16:** `cookies()`, `headers()`, and route `params` are fully async. Synchronous access was removed — always `await`.
- **Hand-editing `src/lib/db/schema/auth.ts`:** The Better Auth CLI overwrites this file. Put all customizations in `src/lib/db/schema/app.ts`.
- **Enabling webpack customizations with Next.js 16 Turbopack:** Next.js 16 defaults to Turbopack for builds. Custom webpack config causes build failure. Migrate to Turbopack-compatible options or pass `--webpack` explicitly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT + cookie logic | Better Auth built-in session | Handles rotation, revocation, cookie signing, CSRF |
| Organization invitations | Custom invite table + email flow | Better Auth organization plugin | Handles token generation, expiry, accept/reject states |
| Role-based access | Custom roles middleware | Better Auth `createAccessControl` + `ac.newRole` | Handles permission intersection, type inference |
| Multi-tenant data isolation | Application-level WHERE clauses | Supabase RLS policies | App-layer isolation requires every query to be correct; RLS enforces unconditionally at DB |
| Auth schema migrations | Manual SQL CREATE TABLE | Better Auth CLI + Drizzle Kit | Keeps auth schema in sync with plugin configuration |
| UI components | Custom forms, modals, inputs | shadcn/ui components | Accessible, keyboard-navigable, Tailwind v4 compatible |
| Email delivery | Custom SMTP client | Resend or Nodemailer | Handles retries, deliverability, unsubscribe headers |

**Key insight:** The authentication domain has enormous surface area for subtle security bugs. Better Auth's job is to handle session security correctly; your job is to configure it correctly and wire up the database.

---

## Common Pitfalls

### Pitfall 1: `middleware.ts` Name in Next.js 16

**What goes wrong:** Build warnings or silent failures when using the old `middleware.ts` filename; the proxy functionality may not execute.
**Why it happens:** Next.js 16 renamed the convention. The old name is deprecated.
**How to avoid:** Always create `proxy.ts` with a named export `proxy`. Use the Next.js 16 codemod (`npx @next/codemod@canary upgrade latest`) to automate migration.
**Warning signs:** Missing route protection; no console output from the proxy function.

### Pitfall 2: Supabase Transaction Pool + Prepared Statements

**What goes wrong:** `error: prepared statement "..." does not exist` at runtime.
**Why it happens:** Supabase's Supavisor in Transaction pool mode rotates underlying connections between requests. Prepared statements are bound to a specific connection and cannot be found on the next query.
**How to avoid:** Always initialize the postgres client with `{ prepare: false }` when using Supabase's pooler connection string.
**Warning signs:** Works in development (direct connection), fails in production (pooler connection).

### Pitfall 3: RLS Not Enabled on New Tables

**What goes wrong:** All rows visible to all users despite security intent.
**Why it happens:** Supabase creates tables with RLS disabled by default.
**How to avoid:** Every business table must have `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;` and at least one policy. Use Drizzle's `pgPolicy` in the schema definition and verify via `SELECT relrowsecurity FROM pg_class WHERE relname = 'your_table';`.
**Warning signs:** Cross-tenant data leakage; easier to catch with integration tests that authenticate as Tenant A and attempt to read Tenant B's data.

### Pitfall 4: Testing RLS from the SQL Editor

**What goes wrong:** Policies appear to work in the SQL editor but data leaks in the application.
**Why it happens:** The Supabase SQL editor connects as a database superuser (`postgres` role) which bypasses all RLS policies.
**How to avoid:** Test RLS using the Supabase client SDK with the anon or authenticated role, or via a server action that sets the correct `set_config` context.
**Warning signs:** "Policies look fine" but tests show cross-tenant access.

### Pitfall 5: Async Headers/Cookies in Next.js 16

**What goes wrong:** TypeScript errors or runtime errors on `cookies()`, `headers()`, or `params` access.
**Why it happens:** Next.js 16 fully removed the synchronous compatibility shim that existed in v15. These APIs now only return Promises.
**How to avoid:** Always `await headers()` and `await cookies()` in Server Components and Server Actions. Run `npx next typegen` to get type-safe async helpers.
**Warning signs:** TypeScript errors saying `Property 'get' does not exist on type 'Promise<...>'`.

### Pitfall 6: Better Auth Cookie Cache and Revoked Sessions

**What goes wrong:** After a user is removed from an organization, they can still access protected resources until the cookie cache expires.
**Why it happens:** The `cookieCache` stores session data in a signed cookie client-side; server cannot invalidate it immediately.
**How to avoid:** Use a short `maxAge` (5 minutes). For sensitive operations (org deletion, member removal), call `auth.api.revokeSession` which will work once the cache expires. Consider `disableCookieCache: true` if immediate revocation is required.
**Warning signs:** Removed members still accessing org resources during the cache window.

### Pitfall 7: Better Auth CLI Overwrites Schema

**What goes wrong:** Custom additions to the auth schema file are lost on next `generate` run.
**Why it happens:** `npx @better-auth/cli@latest generate` overwrites the output schema file.
**How to avoid:** Keep auth-generated schema in `src/lib/db/schema/auth.ts` (never edit). Put all custom application tables in `src/lib/db/schema/app.ts`. Export all schemas from an `index.ts` barrel.
**Warning signs:** Drizzle relations or custom columns disappear after re-running the CLI.

### Pitfall 8: Forgetting `nextCookies()` Plugin Last

**What goes wrong:** Server Actions that call Better Auth functions (sign-in, sign-up, etc.) don't set session cookies.
**Why it happens:** The `nextCookies` plugin intercepts Better Auth's response to inject cookies into Next.js's cookie store. It must be the last plugin in the array.
**How to avoid:** Always add `nextCookies()` as the final entry in the `plugins` array.
**Warning signs:** `auth.api.signInEmail` succeeds (returns user) but session cookie is not set; subsequent `getSession` returns null.

---

## Code Examples

Verified patterns from official sources:

### Better Auth Schema Generation Workflow

```bash
# Source: https://www.better-auth.com/docs/adapters/drizzle

# 1. Generate auth schema (run whenever auth config changes)
npx @better-auth/cli@latest generate

# 2. Generate Drizzle migration file
npx drizzle-kit generate

# 3. Apply migration
npx drizzle-kit migrate
```

### Organization Invite Flow (Client)

```typescript
// Source: https://www.better-auth.com/docs/plugins/organization

// Invite a member (owner/admin only)
await authClient.organization.inviteMember({
  email: "painter@example.com",
  role: "estimator",
  organizationId: currentOrgId,
});

// Accept invitation (called with the ID from the email link)
await authClient.organization.acceptInvitation({
  invitationId: invitationId, // from URL param: /accept-invitation/[id]
});

// Switch active organization
await authClient.organization.setActive({
  organizationId: orgId,
});
```

### Organization Create Flow (Client)

```typescript
// Source: https://www.better-auth.com/docs/plugins/organization

// Create a new organization (creator automatically becomes owner)
const { data } = await authClient.organization.create({
  name: "Smith Painting Co.",
  slug: "smith-painting-co",
});
```

### Protected Server Action with Org Context

```typescript
// Pattern: validate session + org membership + set RLS context
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function getOrgQuotes() {
  // Validate session
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");

  const orgId = session.session.activeOrganizationId;
  if (!orgId) throw new Error("No active organization");

  // Set RLS context and query within a transaction
  return await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_org_id', ${orgId}, TRUE)`
    );
    return await tx.select().from(quotes);
  });
}
```

### Drizzle Config for Supabase

```typescript
// Source: https://orm.drizzle.team/docs/connect-supabase
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` / `export function middleware` | `proxy.ts` / `export function proxy` | Next.js 16 (stable 2025) | Must rename file and function — old name deprecated |
| Synchronous `cookies()`, `headers()`, `params` | Async `await cookies()`, `await headers()`, `await params` | Next.js 16 (breaking from v15) | All server-side code touching these APIs must await |
| `experimental.turbopack` in next.config | `turbopack` at top level | Next.js 16 | Config key moved; Turbopack is now default for dev AND build |
| Tailwind `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 | Single CSS import; no tailwind.config.js required |
| Tailwind content paths in config | Zero-config auto-discovery | Tailwind v4 | No template path configuration needed |
| `passkey` plugin in better-auth | `@better-auth/passkey` separate package | Better Auth 1.4 | If adding passkeys later, use the separate package |
| `forgotPassword` auth flow | `requestPasswordReset` | Better Auth 1.4 | API endpoint name changed |
| Webpack custom config in Next.js | Turbopack config | Next.js 16 | Custom `webpack` config causes build failure in Next.js 16 Turbopack mode |

**Deprecated/outdated:**
- `tailwind.config.js`: Replaced by CSS `@theme {}` blocks in v4. Still works for v3 compatibility but not idiomatic for v4.
- `middleware.ts` in Next.js 16: Deprecated, replaced by `proxy.ts`.
- Supabase `auth.uid()` in RLS with Better Auth: Does not apply — Better Auth is not Supabase Auth. Use `set_config` approach.

---

## Open Questions

1. **Email provider for invitations**
   - What we know: Better Auth requires a `sendInvitationEmail` callback; any email provider works
   - What's unclear: Which provider (Resend, nodemailer + SMTP, etc.) is preferred for this project
   - Recommendation: Default to Resend for simplicity in development; make it swappable via environment variables

2. **RLS: `set_config` vs JWT claims approach**
   - What we know: Better Auth is NOT Supabase Auth, so `auth.uid()` is unavailable. `set_config` pattern works and is confirmed for Drizzle transactions.
   - What's unclear: Whether passing organization ID via a verified middleware (proxy) claim would be more ergonomic
   - Recommendation: Use `set_config` within server-side transactions. Document this clearly in the codebase. Do not pass `organization_id` via untrusted client headers.

3. **Connection string: pooler vs direct**
   - What we know: Transaction pool mode requires `{ prepare: false }`. Direct connection (port 5432) doesn't have this limitation.
   - What's unclear: For local development, which connection mode to use
   - Recommendation: Use the Supabase pooler connection string (port 6543) in all environments with `{ prepare: false }`. Keep the direct connection string in `.env.local` for Drizzle Kit migrations only (some migration operations require direct connections).

4. **Biome vs Next.js 16 lint pipeline**
   - What we know: Next.js 16 removed `next lint` command; `next build` no longer runs linting. Biome replaces ESLint + Prettier.
   - What's unclear: Whether `@next/eslint-plugin-next` rules need to be replicated in Biome
   - Recommendation: Install Biome with recommended rules. The critical Next.js-specific lint rules (no `<img>` without `next/image`, no missing `key` props) are largely covered by Biome's recommended ruleset. Run `biome check .` in CI.

5. **Better Auth `getSession` null returns in Next.js 16 with `use cache`**
   - What we know: There is a documented GitHub issue (#5584, #7008) where `auth.api.getSession` returns null when called inside `use cache` boundaries with cookie cache enabled.
   - What's unclear: Whether this is resolved in Better Auth 1.4.x
   - Recommendation: Do not call `getSession` inside `use cache` blocks. Call it outside the cache boundary in layout files and pass the result as props.

---

## Sources

### Primary (HIGH confidence)

- `https://www.better-auth.com/docs/installation` — Better Auth installation, env vars, route handler
- `https://www.better-auth.com/docs/integrations/next` — Next.js integration, getSession pattern, proxy.ts
- `https://www.better-auth.com/docs/plugins/organization` — Organization plugin, roles, invitation flow, custom RBAC
- `https://www.better-auth.com/docs/adapters/drizzle` — Drizzle adapter, schema generation, experimental joins
- `https://www.better-auth.com/docs/concepts/session-management` — Cookie cache, session persistence
- `https://www.better-auth.com/blog/1-4` — Better Auth 1.4 changes, breaking changes
- `https://nextjs.org/docs/app/guides/upgrading/version-16` — Next.js 16 breaking changes (official, last updated 2026-02-11)
- `https://orm.drizzle.team/docs/connect-supabase` — Drizzle + Supabase connection, `prepare: false` requirement
- `https://orm.drizzle.team/docs/rls` — Drizzle RLS policies, pgPolicy syntax, set_config pattern
- `https://tailwindcss.com/docs/guides/nextjs` — Tailwind v4 official Next.js guide

### Secondary (MEDIUM confidence)

- `https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/` — RLS tenant isolation SQL patterns, confirmed against official Supabase docs
- `https://ui.shadcn.com/docs/installation/next` — shadcn/ui init command
- `https://www.timsanteford.com/posts/how-to-use-biome-with-next-js-for-linting-and-formatting/` — Biome config for Next.js, verified against biomejs.dev

### Tertiary (LOW confidence)

- GitHub issues better-auth/better-auth #5584, #7008 — `getSession` null in `use cache` context; unresolved status unknown, flag for validation during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all verified against official docs and Context7 sources
- Architecture: HIGH — patterns sourced from official Better Auth and Next.js 16 documentation
- Pitfalls: HIGH — pitfalls 1–5 are from official documentation; pitfalls 6–8 from official docs + GitHub issues
- RLS pattern (set_config): MEDIUM — Drizzle RLS docs confirm the approach; the specific `app.current_org_id` variable name and the Better Auth integration specifics require validation during implementation

**Research date:** 2026-02-17
**Valid until:** 2026-03-19 (30 days; Next.js and Better Auth release frequently — check changelogs before planning if delayed)
