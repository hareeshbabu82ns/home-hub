import type { ISidebarLink } from "@/components/SidebarItems";
import {
  Activity,
  Clock,
  Database,
  Dumbbell,
  HomeIcon,
  IndianRupee as Loans,
  Router,
  Shield,
  Timer as Tracks,
  Users,
} from "lucide-react";

type AdditionalLinks = {
  title: string;
  links: ISidebarLink[];
};

export const defaultLinks: ISidebarLink[] = [
  { href: "/dashboard", title: "Home", icon: HomeIcon },
  // Account and Settings moved to top-nav user menu
];

export const additionalLinks: AdditionalLinks[] = [
  {
    title: "Network",
    links: [
      {
        href: "/network/devices",
        title: "Devices",
        icon: Router,
      },
      {
        href: "/network/traffic",
        title: "Traffic",
        icon: Activity,
      },
    ],
  },
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
