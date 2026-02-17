import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { InviteSection } from "./invite-section";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const activeOrgId = session?.session?.activeOrganizationId ?? null;

  let organization = null;
  let members: Array<{
    id: string;
    role: string;
    user: { name: string; email: string };
  }> = [];

  if (activeOrgId) {
    const orgResult = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (orgResult) {
      organization = orgResult;
      members = orgResult.members.map((m) => ({
        id: m.id,
        role: m.role,
        user: { name: m.user.name, email: m.user.email },
      }));
    }
  }

  const isOwner =
    organization !== null &&
    members.some(
      (m) => m.user.email === session?.user.email && m.role === "owner",
    );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-200">
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Welcome to Paintr
          </h1>
          <p className="mb-4 text-sm text-gray-500">
            Signed in as{" "}
            <span className="font-medium text-gray-700">
              {session?.user.email}
            </span>
          </p>

          {organization ? (
            <p className="mb-6 text-sm text-gray-700">
              Organization:{" "}
              <span className="font-semibold">{organization.name}</span>
            </p>
          ) : (
            <div className="mb-6">
              <p className="mb-3 text-sm text-gray-500">
                You are not part of any organization yet.
              </p>
              <Link
                href="/create-org"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Organization
              </Link>
            </div>
          )}

          <SignOutButton />
        </div>

        {organization && isOwner && (
          <InviteSection organizationId={organization.id} />
        )}

        {organization && members.length > 0 && (
          <div className="rounded-lg bg-white px-8 py-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Team Members
            </h2>
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {m.user.name}
                    </p>
                    <p className="text-xs text-gray-500">{m.user.email}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
