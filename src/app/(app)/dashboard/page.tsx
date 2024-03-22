import SignIn from "@/components/auth/SignIn";
import { Card } from "@/components/ui/card";
import { getUserAuth } from "@/lib/auth/utils";

export default async function Home() {
  const { session } = await getUserAuth();
  return (
    <main className="my-4 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {session ? (
        <Card>
        <pre className="whitespace-break-spaces break-all rounded-sm p-4 shadow-sm">
          {JSON.stringify(session, null, 2)}
        </pre>
        </Card>
      ) : null}
      <SignIn />
    </main>
  );
}
