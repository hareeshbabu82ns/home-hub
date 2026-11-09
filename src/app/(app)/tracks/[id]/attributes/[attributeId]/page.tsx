import type { TrackAttributes } from "@/app/generated/prisma";
import { fetchTrackAttribute } from "../../../actions";
// import TrackAttributeForm from "../../../components/track-attr-form";
// import { fetchTrackAttribute } from "@app/(app)/tracks/actions";
// import TrackAttributeForm from "@app/(app)/tracks/components/track-attr-form";

const initialTrackAttr: Omit<TrackAttributes, "userId"> = {
  id: "new",
  title: "",
  value: "",
  valueType: "STRING",
  valueDuration: 0,
  trackId: "",
  valueInt: 0,
  valueFloat: 0.0,
  valueDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  timerStartTime: null,
  timerEndTime: null,
  isTimerRunning: false,
};

export default async function TrackDetailsForm({
  params,
}: {
  params: Promise<{ id: string; attributeId: string }>;
}) {
  const { id, attributeId } = await params;
  const attr = (
    id === "new" || attributeId === "new"
      ? initialTrackAttr
      : await fetchTrackAttribute(attributeId)
  ) as TrackAttributes;

  return (
    <main className="space-y-4">
      <div className="border-border border">
        <div className="bg-secondary/50 flex min-h-[3rem] items-center justify-between p-4">
          <div className="flex items-center">
            <h3 className="text-xl">
              {attr.id === "new" ? "Create " : "Edit "} TrackAttribute
            </h3>
          </div>
        </div>
        <div className="p-4">{/* <TrackAttributeForm attr={attr} /> */}</div>
      </div>
    </main>
  );
}
