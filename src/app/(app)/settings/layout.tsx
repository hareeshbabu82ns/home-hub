import { checkAuth } from "@/lib/auth/utils";
import SettingsSidebar, { SettingsTabs } from "./SettingsSidebar";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Phones: horizontal, scrollable section tabs */}
      <div className="border-border bg-background/95 sticky top-0 z-30 border-b backdrop-blur md:hidden">
        <SettingsTabs />
      </div>

      {/* Tablet / desktop: section list */}
      <div className="border-border bg-background hidden w-56 shrink-0 border-r md:block lg:w-64">
        <div className="sticky top-0 max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
          <SettingsSidebar />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="container mx-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
