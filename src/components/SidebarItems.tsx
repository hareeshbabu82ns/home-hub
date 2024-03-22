"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { defaultLinks, additionalLinks } from "@/config/nav";

export interface SidebarLink {
  title: string;
  href: string;
  icon: LucideIcon;
}

const SidebarItems = () => {
  return (
    <>
      <SidebarLinkGroup links={defaultLinks} />
      {additionalLinks.length > 0
        ? additionalLinks.map((l) => (
            <SidebarLinkGroup
              links={l.links}
              title={l.title}
              border
              key={l.title}
            />
          ))
        : null}
    </>
  );
};
export default SidebarItems;

const SidebarLinkGroup = ({
  links,
  title,
  border,
}: {
  links: SidebarLink[];
  title?: string;
  border?: boolean;
}) => {
  const fullPathname = usePathname();
  const pathname = "/" + fullPathname.split("/")[1];

  return (
    <div className={border ? "border-border my-8 border-t pt-4" : ""}>
      {title ? (
        <h4 className="text-muted-foreground mb-2 px-2 text-xs uppercase tracking-wider">
          {title}
        </h4>
      ) : null}
      <ul>
        {links.map((link) => (
          <li key={link.title}>
            <SidebarLink link={link} active={pathname === link.href} />
          </li>
        ))}
      </ul>
    </div>
  );
};
const SidebarLink = ({
  link,
  active,
}: {
  link: SidebarLink;
  active: boolean;
}) => {
  return (
    <Link
      href={link.href}
      className={cn("text-muted-foreground hover:bg-popover hover:text-popover-foreground group inline-block w-full rounded-md p-2 text-xs transition-colors hover:shadow",
        active ? " text-popover-foreground font-semibold" : ""
      )}
    >
      <div className="flex items-center">
        <div
          className={cn(
            "bg-accent absolute left-0 h-6 w-[4px] rounded-r-lg  opacity-0",
            active ? "opacity-100" : "",
          )}
        />
        <link.icon className="mr-1 h-3.5" />
        <span>{link.title}</span>
      </div>
    </Link>
  );
};
