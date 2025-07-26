"use client";

import Link from "next/link";

import SidebarItems from "./SidebarItems";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

import { type AuthSession } from "@/lib/auth/utils";

interface SidebarProps {
  isCollapsed?: boolean;
  session: AuthSession;
}

const Sidebar = ({ isCollapsed = false, session }: SidebarProps) => {
  if (!session || session.session === null) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto py-4">
          <div className={isCollapsed ? "px-2" : "px-4 lg:px-6"}>
            <SidebarItems isCollapsed={isCollapsed} />
          </div>
        </div>
        {/* No user section when not authenticated */}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className={isCollapsed ? "px-2" : "px-4 lg:px-6"}>
          <SidebarItems isCollapsed={isCollapsed} />
        </div>
      </div>

      {/* User Details at bottom */}
      <div className="border-border bg-muted/30 space-y-3 border-t p-4">
        <UserDetails session={session} isCollapsed={isCollapsed} />
      </div>
    </div>
  );
};

export default Sidebar;

const UserDetails = ({
  session,
  isCollapsed = false,
}: {
  session: AuthSession;
  isCollapsed?: boolean;
}) => {
  if (session.session === null) return null;
  const { user } = session.session;

  if (!user?.name || user.name.length == 0) return null;

  const userDetailsContent = (
    <Link href="/account" className="block w-full">
      <div className="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg p-2 transition-colors">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="border-border border text-xs">
            {user.name
              ? user.name
                  ?.split(" ")
                  .map((word: string) => word[0].toUpperCase())
                  .join("")
              : "~"}
          </AvatarFallback>
        </Avatar>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.name ?? "John Doe"}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {user.email ?? "john@doe.com"}
            </p>
          </div>
        )}
      </div>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{userDetailsContent}</TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          <div>
            <p className="font-medium">{user.name ?? "John Doe"}</p>
            <p className="text-xs opacity-80">{user.email ?? "john@doe.com"}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return userDetailsContent;
};
