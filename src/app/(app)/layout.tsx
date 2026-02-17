import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(), // MUST await headers() in Next.js 16
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
