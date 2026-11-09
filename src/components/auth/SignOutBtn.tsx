"use client";

import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

export default function SignOutBtn() {
  const handleSignOut = async () => {
    await signOut();
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
