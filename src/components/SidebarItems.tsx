"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { defaultLinks, additionalLinks } from "@/config/nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ISidebarLink {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarItemsProps {
  isCollapsed?: boolean;
}

const SidebarItems = ({ isCollapsed = false }: SidebarItemsProps) => {
  return (
    <React.Fragment>
      <SidebarLinkGroup links={defaultLinks} isCollapsed={isCollapsed} />
      {additionalLinks.length > 0
        ? additionalLinks.map((l) => (
            <SidebarLinkGroup
              links={l.links}
              title={l.title}
              border
              isCollapsed={isCollapsed}
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
  isCollapsed = false,
}: {
  links: ISidebarLink[];
  title?: string;
  border?: boolean;
  isCollapsed?: boolean;
}) => {
  const fullPathname = usePathname();
  const pathname = `/${fullPathname.split("/")[1]}`;

  return (
    <div className={border ? "border-border my-6 border-t pt-6" : ""}>
      {title && !isCollapsed ? (
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
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>
    </div>
  );
};
const SidebarLink = ({
  link,
  active,
  isCollapsed = false,
}: {
  link: ISidebarLink;
  active: boolean;
  isCollapsed?: boolean;
}) => {
  const linkContent = (
    <Link
      href={link.href}
      className={cn(
        "group hover:bg-accent hover:text-accent-foreground flex w-full items-center rounded-lg text-sm transition-all duration-200",
        isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
        active
          ? "bg-accent text-accent-foreground font-medium shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <div className={cn("flex items-center", isCollapsed ? "" : "gap-3")}>
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
        {!isCollapsed && <span className="truncate">{link.title}</span>}
      </div>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          {link.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
};
