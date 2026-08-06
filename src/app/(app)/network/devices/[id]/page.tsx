import { NetworkDeviceDetailPage } from "./network-device-detail-page";

interface NetworkDeviceDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function NetworkDeviceDetailsPage({
  params,
}: NetworkDeviceDetailsPageProps) {
  const { id } = await params;
  return <NetworkDeviceDetailPage deviceId={id} />;
}
