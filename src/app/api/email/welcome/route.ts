import { resend } from "@/lib/email";
import { WelcomeEmail } from "@/components/emails/WelcomeEmail";
import { type NextRequest, NextResponse } from "next/server";
import React from "react";

export async function POST(request: NextRequest) {
  const { name, email } = await request.json();

  // Check if email service is configured
  if (!resend) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 },
    );
  }

  try {
    const data = await resend.emails.send({
      from: "TerabitIO <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to HomeHub",
      react: React.createElement(WelcomeEmail, { firstName: name }),
      text: "Email powered by Resend.",
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
