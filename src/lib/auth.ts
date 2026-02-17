import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { db } from "./db";
import { sendInvitationEmail } from "./email";

const statement = {
  quote: ["create", "read", "update", "delete", "share"],
} as const;

const ac = createAccessControl(statement);

const owner = ac.newRole({
  quote: ["create", "read", "update", "delete", "share"],
});

const estimator = ac.newRole({
  quote: ["create", "read", "update"],
});

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [
    organization({
      ac,
      roles: { owner, estimator },
      creatorRole: "owner",
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        await sendInvitationEmail({
          to: data.email,
          inviterName: data.inviter?.user?.name || "A team member",
          organizationName: data.organization.name,
          inviteLink,
        });
      },
    }),
    nextCookies(), // MUST be last plugin
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});

export type Session = typeof auth.$Infer.Session;
