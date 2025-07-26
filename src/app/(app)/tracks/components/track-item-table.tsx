"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { deleteTrackItem } from "../actions";
import type { TrackItemWithAttributes } from "@/types/track";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Trash2, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface TrackItemTableProps {
  tracks: TrackItemWithAttributes[];
}

export function TrackItemTable({ tracks: initialTracks }: TrackItemTableProps) {
  const [tracks, setTracks] = useState(initialTracks);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] =
    useState<TrackItemWithAttributes | null>(null);

  const [isPendingDelete, startDeleteTransition] = useTransition();

  // Handle delete track result
  useEffect(() => {
    setTracks(initialTracks);
  }, [initialTracks]);

  const handleDeleteTrack = (track: TrackItemWithAttributes) => {
    setTrackToDelete(track);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTrack = () => {
    if (trackToDelete) {
      startDeleteTransition(async () => {
        const formData = new FormData();
        formData.append("id", trackToDelete.id);
        formData.append("title", trackToDelete.title);

        const result = await deleteTrackItem(
          { message: "", success: false },
          formData,
        );

        if (result.success) {
          toast.success(result.message);
          setDeleteConfirmOpen(false);
          // Remove the deleted track from the list
          setTracks((prevTracks) =>
            prevTracks.filter((track) => track.id !== trackToDelete.id),
          );
          setTrackToDelete(null);
        } else {
          toast.error(result.message);
        }
      });
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">No tracks found.</p>
        <Button asChild>
          <Link href="/tracks/new">Create your first track</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-left font-medium">Title</th>
              <th className="p-4 text-left font-medium">Description</th>
              <th className="p-4 text-left font-medium">Attributes</th>
              <th className="p-4 text-left font-medium">Last Updated</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track) => (
              <tr key={track.id} className="hover:bg-muted/25 border-b">
                <td className="p-4">
                  <Link
                    href={`/tracks/${track.id}`}
                    className="font-medium hover:underline"
                  >
                    {track.title}
                  </Link>
                </td>
                <td className="text-muted-foreground p-4">
                  {track.description || "No description"}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {track.TrackAttributes.slice(0, 3).map((attr) => (
                      <Badge
                        key={attr.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {attr.title}
                      </Badge>
                    ))}
                    {track.TrackAttributes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{track.TrackAttributes.length - 3} more
                      </Badge>
                    )}
                    {track.TrackAttributes.length === 0 && (
                      <span className="text-muted-foreground text-sm">
                        No attributes
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-muted-foreground p-4 text-sm">
                  {formatDistanceToNow(new Date(track.updatedAt), {
                    addSuffix: true,
                  })}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/tracks/${track.id}`}>
                        <Edit className="mr-1 size-3" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTrack(track)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Track Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Track"
        description={
          trackToDelete
            ? `Are you sure you want to delete the track "${trackToDelete.title}" and all its attributes? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Track"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteTrack}
        loading={isPendingDelete}
      />
    </>
  );
}
