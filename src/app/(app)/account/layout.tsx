import { checkAuth } from "@/lib/auth/utils";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();

  return (
    <div className="flex flex-col">
      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto p-6">{children}</div>
      </div>
    </div>
  );
}
