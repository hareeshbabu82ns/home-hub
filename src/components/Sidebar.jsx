import Link from "next/link";

import SidebarItems from "./SidebarItems";
import { Avatar, AvatarFallback } from "./ui/avatar";

import { getUserAuth } from "@/lib/auth/utils";
import AppTitleLogo from "./AppTitleLogo";

const Sidebar = async () => {
  const session = await getUserAuth();
  if (session.session === null) return null;

  return (
    <aside className="flex flex-col justify-between h-full bg-muted pt-4">
      <div className="h-full space-y-2">
        <div className="pl-4 pt-2">
          <AppTitleLogo />
        </div>
        <div className="py-4 pl-4 pr-6 md:py-6">
          <SidebarItems />
        </div>
      </div>
      <div className="py-2 px-2">
        <UserDetails session={session} />
      </div>
    </aside>
  );
};

export default Sidebar;

const UserDetails = ({ session }) => {
  if (session.session === null) return null;
  const { user } = session.session;

  if (!user?.name || user.name.length == 0) return null;

  return (
    <Link href="/account">
      <div className="flex items-center justify-between w-full border-t border-border pt-4 px-2">
        <div className="text-muted-foreground">
          <p className="text-xs">{user.name ?? "John Doe"}</p>
          <p className="text-xs font-light pr-4">
            {user.email ?? "john@doe.com"}
          </p>
        </div>
        <Avatar className="h-10 w-10">
          <AvatarFallback className="border-border border-2 text-muted-foreground">
            {user.name
              ? user.name
                  ?.split(" ")
                  .map((word) => word[0].toUpperCase())
                  .join("")
              : "~"}
          </AvatarFallback>
        </Avatar>
      </div>
    </Link>
  );
};
