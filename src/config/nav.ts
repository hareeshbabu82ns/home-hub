import type { ISidebarLink } from "@/components/SidebarItems";
import {
  Cog,
  HomeIcon,
  Timer as Tracks,
  IndianRupee as Loans,
  Dumbbell,
  Database,
  Users,
  Shield,
  Clock,
} from "lucide-react";

type AdditionalLinks = {
  title: string;
  links: ISidebarLink[];
};

export const defaultLinks: ISidebarLink[] = [
  { href: "/dashboard", title: "Home", icon: HomeIcon },
  { href: "/account", title: "Account", icon: Cog },
  { href: "/settings", title: "Settings", icon: Cog },
];

export const additionalLinks: AdditionalLinks[] = [
  {
    title: "Database",
    links: [
      {
        href: "/db-management",
        title: "DB Management",
        icon: Database,
      },
    ],
  },
  {
    title: "Entities",
    links: [
      {
        href: "/time-tracking",
        title: "Time Tracking",
        icon: Clock,
      },
      {
        href: "/tracks",
        title: "Tracks",
        icon: Tracks,
      },
      {
        href: "/loans",
        title: "Loans",
        icon: Loans,
      },
      {
        href: "/exercises",
        title: "Exercises",
        icon: Dumbbell,
      },
    ],
  },
  {
    title: "Admin",
    links: [
      {
        href: "/admin/users",
        title: "Users",
        icon: Users,
      },
      {
        href: "/admin/registration",
        title: "Registration",
        icon: Shield,
      },
    ],
  },
];
