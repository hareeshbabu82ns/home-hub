import SignIn from "@/components/auth/SignIn";
import { getUserAuth } from "@/lib/auth/utils";

export default async function Home() {
  const { session } = await getUserAuth();
  return (
    <main className="space-y-4">
      {session ? (
        <pre className="bg-secondary-100 dark:bg-secondary-900 p-4 rounded-sm shadow-sm text-secondary-foreground break-all whitespace-break-spaces">
          {JSON.stringify(session, null, 2)}
        </pre>
      ) : null}
      <SignIn />
      <div className="p-2 flex gap-2 justify-center">
        <ul style={{ width: "200px" }}>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
            (variant) => (
              <li
                className={`bg-primary-${variant} px-3 py-2 text-primary-foreground-${variant}`}
                key={variant}
              >
                {variant}
              </li>
            )
          )}
        </ul>
        <ul style={{ width: "200px" }}>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
            (variant) => (
              <li
                className={`bg-secondary-${variant} px-3 py-2 text-secondary-foreground-${variant}`}
                key={variant}
              >
                {variant}
              </li>
            )
          )}
        </ul>
        <ul style={{ width: "200px" }}>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
            (variant) => (
              <li
                className={`bg-tertiary-${variant} px-3 py-2 text-tertiary-foreground-${variant}`}
                key={variant}
              >
                {variant}
              </li>
            )
          )}
        </ul>
      </div>

      <div className="p-2 flex gap-2 justify-center" data-theme="rainforest">
        <ul style={{ width: "200px" }}>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
            (variant) => (
              <li
                className={`bg-primary-${variant} px-3 py-2 text-primary-foreground-${variant}`}
                key={variant}
              >
                {variant}
              </li>
            )
          )}
        </ul>
        <ul style={{ width: "200px" }}>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
            (variant) => (
              <li
                className={`bg-secondary-${variant} px-3 py-2 text-secondary-foreground-${variant}`}
                key={variant}
              >
                {variant}
              </li>
            )
          )}
        </ul>
        <ul style={{ width: "200px" }}>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
            (variant) => (
              <li
                className={`bg-tertiary-${variant} px-3 py-2 text-tertiary-foreground-${variant}`}
                key={variant}
              >
                {variant}
              </li>
            )
          )}
        </ul>
      </div>
    </main>
  );
}
