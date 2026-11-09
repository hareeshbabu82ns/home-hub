"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Save, X, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { TimeTopicWithSessions, TimeSession } from "@/types/time-tracking";
import { getIconByName } from "@/lib/icons";
import {
  updateTimeSession,
  deleteTimeSession,
  fetchTopicSessions,
} from "../actions";

interface TopicDetailsDialogProps {
  topic: TimeTopicWithSessions | null;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
}

interface EditingSession {
  id: string;
  startTime: string;
  endTime: string;
  notes: string;
  durationMs: number;
}

export function TopicDetailsDialog({
  topic,
  open,
  onOpenChange,
}: TopicDetailsDialogProps) {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  const IconComponent = topic?.icon ? getIconByName(topic.icon) : Clock;

  const loadSessions = useCallback(async () => {
    if (!topic?.id) return;

    setLoading(true);
    try {
      const fetchedSessions = await fetchTopicSessions(topic.id, 100);
      const completedSessions = fetchedSessions.filter(
        (s) => !s.isRunning && s.durationMs,
      );
      setSessions(completedSessions);
      calculateTotal(completedSessions);
    } catch (error) {
      toast.error("Failed to load sessions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [topic?.id]);

  // Fetch sessions when dialog opens
  useEffect(() => {
    if (open && topic?.id) {
      loadSessions();
    }
  }, [open, topic?.id, loadSessions]);

  const calculateTotal = (sessionList: TimeSession[]) => {
    const total = sessionList.reduce((sum, session) => {
      return sum + Number(session.durationMs || 0);
    }, 0);
    setTotalDuration(total);
  };

  const handleEdit = (session: TimeSession) => {
    setEditingId(session.id);
    setEditingData({
      id: session.id,
      startTime: format(new Date(session.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: session.endTime
        ? format(new Date(session.endTime), "yyyy-MM-dd'T'HH:mm")
        : "",
      notes: session.notes || "",
      durationMs: Number(session.durationMs || 0),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleSave = async () => {
    if (!editingData || !editingId) return;

    try {
      const startTime = new Date(editingData.startTime);
      const endTime = new Date(editingData.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        toast.error("Invalid date/time format");
        return;
      }

      if (endTime <= startTime) {
        toast.error("End time must be after start time");
        return;
      }

      // Calculate new duration
      const newDurationMs = endTime.getTime() - startTime.getTime();

      const formData = new FormData();
      formData.append("sessionId", editingId);
      formData.append("startTime", startTime.toISOString());
      formData.append("endTime", endTime.toISOString());
      formData.append("durationMs", newDurationMs.toString());
      formData.append("notes", editingData.notes);

      const result = await updateTimeSession(
        { message: "", success: false },
        formData,
      );

      if (result.success) {
        toast.success("Session updated");

        // Update local state
        setSessions((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  startTime,
                  endTime,
                  durationMs: BigInt(newDurationMs),
                  notes: editingData.notes,
                }
              : s,
          ),
        );

        // Recalculate total
        const updatedSessions = sessions.map((s) =>
          s.id === editingId ? { ...s, durationMs: BigInt(newDurationMs) } : s,
        );
        calculateTotal(updatedSessions);

        handleCancelEdit();
      } else {
        toast.error(result.message || "Failed to update session");
      }
    } catch (error) {
      toast.error("Failed to update session");
      console.error(error);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Delete this session? This cannot be undone.")) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("sessionId", sessionId);

      const result = await deleteTimeSession(
        { message: "", success: false },
        formData,
      );

      if (result.success) {
        toast.success("Session deleted");

        // Remove from local state
        setSessions((prev) => {
          const updated = prev.filter((s) => s.id !== sessionId);
          calculateTotal(updated);
          return updated;
        });
      } else {
        toast.error(result.message || "Failed to delete session");
      }
    } catch (error) {
      toast.error("Failed to delete session");
      console.error(error);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!topic) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${topic.color}20` }}
            >
              <IconComponent
                className="size-6"
                style={{ color: topic.color }}
              />
            </div>
            <div>
              <DialogTitle className="text-2xl">{topic.name}</DialogTitle>
              <DialogDescription>
                {sessions.length} sessions • Total:{" "}
                {formatDuration(totalDuration)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading sessions...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">
                No completed sessions yet
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead className="w-25">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const isEditing = editingId === session.id;

                  if (isEditing && editingData) {
                    return (
                      <TableRow key={session.id} className="bg-muted/50">
                        <TableCell colSpan={6}>
                          <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="start-time">Start Time</Label>
                                <Input
                                  id="start-time"
                                  type="datetime-local"
                                  value={editingData.startTime}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData,
                                      startTime: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="end-time">End Time</Label>
                                <Input
                                  id="end-time"
                                  type="datetime-local"
                                  value={editingData.endTime}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData,
                                      endTime: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="notes">Comments</Label>
                              <Textarea
                                id="notes"
                                value={editingData.notes}
                                onChange={(e) =>
                                  setEditingData({
                                    ...editingData,
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Add comments about this session..."
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSave}>
                                <Save className="mr-2 size-4" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="mr-2 size-4" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        {format(new Date(session.startTime), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(session.startTime), "HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        {session.endTime
                          ? format(new Date(session.endTime), "HH:mm:ss")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {formatDuration(Number(session.durationMs || 0))}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-75">
                        {session.notes ? (
                          <p className="text-muted-foreground truncate text-sm">
                            {session.notes}
                          </p>
                        ) : (
                          <span className="text-muted-foreground/50 text-sm">
                            No comments
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => handleEdit(session)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive size-8"
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-muted-foreground text-sm">
            Total Duration:{" "}
            <span className="text-foreground font-semibold">
              {formatDuration(totalDuration)}
            </span>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
