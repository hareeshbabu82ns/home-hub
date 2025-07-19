import { getUserAuth } from "@/lib/auth/utils";
import UpdateEmailCard from "../UpdateEmailCard";

export default async function EmailSettingsPage() {
  const { session } = await getUserAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Email Settings</h1>
          <p className="text-muted-foreground">
            Manage your email address and email preferences
          </p>
        </div>
      </div>

      {/* Email Settings */}
      <div className="space-y-6">
        <UpdateEmailCard
          name={session?.user.name ?? ""}
          email={session?.user.email ?? ""}
        />

        {/* Additional email preferences can be added here */}
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-medium">Email Notifications</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure when you want to receive email notifications
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Account updates</p>
                <p className="text-muted-foreground text-xs">
                  Important updates about your account
                </p>
              </div>
              {/* Switch component can be added here */}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Marketing emails</p>
                <p className="text-muted-foreground text-xs">
                  Promotional emails and newsletters
                </p>
              </div>
              {/* Switch component can be added here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
