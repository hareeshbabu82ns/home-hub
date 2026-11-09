/**
 * Registration Policy Service
 * Contains business logic for registration policy management
 * Uses repositories for data access
 */

import { registrationPolicyRepository } from "@/lib/db/repositories";
import type { $Enums } from "@/app/generated/prisma";

type RegistrationPolicyType = $Enums.RegistrationPolicyType;

class RegistrationPolicyService {
  /**
   * Get policy by ID
   */
  async getById(id: string) {
    return registrationPolicyRepository.findById(id);
  }

  /**
   * Get all policies
   */
  async getAll() {
    return registrationPolicyRepository.findAll();
  }

  /**
   * Create new policy
   */
  async create(data: {
    type: RegistrationPolicyType;
    value: string;
    isAllowed: boolean;
  }) {
    // Check if policy already exists
    const existing = await registrationPolicyRepository.findByTypeAndValue(
      data.type,
      data.value,
    );

    if (existing) {
      throw new Error("Policy already exists");
    }

    return registrationPolicyRepository.create(data);
  }

  /**
   * Update policy
   */
  async update(
    id: string,
    data: {
      type?: RegistrationPolicyType;
      value?: string;
      isAllowed?: boolean;
    },
  ) {
    return registrationPolicyRepository.update(id, data);
  }

  /**
   * Delete policy
   */
  async delete(id: string) {
    return registrationPolicyRepository.delete(id);
  }

  /**
   * Check if email is allowed
   */
  async isEmailAllowed(email: string): Promise<boolean> {
    const policies = await this.getAll();

    // Check email-specific policy
    const emailPolicy = policies.find(
      (p) =>
        p.type === "EMAIL" && p.value.toLowerCase() === email.toLowerCase(),
    );
    if (emailPolicy) {
      return emailPolicy.isAllowed;
    }

    // Check domain policy
    const domain = email.split("@")[1];
    const domainPolicy = policies.find(
      (p) =>
        p.type === "DOMAIN" && p.value.toLowerCase() === domain?.toLowerCase(),
    );
    if (domainPolicy) {
      return domainPolicy.isAllowed;
    }

    // If no policy found, allow by default
    return true;
  }
}

export const registrationPolicyService = new RegistrationPolicyService();
