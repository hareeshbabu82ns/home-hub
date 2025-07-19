"use client";

import React from "react";
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
    <React.Fragment>
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
    </React.Fragment>
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
    <div className={border ? "border-border my-6 border-t pt-6" : ""}>
      {title ? (
        <h4 className="text-muted-foreground mb-3 px-3 text-xs font-semibold tracking-wider uppercase">
          {title}
        </h4>
      ) : null}
      <nav className="space-y-1">
        {links.map((link) => (
          <SidebarLink
            key={link.title}
            link={link}
            active={pathname === link.href}
          />
        ))}
      </nav>
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
      className={cn(
        "group hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
        active
          ? "bg-accent text-accent-foreground font-medium shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "bg-primary absolute left-0 h-8 w-1 rounded-r-lg transition-opacity duration-200",
            active ? "opacity-100" : "opacity-0",
          )}
        />
        <link.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors duration-200",
            active
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground",
          )}
        />
        <span className="truncate">{link.title}</span>
      </div>
    </Link>
  );
};
