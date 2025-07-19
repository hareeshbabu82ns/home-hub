import Link from "next/link";
import { fetchTrackItems } from "./actions";
import { TrackItem } from "@/app/generated/prisma";
import { SquarePen as NewTrackIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const tracks = await fetchTrackItems();

  return (
    <main className="my-4 space-y-4">
      <h1 className="text-2xl font-semibold">Track</h1>
      <div className="border-border border">
        <div className="bg-secondary/50 flex items-center justify-between p-4">
          <div className="flex items-center">
            <h2 className="text-xl">Trackings</h2>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon">
              <NewTrackIcon className="size-6" />
            </Button>
          </div>
        </div>
        <TrackItemTable tracks={tracks} />
      </div>
    </main>
  );
}

function TrackItemTable({ tracks }: { tracks: TrackItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        {/* head */}
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <tr key={track.id} className="hover">
              <td>
                <Link href={`/tracks/${track.id}`}>{track.title}</Link>
              </td>
              <td>{track.description}</td>
              <td>{track.updatedAt.toISOString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
