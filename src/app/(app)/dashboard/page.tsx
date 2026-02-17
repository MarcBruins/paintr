import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-200">
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Welcome to Paintr
          </h1>
          <p className="mb-8 text-sm text-gray-500">
            Signed in as{" "}
            <span className="font-medium text-gray-700">
              {session?.user.email}
            </span>
          </p>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
