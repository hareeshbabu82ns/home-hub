import { MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const WithMobileSidebar = ({
  children,
  sidebarContent: SidebarContent,
  mobileDashboardHeader: MobileDashboardHeader,
  classNameMobileSheet,
  classNameMobileSheetContent,
}) => {
  return (
    <>
      <Sheet>
        <div
          className={cn(
            "flex md:hidden my-2 mx-2 justify-items-center",
            classNameMobileSheet
          )}
        >
          <div className="flex flex-1">
            {MobileDashboardHeader && <MobileDashboardHeader />}
          </div>
          <SheetTrigger>
            <MenuIcon size={24} />
          </SheetTrigger>
        </div>
        <SheetContent
          side="left"
          className={cn(
            "p-0 overflow-y-auto w-[260px]",
            classNameMobileSheetContent
          )}
        >
          <SidebarContent />
        </SheetContent>
      </Sheet>
      {children}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const WithDesktopSidebar = ({
  children,
  sidebarContent: SidebarContent,
  className,
  classNamePage,
  classNameDesktopSidebar,
}) => {
  return (
    // style used from here -> https://github.com/shadcn-ui/ui/blob/1cf5fad881b1da8f96923b7ad81d22d0aa3574b9/apps/www/app/docs/layout.tsx#L12
    <main
      className={cn(
        "h-screen flex-1 items-start md:grid md:grid-cols-[260px_minmax(0,1fr)]",
        classNamePage
      )}
    >
      <aside
        className={cn(
          "h-screen min-w-52 hidden w-full shrink-0 border-r border-border md:sticky md:block shadow-inner",
          classNameDesktopSidebar
        )}
      >
        <SidebarContent />
      </aside>
      <section className={cn("h-full overflow-auto", className)}>
        {children}
      </section>
    </main>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const WithSidebar = ({ children, ...props }) => {
  return (
    <WithDesktopSidebar {...props}>
      <WithMobileSidebar {...props}>{children}</WithMobileSidebar>
    </WithDesktopSidebar>
  );
};
