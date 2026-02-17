"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface InviteSectionProps {
  organizationId: string;
}

export function InviteSection({ organizationId }: InviteSectionProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "estimator">("estimator");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const result = await authClient.organization.inviteMember({
        email,
        // biome-ignore lint/suspicious/noExplicitAny: custom roles (owner/estimator) not in built-in union type
        role: role as any,
        organizationId,
      });
      if (result.error) {
        setMessage(result.error.message ?? "Failed to send invitation.");
        setStatus("error");
      } else {
        setMessage(`Invitation sent to ${email}.`);
        setStatus("success");
        setEmail("");
      }
    } catch {
      setMessage("An unexpected error occurred. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-lg bg-white px-8 py-6 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Invite Team Member
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="invite-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="colleague@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="invite-role"
            className="block text-sm font-medium text-gray-700"
          >
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "owner" | "estimator")}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="estimator">Estimator</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        {message && (
          <p
            className={`rounded-md px-3 py-2 text-sm ${
              status === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Sending..." : "Send Invitation"}
        </button>
      </form>
    </div>
  );
}
