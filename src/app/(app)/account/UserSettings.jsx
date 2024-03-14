"use client";
import UpdateNameCard from "./UpdateNameCard";
import UpdateEmailCard from "./UpdateEmailCard";

export default function UserSettings({ session }) {
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
