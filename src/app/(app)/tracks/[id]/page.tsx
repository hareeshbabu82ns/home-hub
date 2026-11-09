import { TrackDetailPage } from "../components/track-detail-page";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <TrackDetailPage trackId={id} />;
};

export default page;
