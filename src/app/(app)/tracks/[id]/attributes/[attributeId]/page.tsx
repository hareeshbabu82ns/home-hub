import { TrackAttributes } from "@prisma/client";
import { fetchTrackAttribute } from "../../../actions";
import TrackAttributeForm from "../../../components/track-attr-form";
// import { fetchTrackAttribute } from "@app/(app)/tracks/actions";
// import TrackAttributeForm from "@app/(app)/tracks/components/track-attr-form";

const initialTrackAttr: Omit<TrackAttributes, "userId"> = {
  id: "new",
  title: "",
  value: "",
  valueType: "STRING",
  trackId: "",
  valueInt: 0,
  valueFloat: 0.0,
  valueDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default async function TrackDetailsForm( {
  params: { id, attributeId },
}: {
  params: { id: string; attributeId: string };
} ) {
  const attr = (
    id === "new" || attributeId === "new"
      ? initialTrackAttr
      : await fetchTrackAttribute( attributeId )
  ) as TrackAttributes;

  return (
    <main className="space-y-4">
      <div className="border-base-300 border">
        <div className="navbar bg-secondary/50 min-h-2">
          <div className="navbar-start">
            <h3 className="text-xl">
              {attr.id === "new" ? "Create " : "Edit "} TrackAttribute
            </h3>
          </div>
        </div>
        <div className="p-4">
          {/* <TrackAttributeForm attr={attr} /> */}
        </div>
      </div>
    </main>
  );
}
