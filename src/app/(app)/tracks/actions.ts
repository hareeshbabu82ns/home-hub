"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserAuth } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import type { TrackAttributeValueType } from "@/app/generated/prisma";
import type {
  TrackItemFilter,
  TrackAttributeFilter,
  TrackingMetrics,
  ChartDataPoint,
} from "@/types/track";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
} from "date-fns";

// Track Attributes
export const fetchTrackItemAttributes = async (trackId: string) => {
  const { session } = await getUserAuth();
  if (!session) return [];
  const trackAttributes = await db.trackAttributes.findMany({
    where: {
      userId: session.user.id,
      trackId,
    },
    orderBy: { createdAt: "desc" },
  });
  return trackAttributes;
};

export const fetchTrackAttributesWithFilters = async (
  trackId: string,
  filters?: TrackAttributeFilter,
) => {
  const { session } = await getUserAuth();
  if (!session) return [];

  const where: any = {
    userId: session.user.id,
    trackId,
  };

  if (filters) {
    if (filters.attributeTitle) {
      where.title = { contains: filters.attributeTitle, mode: "insensitive" };
    }
    if (filters.valueType) {
      where.valueType = filters.valueType;
    }
    if (filters.searchText) {
      where.OR = [
        { title: { contains: filters.searchText, mode: "insensitive" } },
        { value: { contains: filters.searchText, mode: "insensitive" } },
      ];
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = startOfDay(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = endOfDay(filters.dateTo);
      }
    }
    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      where.AND = [];
      if (filters.minValue !== undefined) {
        where.AND.push({
          OR: [
            { valueInt: { gte: filters.minValue } },
            { valueFloat: { gte: filters.minValue } },
          ],
        });
      }
      if (filters.maxValue !== undefined) {
        where.AND.push({
          OR: [
            { valueInt: { lte: filters.maxValue } },
            { valueFloat: { lte: filters.maxValue } },
          ],
        });
      }
    }
  }

  const trackAttributes = await db.trackAttributes.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return trackAttributes;
};

export const fetchTrackAttribute = async (id: string) => {
  const { session } = await getUserAuth();
  if (!session) return null;
  const track = await db.trackAttributes.findUniqueOrThrow({
    where: {
      id,
      userId: session.user.id,
    },
  });
  return track;
};

export async function createTrackItemAttribute(
  prevState: {
    message: string;
    success?: boolean;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Failed to create TrackItemAttribute" };
  }

  const schema = z.object({
    trackId: z.string().min(1).max(30),
    title: z.string().min(1).max(80),
    value: z.string().optional(),
    valueInt: z.number().optional(),
    valueFloat: z.number().optional(),
    valueDate: z.date().optional(),
    valueDuration: z.number().optional(),
    valueType: z.enum(["STRING", "INT", "FLOAT", "DATETIME", "DURATION"]),
  });

  // Parse and transform the form data based on valueType
  const valueType = formData.get("valueType") as string;
  const rawValue = formData.get("value") as string;
  const parsedData: any = {
    trackId: formData.get("trackId"),
    title: formData.get("title"),
    valueType: valueType as TrackAttributeValueType,
  };

  // Parse value based on type
  switch (valueType) {
    case "STRING":
      parsedData.value = rawValue;
      break;
    case "INT":
      if (rawValue) {
        const intValue = parseInt(rawValue);
        if (!isNaN(intValue)) {
          parsedData.valueInt = intValue;
        }
      }
      break;
    case "FLOAT":
      if (rawValue) {
        const floatValue = parseFloat(rawValue);
        if (!isNaN(floatValue)) {
          parsedData.valueFloat = floatValue;
        }
      }
      break;
    case "DATETIME":
      if (rawValue) {
        const dateValue = new Date(rawValue);
        if (!isNaN(dateValue.getTime())) {
          parsedData.valueDate = dateValue;
        }
      }
      break;
    case "DURATION":
      if (rawValue) {
        // Parse HH:MM format and convert to minutes
        const [hours, minutes] = rawValue.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          parsedData.valueDuration = hours * 60 + minutes;
        }
      }
      break;
  }

  const parse = schema.safeParse(parsedData);

  if (!parse.success) {
    return { message: "Invalid form data" };
  }

  const data = parse.data;

  try {
    await db.trackAttributes.create({
      data: {
        trackId: data.trackId,
        title: data.title,
        value: data.value,
        valueInt: data.valueInt,
        valueFloat: data.valueFloat,
        valueDate: data.valueDate,
        valueDuration: data.valueDuration,
        valueType: data.valueType,
        userId: session.user.id,
      },
    });

    revalidatePath("/tracks");
    return { message: `Added track attribute ${data.title}`, success: true };
  } catch (error) {
    console.error("Error creating track attribute:", error);
    return { message: "Failed to create track attribute", success: false };
  }
}

