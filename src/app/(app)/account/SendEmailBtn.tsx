"use client";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { emailWelcomeSchema } from "@/lib/email/utils";

const SendEmailBtn = ({
  disabled,
  name,
  email,
}: {
  disabled: boolean;
  name: string;
  email: string;
}) => {
  const [sending, setSending] = useState(disabled);

  const sendEmail = async ({
    name,
    email,
  }: {
    name: string;
    email: string;
  }) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // console.error(err);
      toast.error(
        `Email sending failed. ${err?.message ?? "Please try again later."}`,
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
