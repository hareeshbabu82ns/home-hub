"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Pencil, Trash2, Save, X, Clock, ArrowLeft } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type {
  TimeTopicWithSessions,
  TimeSession,
  DurationBreakdown,
} from "@/types/time-tracking";
import { getIconByName } from "@/lib/icons";
import {
  getTodayDuration,
  getWeekDuration,
  getCurrentMonthDuration,
  getTotalDuration,
} from "@/lib/time-tracking-utils";
import {
  updateTimeSession,
  deleteTimeSession,
  fetchTopicSessions,
} from "../actions";

interface TopicDetailsClientProps {
  topic: TimeTopicWithSessions;
}

interface EditingSession {
  id: string;
  startTime: string;
  endTime: string;
  notes: string;
  durationMs: number;
}

export function TopicDetailsClient({ topic }: TopicDetailsClientProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<TimeSession[]>(topic.sessions || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  const IconComponent = topic.icon ? getIconByName(topic.icon) : Clock;

  const loadSessions = useCallback(async () => {
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
  }, [topic.id]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
        router.refresh();
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

        router.refresh();
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

  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/time-tracking")}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="flex items-center gap-3">
          <div
            className="flex size-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${topic.color}20` }}
          >
            <IconComponent className="size-6" style={{ color: topic.color }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{topic.name}</h1>
            <p className="text-muted-foreground">
              {sessions.length} sessions • Total:{" "}
              {formatDuration(totalDuration)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDuration(
                getTodayDuration(
                  topic.durationBreakdown as unknown as DurationBreakdown,
                ),
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDuration(
                getWeekDuration(
                  topic.durationBreakdown as unknown as DurationBreakdown,
                ),
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDuration(
                getCurrentMonthDuration(
                  topic.durationBreakdown as unknown as DurationBreakdown,
                ),
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              All Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDuration(
                getTotalDuration(
                  topic.durationBreakdown as unknown as DurationBreakdown,
                ),
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="overflow-x-auto">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
