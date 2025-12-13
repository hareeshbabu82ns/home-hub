import { getUserAuth } from "@/lib/auth/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Key, Smartphone } from "lucide-react";
import { ChangePasswordDialog } from "@/components/account/ChangePasswordDialog";

export default async function SecurityPage() {
  await getUserAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Security</h1>
          <p className="text-muted-foreground">
            Manage your password and security settings
          </p>
        </div>
      </div>

      {/* Security Settings */}
      <div className="space-y-6">
        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password
            </CardTitle>
            <CardDescription>
              Change your password or update security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChangePasswordDialog />
            <p className="text-muted-foreground text-sm">
              Last changed: Never (using OAuth)
            </p>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">SMS Authentication</p>
                <p className="text-muted-foreground text-xs">
                  Receive codes via text message
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Authenticator App</p>
                <p className="text-muted-foreground text-xs">
                  Use an authenticator app for codes
                </p>
              </div>
              <Button variant="outline" size="sm">
                Setup
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
            <CardDescription>
              Monitor and manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent Activity</p>
              <p className="text-muted-foreground text-xs">
                Last sign in: Today at 2:30 PM
              </p>
            </div>
            <Button variant="outline">View Activity Log</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
