"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserAuth } from "@/lib/auth/utils";
import { db } from "@/lib/db";

// Track Attributes
export const fetchTrackItemAttributes = async (trackId: string) => {
  const { session } = await getUserAuth();
  if (!session) return [];
  const trackAttributes = await db.trackAttributes.findMany({
    where: {
      userId: session.user.id,
      trackId,
    },
  });
  return trackAttributes;
};

export const fetchTrackAttribute = async (id: string) => {
  const { session } = await getUserAuth();
  if (!session) return null;
  const track = await db.trackAttributes.findUniqueOrThrow({
    where: {
      id: id,
      userId: session.user.id,
    },
  });
  return track;
};

export async function createTrackItemAttribute(
  prevState: {
    message: string;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Failed to create TrackItemAttribute" };
  }

  const schema = z.object({
    userId: z.string().min(1).max(30),
    trackId: z.string().min(1).max(30),
    title: z.string().min(1).max(80),
    description: z.string().max(500),
  });
  const parse = schema.safeParse({
    trackId: formData.get("trackId"),
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!parse.success) {
    return { message: "Failed to create TrackItem" };
  }

  const data = parse.data;

  try {
    console.log("createTrackAttribute", data);
    await db.trackAttributes.create({
      data: {
        trackId: data.trackId,
        title: data.title,

        // value: data.value,
        // valueDate: data.valueDate,
        // valueFloat: data.valueFloat,
        // valueInt: data.valueInt,
        // valueType: data.valueType,

        userId: session.user.id,
      },
    });

    revalidatePath("/");
    return { message: `Added trackItem ${data.title}` };
  } catch (e) {
    return { message: "Failed to create trackItem" };
  }
}

export async function updateTrackItemAttribute(
  prevState: {
    message: string;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Failed to create TrackItem" };
  }

  const schema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1).max(30),
    trackId: z.string().min(1).max(30),
    title: z.string().min(1).max(80),
  });
  const parse = schema.safeParse({
    id: formData.get("id"),
    userId: session.user.id,
    trackId: formData.get("trackId"),
    title: formData.get("title"),
  });
  if (!parse.success) {
    return { message: "Failed to update TrackItem" };
  }

  const data = parse.data;

  try {
    console.log("updateTrackItem", data);
    await db.trackAttributes.update({
      where: { id: data.id },
      data: {
        title: data.title,
        // value: data.value,
        // valueType: data.valueType,
        // valueInt: data.valueInt,
        // valueFloat: data.valueFloat,
        // valueDate: data.valueDate,
        userId: session.user.id,
      },
    });

    revalidatePath("/");
    return { message: `Updated trackItem ${data.title}` };
  } catch (e) {
    return { message: "Failed to update trackItem", error: true };
  }
}

// Track Items

export const fetchTrackItem = async (id: string) => {
  const { session } = await getUserAuth();
  if (!session) return null;
  const track = await db.trackItem.findUniqueOrThrow({
    where: {
      id: id,
      userId: session.user.id,
    },
  });
  return track;
};

export const fetchTrackItems = async () => {
  const { session } = await getUserAuth();
  if (!session) return [];
  const tracks = await db.trackItem.findMany({
    where: {
      userId: session.user.id,
    },
  });
  return tracks;
};

export async function createTrackItem(
  prevState: {
    message: string;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Failed to create TrackItem" };
  }

  const schema = z.object({
    userId: z.string().min(1).max(30),
    title: z.string().min(1).max(80),
    description: z.string().max(500),
  });
  const parse = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!parse.success) {
    return { message: "Failed to create TrackItem" };
  }

  const data = parse.data;

  try {
    console.log("createTrackItem", data);
    await db.trackItem.create({
      data: {
        title: data.title,
        description: data.description,
        userId: session.user.id,
      },
    });

    revalidatePath("/");
    return { message: `Added trackItem ${data.title}` };
  } catch (e) {
    return { message: "Failed to create trackItem" };
  }
}

export async function updateTrackItem(
  prevState: {
    message: string;
  },
  formData: FormData,
) {
  const { session } = await getUserAuth();
  if (!session) {
    return { message: "Failed to create TrackItem" };
  }

  const schema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1).max(30),
    title: z.string().min(1).max(80),
    description: z.string().max(500),
  });
  const parse = schema.safeParse({
    id: formData.get("id"),
    userId: session.user.id,
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parse.success) {
    return { message: "Failed to update TrackItem" };
  }

  const data = parse.data;

  try {
    console.log("updateTrackItem", data);
    await db.trackItem.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        userId: session.user.id,
      },
    });

    revalidatePath("/");
    return { message: `Updated trackItem ${data.title}` };
  } catch (e) {
    return { message: "Failed to update trackItem", error: true };
  }
}

export async function deleteTrackItem(
  prevState: {
    message: string;
  },
  formData: FormData,
) {
  const schema = z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(80),
    description: z.string().max(500),
  });
  const data = schema.parse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
  });

  try {
    await db.trackItem.delete({ where: { id: data.id } });

    revalidatePath("/");
    return { message: `Deleted trackItem ${data.title}` };
  } catch (e) {
    return { message: "Failed to delete TrackItem" };
  }
}