export async function updateTrackItemAttribute(
  prevState: {
    message: string;
    success?: boolean;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Failed to update TrackAttribute" };
  }

  const schema = z.object({
    id: z.string().min(1),
    trackId: z.string().min(1).max(30),
    title: z.string().min(1).max(80),
    value: z.string().optional(),
    valueInt: z.number().optional(),
    valueFloat: z.number().optional(),
    valueDate: z.date().optional(),
    valueDuration: z.number().optional(),
    valueType: z.enum(["STRING", "INT", "FLOAT", "DATETIME", "DURATION"]),
  });

  // Parse and transform the form data based on valueType
  const valueType = formData.get("valueType") as string;
  const rawValue = formData.get("value") as string;
  const parsedData: any = {
    id: formData.get("id"),
    trackId: formData.get("trackId"),
    title: formData.get("title"),
    valueType: valueType as TrackAttributeValueType,
  };

  // Parse value based on type
  switch (valueType) {
    case "STRING":
      parsedData.value = rawValue;
      break;
    case "INT":
      if (rawValue) {
        const intValue = parseInt(rawValue);
        if (!isNaN(intValue)) {
          parsedData.valueInt = intValue;
        }
      }
      break;
    case "FLOAT":
      if (rawValue) {
        const floatValue = parseFloat(rawValue);
        if (!isNaN(floatValue)) {
          parsedData.valueFloat = floatValue;
        }
      }
      break;
    case "DATETIME":
      if (rawValue) {
        const dateValue = new Date(rawValue);
        if (!isNaN(dateValue.getTime())) {
          parsedData.valueDate = dateValue;
        }
      }
      break;
    case "DURATION":
      if (rawValue) {
        // Parse HH:MM format and convert to minutes
        const [hours, minutes] = rawValue.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          parsedData.valueDuration = hours * 60 + minutes;
        }
      }
      break;
  }

  const parse = schema.safeParse(parsedData);

  if (!parse.success) {
    return { message: "Invalid form data" };
  }

  const data = parse.data;

  try {
    await db.trackAttributes.update({
      where: { id: data.id, userId: session.user.id },
      data: {
        title: data.title,
        value: data.value,
        valueInt: data.valueInt,
        valueFloat: data.valueFloat,
        valueDate: data.valueDate,
        valueDuration: data.valueDuration,
        valueType: data.valueType,
        userId: session.user.id,
      },
    });

    revalidatePath("/tracks");
    return { message: `Updated track attribute ${data.title}`, success: true };
  } catch (error) {
    console.error("Error updating track attribute:", error);
    return { message: "Failed to update track attribute", success: false };
  }
}

export async function deleteTrackItemAttribute(
  prevState: {
    message: string;
    success?: boolean;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Failed to delete TrackAttribute", success: false };
  }

  const schema = z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(80),
  });
  const data = schema.parse({
    id: formData.get("id"),
    title: formData.get("title"),
  });

  try {
    await db.trackAttributes.delete({
      where: {
        id: data.id,
        userId: session.user.id,
      },
    });

    revalidatePath("/tracks");
    return { message: `Deleted track attribute ${data.title}`, success: true };
  } catch (error) {
    console.error("Error deleting track attribute:", error);
    return { message: "Failed to delete track attribute", success: false };
  }
}

// Track Items

