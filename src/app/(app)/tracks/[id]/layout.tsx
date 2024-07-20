import TrackDetailsPanel from "../components/track-form-panel";

export default async function TrackDetailsForm({
  params: { id },
  children,
}: {
  params: { id: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <TrackDetailsPanel params={{ id }} />
      <div>{children}</div>
      {/* {id !== "new" && <TrackAttributesDataGrid trackId={id} />} */}
    </div>
  );
}
