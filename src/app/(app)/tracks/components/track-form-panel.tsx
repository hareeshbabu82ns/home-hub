import { TrackItem } from "@prisma/client";
import { fetchTrackItem } from "../actions";
import { TrackForm } from "./track-form";

const initialTrackItem: Omit<TrackItem, "userId"> = {
  id: "new",
  title: "",
  description: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default async function TrackDetailsPanel( {
  params: { id },
}: {
  params: { id: string };
} ) {
  const track = (
    id === "new" ? initialTrackItem : await fetchTrackItem( id )
  ) as TrackItem;

  return (
    <main className="my-4 space-y-4">
      <div className="border-base-300 border">
        <div className="navbar bg-secondary/50 min-h-2">
          <div className="navbar-start">
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
