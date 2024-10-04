import { TrackAttributes } from "@prisma/client";
import { fetchTrackItemAttributes } from "../actions";
// import TrackAttrAddBtn from "./components/track-attr-add-btn";
import Link from "next/link";

export default async function TrackAttributesDataGrid( {
  trackId,
}: {
  trackId: string;
} ) {
  const attrs =
    trackId === "new" ? [] : await fetchTrackItemAttributes( trackId );

  return (
    <div className="border-base-300 border">
      <div className="navbar bg-secondary/50 min-h-2">
        <div className="navbar-start">
          <h3 className="text-xl">Attributes</h3>
        </div>
        <div className="navbar-end">
          <Link href={`/tracks/${trackId}/attributes/new`}>Add</Link>
        </div>
      </div>
      <div className="p-4">
        {( !attrs || attrs.length === 0 ) && <h2>No Attributes, Create some!</h2>}
        {attrs.map( ( attr ) => (
          <TrackAttrLine attr={attr} />
        ) )}
      </div>
    </div>
  );
}

function TrackAttrLine( { attr }: { attr: TrackAttributes } ) {
  return <div>{JSON.stringify( attr )}</div>;
}
