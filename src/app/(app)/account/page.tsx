import UserSettings from "./UserSettings";
import { getUserAuth } from "@/lib/auth/utils";

export default async function ProfilePage() {
  const { session } = await getUserAuth();

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
