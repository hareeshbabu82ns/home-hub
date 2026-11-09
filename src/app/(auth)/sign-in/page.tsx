import { getOAuthProviders } from "@/lib/actions/auth";

import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  return <SignInForm providers={await getOAuthProviders()} />;
}
