import {
  Clock,
  Code,
  Book,
  Briefcase,
  Coffee,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  Music,
  Palette,
  Pencil,
  Phone,
  Plane,
  ShoppingCart,
  Star,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Clock,
  Code,
  Book,
  Briefcase,
  Coffee,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  Music,
  Palette,
  Pencil,
  Phone,
  Plane,
  ShoppingCart,
  Star,
  Target,
  Users,
};

export function getIconByName(name: string): LucideIcon {
  return iconMap[name] || Clock;
}

export function getAllIcons(): Array<{ name: string; icon: LucideIcon }> {
  return Object.entries(iconMap).map(([name, icon]) => ({ name, icon }));
}
