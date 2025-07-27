"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Search,
  Hash,
  TrendingUp,
  Calendar,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DurationTimer } from "./duration-timer";
import {
  fetchQuickEntryAttributesWithTracks,
  getRunningTimers,
} from "../actions";
import type {
  TrackAttributeValueType,
  TrackAttributes,
} from "@/app/generated/prisma";
import type { QuickEntryAttribute, RunningTimer } from "@/types/track";

interface QuickEntryPanelProps {
  onQuickEntry: (attribute: QuickEntryAttribute) => void;
  onCustomEntry?: () => void;
  refreshTrigger?: number;
}

export function QuickEntryPanel({
  onQuickEntry,
  onCustomEntry,
  refreshTrigger,
}: QuickEntryPanelProps) {
  const [attributes, setAttributes] = useState<QuickEntryAttribute[]>([]);
  const [runningTimers, setRunningTimers] = useState<RunningTimer[]>([]);
  const [filteredAttributes, setFilteredAttributes] = useState<
    QuickEntryAttribute[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadQuickEntryData = async () => {
      try {
        const [attributesData, timersData] = await Promise.all([
          fetchQuickEntryAttributesWithTracks(20),
          getRunningTimers(),
        ]);
        setAttributes(attributesData);
        setRunningTimers(timersData);
        setFilteredAttributes(attributesData);
      } catch (error) {
        console.error("Error loading quick entry data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuickEntryData();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAttributes(attributes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = attributes.filter(
        (attr) =>
          attr.title.toLowerCase().includes(query) ||
          attr.trackTitle.toLowerCase().includes(query) ||
          attr.valueType.toLowerCase().includes(query) ||
          (attr.lastValue && attr.lastValue.toLowerCase().includes(query)),
      );
      setFilteredAttributes(filtered);
    }
  }, [searchQuery, attributes]);

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

  const getValueTypeColor = (valueType: TrackAttributeValueType) => {
    switch (valueType) {
      case "STRING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "INT":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "FLOAT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "DATETIME":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "DURATION":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4" />
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

  if (attributes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-4" />
              Quick Entry
            </CardTitle>
            {onCustomEntry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCustomEntry}
                className="flex items-center gap-1"
              >
                <Plus className="size-3" />
                Custom
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <p className="text-muted-foreground text-sm">
              No tracking data yet. Start creating tracks and adding attributes
              to see quick entry options.
            </p>
            {onCustomEntry && (
              <p className="text-muted-foreground mt-2 text-xs">
                Use the "Custom" button to add your first attribute.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4" />
            Quick Entry
          </CardTitle>
          {onCustomEntry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCustomEntry}
              className="flex items-center gap-1"
            >
              <Plus className="size-3" />
              Custom
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search attributes or tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Running Timers Section */}
        {runningTimers.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">
              Running Timers ({runningTimers.length})
            </p>
            <div className="space-y-2">
              {runningTimers.map((timer) => (
                <div
                  key={timer.id}
                  className="flex items-center justify-between rounded-lg border bg-green-50 p-3 dark:bg-green-900/10"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{timer.title}</p>
                                        <p className="text-xs text-muted-foreground">
                      {timer.trackItem?.title || "Track Timer"}
                    </p>
                  </div>
                  <DurationTimer
                    attribute={timer}
                    onTimerUpdate={() => {
                      // Reload data after timer update
                      const reload = async () => {
                        try {
                          const [attributesData, timersData] =
                            await Promise.all([
                              fetchQuickEntryAttributesWithTracks(20),
                              getRunningTimers(),
                            ]);
                          setAttributes(attributesData);
                          setRunningTimers(timersData);
                          setFilteredAttributes(attributesData);
                        } catch (error) {
                          console.error("Error reloading data:", error);
                        }
                      };
                      reload();
                    }}
                    className="ml-2"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attribute Badges */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Recent attributes ({filteredAttributes.length})
            </p>
          </div>

          {filteredAttributes.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground text-sm">
                No attributes found matching your search
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAttributes.map((attr) => (
                <Button
                  key={`${attr.trackId}-${attr.title}-${attr.valueType}`}
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickEntry(attr)}
                  className="group hover:bg-muted/50 flex h-auto min-h-[2.5rem] flex-col items-start gap-1 p-2 text-left transition-all"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {getAttributeIcon(attr.valueType)}
                      <span className="text-xs font-medium">{attr.title}</span>
                    </div>
                    <Badge variant="secondary" className="px-1 py-0 text-xs">
                      {attr.count}
                    </Badge>
                  </div>

                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-muted-foreground truncate text-xs">
                      {attr.trackTitle}
                    </span>
                    <Badge
                      className={`px-1 py-0 text-xs ${getValueTypeColor(attr.valueType)}`}
                    >
                      {attr.valueType}
                    </Badge>
                  </div>

                  {attr.lastValue && (
                    <div className="text-muted-foreground text-xs">
                      Last:{" "}
                      {attr.lastValue.length > 15
                        ? `${attr.lastValue.slice(0, 15)}...`
                        : attr.lastValue}
                    </div>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
