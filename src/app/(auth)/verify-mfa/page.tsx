import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getPendingMfaUser } from "@/lib/auth/utils";

import { VerifyMfaForm } from "./verify-mfa-form";

export const metadata = { title: "Two-factor verification" };

export default async function VerifyMfaPage() {
  const pending = await getPendingMfaUser();
  if (!pending) redirect((await auth()) ? "/dashboard" : "/sign-in");
  return <VerifyMfaForm email={pending.email} />;
}
