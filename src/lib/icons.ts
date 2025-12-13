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
  Video,
  Wrench,
  Activity,
  Album,
  Anchor,
  Apple,
  Archive,
  Award,
  Baby,
  Bell,
  Bluetooth,
  Camera,
  Car,
  Cloud,
  Crown,
  Database,
  Disc,
  Eye,
  Feather,
  Flag,
  Globe,
  Hammer,
  Headphones,
  Leaf,
  Lightbulb,
  Lock,
  Magnet,
  Moon,
  Paperclip,
  PieChart,
  Rocket,
  Scissors,
  Shield,
  Sun,
  Thermometer,
  Trash2,
  Truck,
  Umbrella,
  Wifi,
  Zap,
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
  Video,
  Wrench,
  Activity,
  Album,
  Anchor,
  Apple,
  Archive,
  Award,
  Baby,
  Bell,
  Bluetooth,
  Camera,
  Car,
  Cloud,
  Crown,
  Database,
  Disc,
  Eye,
  Feather,
  Flag,
  Globe,
  Hammer,
  Headphones,
  Leaf,
  Lightbulb,
  Lock,
  Magnet,
  Moon,
  Paperclip,
  PieChart,
  Rocket,
  Scissors,
  Shield,
  Sun,
  Thermometer,
  Trash2,
  Truck,
  Umbrella,
  Wifi,
  Zap,
};

function normalizeIconName(name: string): string {
  if (!name) return name;
  const parts = name
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  return parts.join("");
}

export function getIconByName(name: string): LucideIcon {
  if (!name) return Clock;
  if (iconMap[name]) return iconMap[name];
  const normalized = normalizeIconName(name);
  if (iconMap[normalized]) return iconMap[normalized];
  const found = Object.keys(iconMap).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  if (found) return iconMap[found];
  return Clock;
}

export function getAllIcons(): Array<{ name: string; icon: LucideIcon }> {
  return Object.entries(iconMap).map(([name, icon]) => ({ name, icon }));
}
