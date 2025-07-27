"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  TrendingUp,
  Plus,
  Zap,
  Hash,
  Type,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrackDrawerDialog } from "./edit-drawer-dlg";
import { AttributeTitleCombobox } from "./attribute-title-combobox";
import {
  fetchQuickEntryAttributes,
  createTrackItemAttribute,
  fetchTrackItems,
  fetchAttributeDetailsByTitle,
} from "../actions";
import type { TrackAttributeValueType } from "@/app/generated/prisma";
import type { TrackItemWithAttributes } from "@/types/track";
import { cn } from "@/lib/utils";

interface QuickEntrySectionProps {
  className?: string;
}

interface QuickEntryAttribute {
  title: string;
  valueType: TrackAttributeValueType;
  count: number;
  lastValue?: string;
  isRecent: boolean;
}

export function QuickEntrySection({ className }: QuickEntrySectionProps) {
  const [quickEntryAttributes, setQuickEntryAttributes] = useState<
    QuickEntryAttribute[]
  >([]);
  const [tracks, setTracks] = useState<TrackItemWithAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [selectedAttribute, setSelectedAttribute] =
    useState<QuickEntryAttribute | null>(null);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom attribute form state
  const [customTitle, setCustomTitle] = useState("");
  const [customValueType, setCustomValueType] =
    useState<TrackAttributeValueType>("STRING");
  const [customValue, setCustomValue] = useState("");
  const [isCustomSubmitting, setIsCustomSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attributes, trackItems] = await Promise.all([
          fetchQuickEntryAttributes(16),
          fetchTrackItems(),
        ]);
        setQuickEntryAttributes(attributes);
        setTracks(trackItems);

        // Auto-select first track if available
        if (trackItems.length > 0) {
          setSelectedTrack(trackItems[0].id);
        }
      } catch (error) {
        console.error("Error loading quick entry data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-update attribute type when custom title changes to an existing attribute
  useEffect(() => {
    const updateAttributeType = async () => {
      if (customTitle.trim().length === 0) {
        return;
      }

      try {
        const attributeDetails = await fetchAttributeDetailsByTitle(
          customTitle.trim(),
        );
        if (attributeDetails) {
          setCustomValueType(attributeDetails.valueType);
        }
      } catch (error) {
        console.error("Error fetching attribute details:", error);
      }
    };

    // Debounce the API call to avoid too frequent requests
    const timeoutId = setTimeout(updateAttributeType, 300);
    return () => clearTimeout(timeoutId);
  }, [customTitle]);

  const handleAttributeSelect = (attribute: QuickEntryAttribute) => {
    setSelectedAttribute(attribute);

    // Set smart default value based on type and last value
    if (attribute.valueType === "DATETIME") {
      setValue(new Date().toISOString().slice(0, 16));
    } else if (attribute.valueType === "STRING") {
      setValue(""); // Always start fresh for strings
    } else if (attribute.lastValue) {
      setValue(attribute.lastValue);
    } else {
      setValue("");
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack || !selectedAttribute) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("trackId", selectedTrack);
      formData.append("title", selectedAttribute.title);
      formData.append("value", value);
      formData.append("valueType", selectedAttribute.valueType);

      const result = await createTrackItemAttribute({ message: "" }, formData);

      if (result.success) {
        setValue("");
        setSelectedAttribute(null);
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating track attribute:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack || !customTitle.trim()) return;

    setIsCustomSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("trackId", selectedTrack);
      formData.append("title", customTitle.trim());
      formData.append("value", customValue);
      formData.append("valueType", customValueType);

      const result = await createTrackItemAttribute({ message: "" }, formData);

      if (result.success) {
        setCustomTitle("");
        setCustomValue("");
        setCustomValueType("STRING");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating custom track attribute:", error);
    } finally {
      setIsCustomSubmitting(false);
    }
  };

  const getAttributeIcon = (valueType: TrackAttributeValueType) => {
    switch (valueType) {
      case "INT":
        return <Hash className="size-3" />;
      case "FLOAT":
        return <TrendingUp className="size-3" />;
      case "DATETIME":
        return <Calendar className="size-3" />;
      case "DURATION":
        return <Clock className="size-3" />;
      case "STRING":
      default:
        return <Type className="size-3" />;
    }
  };

  const getAttributeColor = (valueType: TrackAttributeValueType) => {
    switch (valueType) {
      case "STRING":
        return "text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-300";
      case "INT":
        return "text-green-600 bg-green-50 border-green-200 hover:border-green-300";
      case "FLOAT":
        return "text-purple-600 bg-purple-50 border-purple-200 hover:border-purple-300";
      case "DATETIME":
        return "text-orange-600 bg-orange-50 border-orange-200 hover:border-orange-300";
      case "DURATION":
        return "text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-300";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 hover:border-gray-300";
    }
  };

  const getInputType = () => {
    if (!selectedAttribute) return "text";
    switch (selectedAttribute.valueType) {
      case "INT":
      case "FLOAT":
        return "number";
      case "DATETIME":
        return "datetime-local";
      default:
        return "text";
    }
  };

  const getValuePlaceholder = () => {
    if (!selectedAttribute) return "Enter value";
    switch (selectedAttribute.valueType) {
      case "STRING":
        return "Enter text value";
      case "INT":
        return "Enter integer value";
      case "FLOAT":
        return "Enter decimal value";
      case "DATETIME":
        return "Select date and time";
      case "DURATION":
        return "Enter duration (HH:MM)";
      default:
        return "Enter value";
    }
  };

  const getCustomInputType = () => {
    switch (customValueType) {
      case "INT":
      case "FLOAT":
        return "number";
      case "DATETIME":
        return "datetime-local";
      default:
        return "text";
    }
  };

  const getCustomValuePlaceholder = () => {
    switch (customValueType) {
      case "STRING":
        return "Enter text value";
      case "INT":
        return "Enter integer value";
      case "FLOAT":
        return "Enter decimal value";
      case "DATETIME":
        return "Select date and time";
      case "DURATION":
        return "Enter duration (HH:MM)";
      default:
        return "Enter value";
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4" />
            Quick Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="text-muted-foreground text-sm">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentAttributes = quickEntryAttributes.filter((attr) => attr.isRecent);
  const hasAnyAttributes = quickEntryAttributes.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4" />
            Quick Entry
          </CardTitle>
          <TrackDrawerDialog
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="mr-2 size-4" />
                Custom
              </Button>
            }
            title="Add Custom Attribute"
          >
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="track-select">Track</Label>
                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a track" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-title">Attribute Name</Label>
                <AttributeTitleCombobox
                  value={customTitle}
                  onValueChange={setCustomTitle}
                  placeholder="Enter or select attribute name..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valueType">Type</Label>
                <Select
                  value={customValueType}
                  onValueChange={(value) =>
                    setCustomValueType(value as TrackAttributeValueType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STRING">📝 Text</SelectItem>
                    <SelectItem value="INT">🔢 Integer</SelectItem>
                    <SelectItem value="FLOAT">💯 Decimal</SelectItem>
                    <SelectItem value="DATETIME">📅 Date & Time</SelectItem>
                    <SelectItem value="DURATION">
                      ⏱️ Duration (HH:MM)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-value">Value</Label>
                <Input
                  id="custom-value"
                  type={getCustomInputType()}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={getCustomValuePlaceholder()}
                  step={customValueType === "FLOAT" ? "0.01" : undefined}
                />
              </div>

              <Button
                type="submit"
                disabled={
                  isCustomSubmitting || !customTitle.trim() || !selectedTrack
                }
              >
                {isCustomSubmitting ? "Adding..." : "Add Attribute"}
              </Button>
            </form>
          </TrackDrawerDialog>
        </div>
      </CardHeader>
      <CardContent>
        {!hasAnyAttributes ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground text-sm">
              No recent or frequent attributes found. Start tracking to see
              quick entry options.
            </p>
          </div>
        ) : (
          <>
            {tracks.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-muted-foreground text-sm">
                  No tracks found. Create a track first to use quick entry.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Track Selection */}
                <div className="space-y-2">
                  <Label htmlFor="track-quick-select">Track</Label>
                  <Select
                    value={selectedTrack}
                    onValueChange={setSelectedTrack}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a track" />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Entry Form */}
                {selectedAttribute && (
                  <form
                    onSubmit={handleQuickSubmit}
                    className="bg-muted/50 space-y-3 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "flex items-center gap-1",
                          getAttributeColor(selectedAttribute.valueType),
                        )}
                      >
                        {getAttributeIcon(selectedAttribute.valueType)}
                        {selectedAttribute.title}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAttribute(null)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Input
                        type={getInputType()}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={getValuePlaceholder()}
                        step={
                          selectedAttribute.valueType === "FLOAT"
                            ? "0.01"
                            : undefined
                        }
                        className="h-9"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting || !selectedTrack}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-white">
                            &nbsp;
                          </div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 size-3" />
                          Add Entry
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Attribute Selection Tabs */}
                <Tabs defaultValue="recent" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="recent"
                      className="flex items-center gap-1"
                    >
                      <Clock className="size-3" />
                      Recent
                    </TabsTrigger>
                    <TabsTrigger
                      value="frequent"
                      className="flex items-center gap-1"
                    >
                      <TrendingUp className="size-3" />
                      All
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="recent" className="mt-4">
                    {recentAttributes.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-xs">
                          Recently used (last 30 days)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {recentAttributes.map((attr) => (
                            <Button
                              key={`${attr.title}-${attr.valueType}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleAttributeSelect(attr)}
                              className={cn(
                                "flex h-8 items-center gap-1 text-xs",
                                getAttributeColor(attr.valueType),
                              )}
                            >
                              {getAttributeIcon(attr.valueType)}
                              {attr.title}
                              <Badge
                                variant="secondary"
                                className="ml-1 px-1 py-0 text-xs"
                              >
                                {attr.count}
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-muted-foreground text-sm">
                          No recent attributes found
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="frequent" className="mt-4">
                    {quickEntryAttributes.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-xs">
                          All attributes (sorted by usage)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {quickEntryAttributes.map((attr) => (
                            <Button
                              key={`${attr.title}-${attr.valueType}`}
                              variant="outline"
                              size="sm"
                              onClick={() => handleAttributeSelect(attr)}
                              className={cn(
                                "flex h-8 items-center gap-1 text-xs",
                                getAttributeColor(attr.valueType),
                              )}
                            >
                              {getAttributeIcon(attr.valueType)}
                              {attr.title}
                              <Badge
                                variant="secondary"
                                className="ml-1 px-1 py-0 text-xs"
                              >
                                {attr.count}
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-muted-foreground text-sm">
                          No attributes found
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
