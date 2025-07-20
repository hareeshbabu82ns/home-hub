import TrackAttributesDataGrid from "../components/track-attributes-data-grid";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <TrackAttributesDataGrid trackId={id} />;
};

export default page;
