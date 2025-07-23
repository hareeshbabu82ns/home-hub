"use client";

import React, { useState, useEffect } from "react";
import {
  fetchTrackItem,
  fetchTrackItemAttributes,
  getAttributeChartData,
  getTrackItemActivityData,
} from "../actions";
import { TrackAttributesDataGrid } from "../components/track-attributes-data-grid-new";
import { TrackingCharts } from "../components/tracking-charts";
import TrackAttributeForm from "../components/track-attr-form";
import type { TrackItem, TrackAttributes } from "@/app/generated/prisma";
import type { ChartDataPoint } from "@/types/track";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, BarChart3 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface TrackDetailPageProps {
  trackId: string;
}

export function TrackDetailPage({ trackId }: TrackDetailPageProps) {
  const [track, setTrack] = useState<TrackItem | null>(null);
  const [attributes, setAttributes] = useState<TrackAttributes[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [activityData, setActivityData] = useState<ChartDataPoint[]>([]);
  const [selectedAttribute, setSelectedAttribute] = useState<string>("");
  const [chartPeriod, setChartPeriod] = useState<"week" | "month" | "year">(
    "month",
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAttribute, setEditingAttribute] =
    useState<TrackAttributes | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trackData, attributesData] = await Promise.all([
        fetchTrackItem(trackId),
        fetchTrackItemAttributes(trackId),
      ]);

      setTrack(trackData);
      setAttributes(attributesData);

      // Load activity data
      const activityData = await getTrackItemActivityData(trackId, chartPeriod);
      setActivityData(activityData);

      // Load chart data for the first numeric attribute
      if (attributesData.length > 0 && !selectedAttribute) {
        const numericAttr = attributesData.find(
          (attr) => attr.valueType === "INT" || attr.valueType === "FLOAT",
        );
        if (numericAttr) {
          setSelectedAttribute(numericAttr.title);
          const chartData = await getAttributeChartData(
            trackId,
            numericAttr.title,
            chartPeriod,
          );
          setChartData(chartData);
        }
      }
    } catch (error) {
      console.error("Error loading track data:", error);
      toast.error("Failed to load track data");
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    if (selectedAttribute) {
      try {
        const data = await getAttributeChartData(
          trackId,
          selectedAttribute,
          chartPeriod,
        );
        setChartData(data);
      } catch (error) {
        console.error("Error loading chart data:", error);
        toast.error("Failed to load chart data");
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [trackId]);

  useEffect(() => {
    loadChartData();
  }, [selectedAttribute, chartPeriod, trackId]);

  const handleAddAttribute = () => {
    setEditingAttribute({
      id: "new",
      trackId,
      title: "",
      value: null,
      valueInt: null,
      valueFloat: null,
      valueDate: null,
      valueType: "STRING",
      userId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setShowAddDialog(true);
  };

  const handleEditAttribute = (attribute: TrackAttributes) => {
    setEditingAttribute(attribute);
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingAttribute(null);
    loadData(); // Refresh data after form submission
  };

  const attributeOptions = attributes
    .filter((attr) => attr.valueType === "INT" || attr.valueType === "FLOAT")
    .map((attr) => attr.title)
    .filter((title, index, array) => array.indexOf(title) === index);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Track not found.</p>
        <Button asChild className="mt-4">
          <Link href="/tracks">Back to Tracks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/tracks">
              <ArrowLeft className="mr-2 size-4" />
              Back to Tracks
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{track.title}</h1>
            {track.description && (
              <p className="text-muted-foreground">{track.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddAttribute} className="gap-2">
            <Plus className="size-4" />
            Add Attribute
          </Button>
        </div>
      </div>

      {/* Charts Section */}
      {(chartData.length > 0 || activityData.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Charts & Analytics
              </CardTitle>
              <div className="flex gap-2">
                {attributeOptions.length > 0 && (
                  <Select
                    value={selectedAttribute}
                    onValueChange={setSelectedAttribute}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {attributeOptions.map((attrTitle) => (
                        <SelectItem key={attrTitle} value={attrTitle}>
                          {attrTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select
                  value={chartPeriod}
                  onValueChange={(value: "week" | "month" | "year") =>
                    setChartPeriod(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TrackingCharts
              lineChartData={chartData}
              activityData={activityData}
              title={selectedAttribute}
            />
          </CardContent>
        </Card>
      )}

      {/* Attributes Grid */}
      <TrackAttributesDataGrid
        attributes={attributes}
        onEdit={handleEditAttribute}
        onAdd={handleAddAttribute}
        trackId={trackId}
      />

      {/* Add/Edit Attribute Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAttribute?.id === "new"
                ? "Add Attribute"
                : "Edit Attribute"}
            </DialogTitle>
          </DialogHeader>
          {editingAttribute && (
            <TrackAttributeForm
              attr={editingAttribute}
              className="space-y-4"
              trackId={trackId}
            />
          )}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={handleCloseDialog}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
