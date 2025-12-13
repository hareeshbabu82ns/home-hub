import { Metadata } from "next";
import { checkAdminAuth } from "@/lib/auth/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage users and system settings",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAdminAuth();

  return (
    <div className="space-y-4">
      <div className="border-b p-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users and system settings
        </p>
      </div>
      {children}
    </div>
  );
}
