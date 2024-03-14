import { getUserAuth } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function PUT(request) {
  // const { session } = await getUserAuth();
  if (!session) return new Response("Error", { status: 400 });
  const body = await request.json();

  await db.verificationToken.create({
    data: { identifier: "test", token: "test" },
  });
  revalidatePath("/account");
  return new Response(JSON.stringify({ message: "ok" }), { status: 200 });
}
