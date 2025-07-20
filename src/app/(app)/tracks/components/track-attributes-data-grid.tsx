import type { TrackAttributes } from "@/app/generated/prisma";
import { fetchTrackItemAttributes } from "../actions";
// import TrackAttrAddBtn from "./components/track-attr-add-btn";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TrackAttributesDataGrid({
  trackId,
}: {
  trackId: string;
}) {
  const attrs =
    trackId === "new" ? [] : await fetchTrackItemAttributes(trackId);

  return (
    <div className="border-border border">
      <div className="bg-secondary/50 flex min-h-[3rem] items-center justify-between p-4">
        <div className="flex items-center">
          <h3 className="text-xl">Attributes</h3>
        </div>
        <div className="flex items-center">
          <Button variant="outline" asChild>
            <Link href={`/tracks/${trackId}/attributes/new`}>Add</Link>
          </Button>
        </div>
      </div>
      <div className="p-4">
        {attrs.length === 0 && <h2>No Attributes, Create some!</h2>}
        {attrs.map((attr) => (
          <TrackAttrLine attr={attr} key={attr.id} />
        ))}
      </div>
    </div>
  );
}

function TrackAttrLine({ attr }: { attr: TrackAttributes }) {
  return <div>{JSON.stringify(attr)}</div>;
}
