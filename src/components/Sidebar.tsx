import Link from "next/link";

import SidebarItems from "./SidebarItems";
import { Avatar, AvatarFallback } from "./ui/avatar";

import { type AuthSession, getUserAuth } from "@/lib/auth/utils";

const Sidebar = async () => {
  const session = await getUserAuth();
  if (session.session === null) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 lg:px-6">
          <SidebarItems />
        </div>
      </div>

      {/* User Details at bottom */}
      <div className="border-border bg-muted/30 space-y-3 border-t p-4">
        <UserDetails session={session as AuthSession} />
      </div>
    </div>
  );
};

export default Sidebar;

const UserDetails = ({ session }: { session: AuthSession }) => {
  if (session.session === null) return null;
  const { user } = session.session;

  if (!user?.name || user.name.length == 0) return null;

  return (
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {user.name ?? "John Doe"}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {user.email ?? "john@doe.com"}
          </p>
        </div>
      </div>
    </Link>
  );
};