export const fetchTrackItem = async (id: string) => {
  const { session } = await getUserAuth();
  if (!session) return null;
  const track = await db.trackItem.findUniqueOrThrow({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      TrackAttributes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return track;
};

export const fetchTrackItems = async (filters?: TrackItemFilter) => {
  const { session } = await getUserAuth();
  if (!session) return [];

  const where: any = {
    userId: session.user.id,
  };

  if (filters) {
    if (filters.title) {
      where.title = { contains: filters.title, mode: "insensitive" };
    }
    if (filters.description) {
      where.description = {
        contains: filters.description,
        mode: "insensitive",
      };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = startOfDay(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = endOfDay(filters.dateTo);
      }
    }
    if (filters.attributes) {
      where.TrackAttributes = {
        some: {
          ...(filters.attributes.attributeTitle && {
            title: {
              contains: filters.attributes.attributeTitle,
              mode: "insensitive",
            },
          }),
          ...(filters.attributes.valueType && {
            valueType: filters.attributes.valueType,
          }),
        },
      };
    }
  }

  const tracks = await db.trackItem.findMany({
    where,
    include: {
      TrackAttributes: {
        orderBy: { createdAt: "desc" },
        take: 5, // Limit to recent attributes
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return tracks;
};

export async function createTrackItem(
  prevState: {
    message: string;
    success?: boolean;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return {
      message: "Failed to create TrackItem - Not authenticated",
      success: false,
    };
  }

  const schema = z.object({
    title: z.string().min(1, "Title is required").max(80, "Title too long"),
    description: z.string().max(500, "Description too long").optional(),
  });

  const parse = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
  });

  if (!parse.success) {
    const errorMessage = parse.error.issues
      .map((issue) => issue.message)
      .join(", ");
    return { message: `Validation error: ${errorMessage}`, success: false };
  }

  const data = parse.data;

  try {
    console.log("Creating trackItem:", {
      title: data.title,
      description: data.description,
      userId: session.user.id,
    });

    const newTrack = await db.trackItem.create({
      data: {
        title: data.title,
        description: data.description || null,
        userId: session.user.id,
      },
    });

    console.log("Successfully created track:", newTrack.id);
    revalidatePath("/tracks");
    return {
      message: `Successfully added track: ${data.title}`,
      success: true,
    };
  } catch (error) {
    console.error("Error creating trackItem:", error);
    return {
      message: `Failed to create track: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    };
  }
}

export async function updateTrackItem(
  prevState: {
    message: string;
    success?: boolean;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Failed to update TrackItem", success: false };
  }

  const schema = z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(80),
    description: z.string().max(500).optional(),
  });
  const parse = schema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || "",
  });
  if (!parse.success) {
    const errorMessage = parse.error.issues
      .map((issue) => issue.message)
      .join(", ");
    return { message: `Validation error: ${errorMessage}`, success: false };
  }

  const data = parse.data;

  try {
    await db.trackItem.update({
      where: { id: data.id, userId: session.user.id },
      data: {
        title: data.title,
        description: data.description || null,
      },
    });

    revalidatePath("/tracks");
    return {
      message: `Successfully updated track: ${data.title}`,
      success: true,
    };
  } catch (error) {
    console.error("Error updating track item:", error);
    return { message: "Failed to update track", success: false };
  }
}

export async function deleteTrackItem(
  prevState: {
    message: string;
    success?: boolean;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Failed to delete TrackItem", success: false };
  }

  const schema = z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(80),
  });
  const data = schema.parse({
    id: formData.get("id"),
    title: formData.get("title"),
  });

  try {
    await db.trackItem.delete({
      where: {
        id: data.id,
        userId: session.user.id,
      },
    });

    revalidatePath("/tracks");
    return { message: `Deleted trackItem ${data.title}`, success: true };
  } catch (error) {
    console.error("Error deleting track item:", error);
    return { message: "Failed to delete TrackItem", success: false };
  }
}

// Analytics and Chart Data Functions

export const getTrackingMetrics = async (): Promise<TrackingMetrics> => {
  const { session } = await getUserAuth();
  if (!session) {
    return {
      totalItems: 0,
      totalAttributes: 0,
      recentActivity: 0,
      attributesByType: {
        STRING: 0,
        INT: 0,
        FLOAT: 0,
        DATETIME: 0,
        DURATION: 0,
      },
    };
  }

  const [totalItems, totalAttributes, recentActivity, attributesByType] =
    await Promise.all([
      db.trackItem.count({
        where: { userId: session.user.id },
      }),
      db.trackAttributes.count({
        where: { userId: session.user.id },
      }),
      db.trackAttributes.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: subDays(new Date(), 7) },
        },
      }),
      db.trackAttributes.groupBy({
        by: ["valueType"],
        where: { userId: session.user.id },
        _count: { valueType: true },
      }),
    ]);

  const attributeTypeCounts = attributesByType.reduce(
    (acc, item) => {
      acc[item.valueType] = item._count.valueType;
      return acc;
    },
    {
      STRING: 0,
      INT: 0,
      FLOAT: 0,
      DATETIME: 0,
      DURATION: 0,
    } as Record<TrackAttributeValueType, number>,
  );

  return {
    totalItems,
    totalAttributes,
    recentActivity,
    attributesByType: attributeTypeCounts,
  };
};

export const getAttributeChartData = async (
  trackId: string,
  attributeTitle: string,
  period: "week" | "month" | "year" = "month",
): Promise<ChartDataPoint[]> => {
  const { session } = await getUserAuth();
  if (!session) return [];

  let startDate: Date;
  switch (period) {
    case "week":
      startDate = startOfWeek(new Date());
      break;
    case "month":
      startDate = startOfMonth(new Date());
      break;
    case "year":
      startDate = new Date(new Date().getFullYear(), 0, 1);
      break;
  }

  const attributes = await db.trackAttributes.findMany({
    where: {
      userId: session.user.id,
      trackId,
      title: attributeTitle,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "asc" },
  });

  return attributes.map((attr) => {
    let value = 0;
    switch (attr.valueType) {
      case "INT":
        value = attr.valueInt || 0;
        break;
      case "FLOAT":
        value = attr.valueFloat || 0;
        break;
      case "DURATION":
        value = attr.valueDuration || 0; // Duration in minutes
        break;
      case "STRING":
        value = attr.value ? attr.value.length : 0;
        break;
      case "DATETIME":
        value = attr.valueDate ? new Date(attr.valueDate).getTime() : 0;
        break;
    }

    return {
      name: attr.title,
      value,
      date: attr.createdAt.toISOString().split("T")[0],
      label:
        attr.value ||
        attr.valueInt?.toString() ||
        attr.valueFloat?.toString() ||
        "",
    };
  });
};

export const getTrackItemActivityData = async (
  trackId: string,
  period: "week" | "month" | "year" = "month",
): Promise<ChartDataPoint[]> => {
  const { session } = await getUserAuth();
  if (!session) return [];

  let startDate: Date;
  switch (period) {
    case "week":
      startDate = startOfWeek(new Date());
      break;
    case "month":
      startDate = startOfMonth(new Date());
      break;
    case "year":
      startDate = new Date(new Date().getFullYear(), 0, 1);
      break;
  }

  const activities = await db.trackAttributes.groupBy({
    by: ["createdAt"],
    where: {
      userId: session.user.id,
      trackId,
      createdAt: { gte: startDate },
    },
    _count: { id: true },
  });

  const activityByDate = activities.reduce(
    (acc, activity) => {
      const date = activity.createdAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + activity._count.id;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(activityByDate).map(([date, count]) => ({
    name: date,
    value: count,
    date,
    label: `${count} entries`,
  }));
};

export const fetchUniqueAttributeTitles = async (
  userId?: string,
): Promise<string[]> => {
  const { session } = await getUserAuth();
  if (!session && !userId) return [];

  const userIdToUse = userId || session!.user.id;

  const attributes = await db.trackAttributes.findMany({
    where: { userId: userIdToUse },
    select: { title: true },
    distinct: ["title"],
    orderBy: { title: "asc" },
  });

  return attributes.map((attr) => attr.title);
};

// Get attribute details by title (most common type for the title)
export const fetchAttributeDetailsByTitle = async (
  title: string,
  userId?: string,
): Promise<{ title: string; valueType: TrackAttributeValueType } | null> => {
  const { session } = await getUserAuth();
  if (!session && !userId) return null;

  const userIdToUse = userId || session!.user.id;

  // Find the most commonly used value type for this title
  const attributes = await db.trackAttributes.groupBy({
    by: ["valueType"],
    where: {
      userId: userIdToUse,
      title: { equals: title, mode: "insensitive" },
    },
    _count: {
      valueType: true,
    },
    orderBy: {
      _count: {
        valueType: "desc",
      },
    },
  });

  if (attributes.length === 0) return null;

  return {
    title,
    valueType: attributes[0].valueType,
  };
};

// Get recently used attribute titles (last 30 days)
export const fetchRecentAttributeTitles = async (
  limit: number = 10,
): Promise<string[]> => {
  const { session } = await getUserAuth();
  if (!session) return [];

  const thirtyDaysAgo = subDays(new Date(), 30);

  const attributes = await db.trackAttributes.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { title: true },
    distinct: ["title"],
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return attributes.map((attr) => attr.title);
};

// Get frequently used attribute titles (by count)
export const fetchFrequentAttributeTitles = async (
  limit: number = 10,
): Promise<Array<{ title: string; count: number }>> => {
  const { session } = await getUserAuth();
  if (!session) return [];

  const attributes = await db.trackAttributes.groupBy({
    by: ["title"],
    where: { userId: session.user.id },
    _count: { title: true },
    orderBy: { _count: { title: "desc" } },
    take: limit,
  });

  return attributes.map((attr) => ({
    title: attr.title,
    count: attr._count.title,
  }));
};

// Get detailed attribute information for quick entry
export const fetchQuickEntryAttributes = async (
  limit: number = 10,
): Promise<
  Array<{
    title: string;
    valueType: TrackAttributeValueType;
    count: number;
    lastValue?: string;
    isRecent: boolean;
  }>
> => {
  const { session } = await getUserAuth();
  if (!session) return [];

  const thirtyDaysAgo = subDays(new Date(), 30);

  // Get attribute usage with most common type and recent usage
  const attributeStats = await db.trackAttributes.groupBy({
    by: ["title", "valueType"],
    where: { userId: session.user.id },
    _count: { title: true },
    orderBy: { _count: { title: "desc" } },
  });

  // Get recent attributes for flagging
  const recentTitles = await db.trackAttributes.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { title: true },
    distinct: ["title"],
  });

  const recentTitleSet = new Set(recentTitles.map((attr) => attr.title));

  // Group by title and pick the most common valueType for each
  const attributeMap = new Map<
    string,
    {
      title: string;
      valueType: TrackAttributeValueType;
      count: number;
      isRecent: boolean;
    }
  >();

  attributeStats.forEach((stat) => {
    const existing = attributeMap.get(stat.title);
    if (!existing || stat._count.title > existing.count) {
      attributeMap.set(stat.title, {
        title: stat.title,
        valueType: stat.valueType,
        count: stat._count.title,
        isRecent: recentTitleSet.has(stat.title),
      });
    }
  });

  // Get last values for each attribute
  const result = await Promise.all(
    Array.from(attributeMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(async (attr) => {
        // Get the most recent value for this attribute
        const lastEntry = await db.trackAttributes.findFirst({
          where: {
            userId: session.user.id,
            title: attr.title,
            valueType: attr.valueType,
          },
          orderBy: { createdAt: "desc" },
          select: {
            value: true,
            valueInt: true,
            valueFloat: true,
            valueDate: true,
            valueDuration: true,
          },
        });

        let lastValue: string | undefined;
        if (lastEntry) {
          switch (attr.valueType) {
            case "STRING":
              lastValue = lastEntry.value || undefined;
              break;
            case "INT":
              lastValue = lastEntry.valueInt?.toString();
              break;
            case "FLOAT":
              lastValue = lastEntry.valueFloat?.toString();
              break;
            case "DATETIME":
              lastValue = lastEntry.valueDate?.toISOString().slice(0, 16);
              break;
            case "DURATION":
              if (lastEntry.valueDuration) {
                const minutes = lastEntry.valueDuration;
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                lastValue = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
              }
              break;
          }
        }

        return {
          ...attr,
          lastValue,
        };
      }),
  );

  return result;
};
