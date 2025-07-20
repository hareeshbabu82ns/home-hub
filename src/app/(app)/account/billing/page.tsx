import { getUserAuth } from "@/lib/auth/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download, Receipt } from "lucide-react";

export default async function BillingPage() {
  await getUserAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your billing information and subscriptions
          </p>
        </div>
      </div>

      {/* Billing Information */}
      <div className="space-y-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your current subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">Free Plan</p>
                <p className="text-muted-foreground text-sm">
                  Basic features with limited usage
                </p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex gap-2">
              <Button>Upgrade Plan</Button>
              <Button variant="outline">View Plans</Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription>Manage your payment methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground text-sm">
              No payment method on file
            </div>
            <Button variant="outline">Add Payment Method</Button>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              Download your invoices and billing history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-muted-foreground text-sm">
              No billing history available
            </div>
            <Button variant="outline" disabled>
              Download Invoices
            </Button>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>
              Monitor your current usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">API Calls</span>
                <span className="text-sm">0 / 1,000</span>
              </div>
              <div className="bg-secondary h-2 rounded-full">
                <div className="bg-primary h-2 w-0 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Storage</span>
                <span className="text-sm">0 MB / 1 GB</span>
              </div>
              <div className="bg-secondary h-2 rounded-full">
                <div className="bg-primary h-2 w-0 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
