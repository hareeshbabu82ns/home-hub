/**
 * useRegistrationPolicies Hook
 * Manages registration policy state and operations
 */

import { useState, useCallback } from "react";
import {
  getRegistrationPolicies,
  addRegistrationPolicy,
  updateRegistrationPolicy,
  deleteRegistrationPolicy,
} from "@/lib/actions/admin";
import { toast } from "sonner";

interface RegistrationPolicy {
  id: string;
  type: string;
  value: string;
  isAllowed: boolean;
  createdAt: Date;
}

interface ActionResult {
  success?: boolean;
  error?: string;
  policy?: RegistrationPolicy;
}

type PolicyFormData = {
  type: "DOMAIN" | "EMAIL";
  value: string;
  isAllowed: boolean;
};

export function useRegistrationPolicies() {
  const [policies, setPolicies] = useState<RegistrationPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await getRegistrationPolicies()) as {
        success?: boolean;
        policies?: RegistrationPolicy[];
      };
      if (result.success && result.policies) {
        setPolicies(result.policies);
      }
    } catch (_error) {
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddPolicy = useCallback(
    async (formData: PolicyFormData) => {
      setSubmitting(true);
      try {
        const result = (await addRegistrationPolicy(formData)) as ActionResult;

        if (result.success && result.policy) {
          setPolicies([result.policy, ...policies]);
          toast.success("Policy added successfully");
          return true;
        } else {
          toast.error(result.error || "Failed to add policy");
          return false;
        }
      } catch (_error) {
        toast.error("Failed to add policy");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [policies],
  );

  const handleUpdatePolicy = useCallback(
    async (id: string, formData: PolicyFormData) => {
      setSubmitting(true);
      try {
        const result = (await updateRegistrationPolicy(
          id,
          formData,
        )) as ActionResult;

        if (result.success && result.policy) {
          setPolicies(
            policies.map((p) => (p.id === id ? result.policy || p : p)),
          );
          toast.success("Policy updated successfully");
          return true;
        } else {
          toast.error(result.error || "Failed to update policy");
          return false;
        }
      } catch (_error) {
        toast.error("Failed to update policy");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [policies],
  );

  const handleDeletePolicy = useCallback(
    async (policyId: string) => {
      setSubmitting(true);
      try {
        const result = (await deleteRegistrationPolicy(
          policyId,
        )) as ActionResult;

        if (result.success) {
          setPolicies(policies.filter((p) => p.id !== policyId));
          toast.success("Policy deleted successfully");
        } else {
          toast.error(result.error || "Failed to delete policy");
        }
      } catch (_error) {
        toast.error("Failed to delete policy");
      } finally {
        setSubmitting(false);
      }
    },
    [policies],
  );

  return {
    policies,
    loading,
    submitting,
    loadPolicies,
    handleAddPolicy,
    handleUpdatePolicy,
    handleDeletePolicy,
  };
}
