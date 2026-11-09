"use client";

import { useEffect, useState } from "react";
import {
  getRegistrationPolicies,
  addRegistrationPolicy,
  deleteRegistrationPolicy,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, InfoIcon } from "lucide-react";
import { toast } from "sonner";

interface RegistrationPolicy {
  id: string;
  type: "DOMAIN" | "EMAIL";
  value: string;
  isAllowed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function RegistrationPage() {
  const [policies, setPolicies] = useState<RegistrationPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    policyId?: string;
  }>({ open: false });
  const [formData, setFormData] = useState({
    type: "DOMAIN",
    value: "",
    isAllowed: "true",
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  async function loadPolicies() {
    setLoading(true);
    const result = await getRegistrationPolicies();
    if (result.success && result.policies) {
      setPolicies(result.policies);
    }
    setLoading(false);
  }

  async function handleAddPolicy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const result = await addRegistrationPolicy({
      type: formData.type as "DOMAIN" | "EMAIL",
      value: formData.value,
      isAllowed: formData.isAllowed === "true",
    });

    setSubmitting(false);

    if (result.success && result.policy) {
      setPolicies([result.policy, ...policies]);
      setFormData({ type: "DOMAIN", value: "", isAllowed: "true" });
      toast.success("Policy added successfully");
    } else {
      toast.error(result.error || "Failed to add policy");
    }
  }

  async function handleDeletePolicy(policyId: string) {
    const result = await deleteRegistrationPolicy(policyId);
    setDeleteDialog({ open: false });

    if (result.success) {
      setPolicies(policies.filter((p) => p.id !== policyId));
      toast.success("Policy deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete policy");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Registration Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Use domain policies to allow entire domains, or email policies to
              allow specific email addresses. If any policies are defined, only
              whitelisted emails can register.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleAddPolicy} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOMAIN">Domain</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">
                  {formData.type === "DOMAIN"
                    ? "Domain (e.g., example.com)"
                    : "Email Address"}
                </Label>
                <Input
                  id="value"
                  placeholder={
                    formData.type === "DOMAIN"
                      ? "example.com"
                      : "user@example.com"
                  }
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Policy"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <p className="text-muted-foreground">
              No policies defined. All registrations are allowed.
            </p>
          ) : (
            <div className="space-y-2">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={policy.isAllowed ? "default" : "destructive"}
                    >
                      {policy.type}
                    </Badge>
                    <div>
                      <p className="font-medium">{policy.value}</p>
                      <p className="text-muted-foreground text-sm">
                        {policy.isAllowed ? "Allowed" : "Denied"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDeleteDialog({ open: true, policyId: policy.id })
                    }
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete policy?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.policyId &&
                handleDeletePolicy(deleteDialog.policyId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
