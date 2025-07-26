import UserSettings from "./UserSettings";
import { getUserAuth } from "@/lib/auth/utils";
import { Session } from "next-auth";

export default async function ProfilePage() {
  const { session: authSession } = await getUserAuth();

  // Create a properly typed Session object
  const session: Session | null = authSession
    ? {
        ...authSession,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Add required expires property
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and account details
          </p>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="space-y-6">
        <UserSettings session={session} />
      </div>
    </div>
  );
}
