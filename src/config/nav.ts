import { SidebarLink } from "@/components/SidebarItems";
import {
  Cog,
  Palette as Themes,
  HomeIcon,
  Timer as Tracks,
  IndianRupee as Loans,
  Dumbbell,
} from "lucide-react";

type AdditionalLinks = {
  title: string;
  links: SidebarLink[];
};

export const defaultLinks: SidebarLink[] = [
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
