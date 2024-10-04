import Link from "next/link";
import { fetchTrackItems } from "./actions";
import { TrackItem } from "@prisma/client";
import { SquarePen as NewTrackIcon } from "lucide-react";

export default async function Home() {
  const tracks = await fetchTrackItems();

  return (
    <main className="my-4 space-y-4">
      <h1 className="text-2xl font-semibold">Track</h1>
      <div className="border-base-300 border">
        <div className="navbar bg-secondary/50">
          <div className="navbar-start">
            <a className="text-xl">Trackings</a>
          </div>
          <div className="navbar-end">
            <button className="btn btn-circle btn-ghost">
              <NewTrackIcon className="size-6" />
            </button>
          </div>
        </div>
        <TrackItemTable tracks={tracks} />
      </div>
    </main>
  );
}

function TrackItemTable( { tracks }: { tracks: TrackItem[] } ) {
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
          {tracks.map( ( track ) => (
            <tr key={track.id} className="hover">
              <td>
                <Link href={`/tracks/${track.id}`}>{track.title}</Link>
              </td>
              <td>{track.description}</td>
              <td>{track.updatedAt.toISOString()}</td>
            </tr>
          ) )}
        </tbody>
      </table>
    </div>
  );
}
