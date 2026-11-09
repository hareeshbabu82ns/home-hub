"use client";

import { cn } from "@/lib/utils";
import {
  Bell,
  Database,
  Download,
  Globe,
  Palette,
  Router,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsNavItems = [
  {
    title: "Appearance",
    href: "/settings",
    icon: Palette,
    description: "Theme and visual preferences",
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Manage notification preferences",
  },
  {
    title: "Privacy & Security",
    href: "/settings/privacy",
    icon: Shield,
    description: "Privacy and security settings",
  },
  {
    title: "Data Management",
    href: "/settings/data",
    icon: Database,
    description: "Import, export, and manage data",
  },
  {
    title: "Network",
    href: "/settings/network",
    icon: Router,
    description: "Router API and scan settings",
  },
  {
    title: "Performance",
    href: "/settings/performance",
    icon: Zap,
    description: "App performance and cache settings",
  },
  {
    title: "Language & Region",
    href: "/settings/language",
    icon: Globe,
    description: "Language and regional settings",
  },
  {
    title: "Accessibility",
    href: "/settings/accessibility",
    icon: Users,
    description: "Accessibility preferences",
  },
  {
    title: "Advanced",
    href: "/settings/advanced",
    icon: Download,
    description: "Advanced configuration options",
  },
];

export default function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border border-b p-6">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-muted-foreground text-sm">
          Configure your app preferences
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {settingsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg p-3 transition-colors",
                    isActive && "bg-accent text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="border-border border-t p-4">
        <div className="text-muted-foreground text-xs">
          <p>Home Hub v1.0.0</p>
          <p>© 2025 Home Hub</p>
        </div>
      </div>
    </div>
  );
}
