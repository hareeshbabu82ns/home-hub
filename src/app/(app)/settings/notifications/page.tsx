"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground">
            Configure how and when you receive notifications
          </p>
        </div>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose which email notifications you&apos;d like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-security">Security alerts</Label>
              <p className="text-muted-foreground text-sm">
                Get notified when there are security-related activities
              </p>
            </div>
            <Switch id="email-security" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-updates">Product updates</Label>
              <p className="text-muted-foreground text-sm">
                Receive emails about new features and updates
              </p>
            </div>
            <Switch id="email-updates" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-marketing">Marketing emails</Label>
              <p className="text-muted-foreground text-sm">
                Receive emails about tips, best practices, and promotions
              </p>
            </div>
            <Switch id="email-marketing" />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Configure browser and mobile push notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled">Enable push notifications</Label>
              <p className="text-muted-foreground text-sm">
                Allow this app to send you push notifications
              </p>
            </div>
            <Switch id="push-enabled" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-reminders">Task reminders</Label>
              <p className="text-muted-foreground text-sm">
                Get reminded about pending tasks and deadlines
              </p>
            </div>
            <Switch id="push-reminders" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-mentions">Mentions and replies</Label>
              <p className="text-muted-foreground text-sm">
                Get notified when someone mentions or replies to you
              </p>
            </div>
            <Switch id="push-mentions" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Notification Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Schedule</CardTitle>
          <CardDescription>
            Set quiet hours and notification frequency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours">Enable quiet hours</Label>
              <p className="text-muted-foreground text-sm">
                Disable notifications during specified hours
              </p>
            </div>
            <Switch id="quiet-hours" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekend-pause">Weekend pause</Label>
              <p className="text-muted-foreground text-sm">
                Pause non-urgent notifications on weekends
              </p>
            </div>
            <Switch id="weekend-pause" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
