import type { ISidebarLink } from "@/components/SidebarItems";
import {
  Cog,
  HomeIcon,
  Timer as Tracks,
  IndianRupee as Loans,
  Dumbbell,
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
    title: "Entities",
    links: [
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
];
