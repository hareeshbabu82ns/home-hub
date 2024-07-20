import TrackAttributesDataGrid from "../components/track-attributes-data-grid";

const page = ({ params: { id } }: { params: { id: string } }) => {
  return <TrackAttributesDataGrid trackId={id} />;
};

export default page;
