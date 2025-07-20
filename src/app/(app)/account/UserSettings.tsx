"use client";
import UpdateNameCard from "./UpdateNameCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Session } from "next-auth";
import { User, Mail, Calendar } from "lucide-react";

export default function UserSettings({ session }: { session: Session | null }) {
  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Overview
          </CardTitle>
          <CardDescription>
            Your account information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="border-border border text-lg">
                {session?.user?.name
                  ? session.user.name
                      ?.split(" ")
                      .map((word: string) => word[0].toUpperCase())
                      .join("")
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="text-muted-foreground h-4 w-4" />
                <span className="font-medium">
                  {session?.user?.name || "No name set"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">
                  {session?.user?.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">
                  Member since {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Name Update */}
      <UpdateNameCard name={session?.user.name ?? ""} />
    </div>
  );
}
