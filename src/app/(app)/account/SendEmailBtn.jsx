"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

import { emailWelcomeSchema } from "@/lib/email/utils";

const SendEmailBtn = ({ name, email }) => {
  const [sending, setSending] = useState(false);

  const sendEmail = async ({ name, email }) => {
    setSending(true);
    try {
      const payload = emailWelcomeSchema.parse({
        name,
        email,
      });
      console.log(payload);
      const req = await fetch("/api/email/welcome", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const res = await req.json();
      // console.log(res);
      const { data, error } = res;
      if (data?.id) toast.success("Successfully sent!");
      if (error) throw error;
    } catch (err) {
      // console.error(err);
      toast.error(
        `Email sending failed. ${err?.message ?? "Please try again later."}`
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      type="button"
      disabled={sending}
      onClick={() => sendEmail({ name, email })}
    >
      Send Email
    </Button>
  );
};

export default SendEmailBtn;
