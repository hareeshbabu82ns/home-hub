export default async function TrackDetailsForm({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>{children}</div>
    </div>
  );
}
