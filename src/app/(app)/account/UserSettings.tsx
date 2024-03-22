"use client";
import UpdateNameCard from "./UpdateNameCard";
import UpdateEmailCard from "./UpdateEmailCard";
import { AuthSession } from "@/lib/auth/utils";

export default function UserSettings({
  session,
}: {
  session: AuthSession["session"] | any;
}) {
  return (
    <>
      <UpdateNameCard name={session?.user.name ?? ""} />
      <UpdateEmailCard
        name={session?.user.name ?? ""}
        email={session?.user.email ?? ""}
      />
    </>
  );
}
