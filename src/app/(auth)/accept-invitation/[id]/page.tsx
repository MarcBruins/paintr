"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function accept() {
      const sessionResult = await authClient.getSession();
      if (!sessionResult.data?.session) {
        router.push(`/sign-in?redirect=/accept-invitation/${id}`);
        return;
      }

      try {
        const result = await authClient.organization.acceptInvitation({
          invitationId: id,
        });
        if (result.error) {
          setErrorMessage(
            result.error.message ??
              "This invitation may be expired or invalid.",
          );
          setStatus("error");
        } else if (result.data) {
          await authClient.organization.setActive({
            organizationId: result.data.member.organizationId,
          });
          router.push("/dashboard");
        }
      } catch {
        setErrorMessage("An unexpected error occurred. Please try again.");
        setStatus("error");
      }
    }

    accept();
  }, [id, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-md">
          <div className="rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Accepting your invitation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-md">
          <div className="rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-gray-200">
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">
              Invitation Error
            </h1>
            <p className="mb-6 text-sm text-red-600">{errorMessage}</p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
