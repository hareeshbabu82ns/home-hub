"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

export default function SignOutBtn() {
  const router = useRouter();
  const handleSignOut = async () => {
    const response = await fetch("/api/sign-out", {
      method: "POST",
      redirect: "manual",
    });

    if (response.status === 0) {
      // redirected
      // when using `redirect: "manual"`, response status 0 is returned
      return router.refresh();
    }
  };
  return (
    <Button
      variant="ghost"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full justify-start gap-3"
      size="sm"
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
