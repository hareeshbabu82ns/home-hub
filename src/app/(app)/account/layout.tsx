import { checkAuth } from "@/lib/auth/utils";
import AccountSidebar from "./AccountSidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();

  return (
    <div className="flex" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* Account Sub-Sidebar */}
      <div className="border-border bg-background h-full w-64 flex-shrink-0 border-r">
        <AccountSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </div>
    </div>
  );
}
