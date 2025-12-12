/**
 * Registration Policy Repository
 * Handles all database operations related to registration policies
 */

import { db } from "@/lib/db";
import type { $Enums } from "@/app/generated/prisma";

type RegistrationPolicyType = $Enums.RegistrationPolicyType;

export const registrationPolicyRepository = {
  // Find operations
  findById: async (id: string) => {
    return db.registrationPolicy.findUnique({
      where: { id },
    });
  },

  findAll: async () => {
    return db.registrationPolicy.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  findByTypeAndValue: async (type: RegistrationPolicyType, value: string) => {
    return db.registrationPolicy.findUnique({
      where: {
        type_value: { type, value },
      },
    });
  },

  // Create operations
  create: async (data: {
    type: RegistrationPolicyType;
    value: string;
    isAllowed: boolean;
  }) => {
    return db.registrationPolicy.create({
      data,
    });
  },

  // Update operations
  update: async (
    id: string,
    data: {
      type?: RegistrationPolicyType;
      value?: string;
      isAllowed?: boolean;
    },
  ) => {
    return db.registrationPolicy.update({
      where: { id },
      data,
    });
  },

  // Delete operations
  delete: async (id: string) => {
    return db.registrationPolicy.delete({
      where: { id },
    });
  },
};
