"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import SignOutBtn from "@/components/auth/SignOutBtn";
import { User, Mail, Shield, Bell, CreditCard, Settings } from "lucide-react";

const accountNavItems = [
  {
    title: "Profile",
    href: "/account",
    icon: User,
    description: "Manage your personal information",
  },
  {
    title: "Email Settings",
    href: "/account/email",
    icon: Mail,
    description: "Update email preferences",
  },
  {
    title: "Security",
    href: "/account/security",
    icon: Shield,
    description: "Password and security settings",
  },
  {
    title: "Notifications",
    href: "/account/notifications",
    icon: Bell,
    description: "Manage notification preferences",
  },
  {
    title: "Billing",
    href: "/account/billing",
    icon: CreditCard,
    description: "Manage billing and subscriptions",
  },
  {
    title: "Preferences",
    href: "/account/preferences",
    icon: Settings,
    description: "App preferences and settings",
  },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border border-b p-6">
        <h2 className="text-lg font-semibold">Account Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your account preferences
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {accountNavItems.map((item) => {
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

      {/* Sign Out Section */}
      <div className="border-border mt-auto border-t p-4">
        <SignOutBtn />
      </div>
    </div>
  );
}
