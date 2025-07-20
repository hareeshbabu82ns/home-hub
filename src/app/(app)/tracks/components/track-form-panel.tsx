import type { TrackItem } from "@/app/generated/prisma";
import { fetchTrackItem } from "../actions";
import { TrackForm } from "./track-form";

const initialTrackItem: Omit<TrackItem, "userId"> = {
  id: "new",
  title: "",
  description: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default async function TrackDetailsPanel({
  params: { id },
}: {
  params: { id: string };
}) {
  const track = (
    id === "new" ? initialTrackItem : await fetchTrackItem(id)
  ) as TrackItem;

  return (
    <main className="my-4 space-y-4">
      <div className="border-border border">
        <div className="bg-secondary/50 flex min-h-[3rem] items-center justify-between p-4">
          <div className="flex items-center">
            <h3 className="text-xl">
              {track.id === "new" ? "Create " : "Edit "} Track
            </h3>
          </div>
        </div>
        <div className="p-4">
          <TrackForm track={track} />
        </div>
      </div>
    </main>
  );
}
