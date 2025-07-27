"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QuickEntryPanel } from "./quick-entry-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createTrackItemAttribute,
  fetchTrackItems,
  fetchUniqueAttributeTitles,
  fetchAttributeDetailsByTitle,
} from "../actions";
import type { TrackAttributeValueType } from "@/app/generated/prisma";
import type {
  TrackItemWithAttributes,
  QuickEntryAttribute,
} from "@/types/track";

interface QuickEntryPanelWrapperProps {
  className?: string;
}

export function QuickEntryPanelWrapper({
  className,
}: QuickEntryPanelWrapperProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [selectedTrackTitle, setSelectedTrackTitle] = useState<string>("");
  const [selectedAttributeTitle, setSelectedAttributeTitle] =
    useState<string>("");
  const [tracks, setTracks] = useState<TrackItemWithAttributes[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [valueType, setValueType] = useState<TrackAttributeValueType>("STRING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom entry state
  const [customTrackId, setCustomTrackId] = useState<string>("");
  const [customTitle, setCustomTitle] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [customValueType, setCustomValueType] =
    useState<TrackAttributeValueType>("STRING");
  const [isCustomSubmitting, setIsCustomSubmitting] = useState(false);

  // Autocomplete state
  const [attributeSuggestions, setAttributeSuggestions] = useState<string[]>(
    [],
  );
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // Refresh trigger for QuickEntryPanel
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load tracks on mount
  useEffect(() => {
    const loadTracks = async () => {
      try {
        const tracksData = await fetchTrackItems();
        setTracks(tracksData);
        if (tracksData.length > 0) {
          setCustomTrackId(tracksData[0].id);
        }
      } catch (error) {
        console.error("Error loading tracks:", error);
      }
    };
    loadTracks();
  }, []);

  // Load attribute suggestions when custom title changes
  useEffect(() => {
    const loadSuggestions = async () => {
      if (customTitle.length === 0) {
        setAttributeSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const suggestions = await fetchUniqueAttributeTitles(
          undefined,
          customTitle,
        );
        setAttributeSuggestions(suggestions);
      } catch (error) {
        console.error("Error loading attribute suggestions:", error);
        setAttributeSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(loadSuggestions, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [customTitle]);

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!customTitle) return attributeSuggestions;
    return attributeSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(customTitle.toLowerCase()),
    );
  }, [attributeSuggestions, customTitle]);

  // Handle attribute selection from suggestions
  const handleAttributeSelect = async (selectedTitle: string) => {
    setCustomTitle(selectedTitle);
    setIsComboboxOpen(false);

    // Fetch the most common value type for this attribute title
    try {
      const attributeDetails =
        await fetchAttributeDetailsByTitle(selectedTitle);
      if (attributeDetails) {
        setCustomValueType(attributeDetails.valueType);
      }
    } catch (error) {
      console.error("Error fetching attribute details:", error);
    }
  };

  const handleQuickEntry = (attribute: QuickEntryAttribute) => {
    setSelectedAttributeTitle(attribute.title);
    setSelectedTrackId(attribute.trackId);
    setSelectedTrackTitle(attribute.trackTitle);
    setTitle(attribute.title);
    setValueType(attribute.valueType);

    // Set the last value as a placeholder to help the user
    if (attribute.lastValue) {
      setValue(attribute.lastValue);
    }

    setIsDialogOpen(true);
  };

  const handleCustomEntry = () => {
    setIsCustomDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedAttributeTitle("");
    setSelectedTrackId("");
    setSelectedTrackTitle("");
    setTitle("");
    setValue("");
    setValueType("STRING");
  };

  const handleCustomDialogClose = () => {
    setIsCustomDialogOpen(false);
    setCustomTrackId(tracks.length > 0 ? tracks[0].id : "");
    setCustomTitle("");
    setCustomValue("");
    setCustomValueType("STRING");
    setAttributeSuggestions([]);
    setIsComboboxOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedTrackId) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("trackId", selectedTrackId);
      formData.append("title", title.trim());
      formData.append("value", value);
      formData.append("valueType", valueType);

      const result = await createTrackItemAttribute({ message: "" }, formData);

      if (result.success) {
        handleDialogClose();
        setRefreshTrigger((prev) => prev + 1); // Refresh the QuickEntryPanel
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
    if (!customTitle.trim() || !customTrackId) return;

    setIsCustomSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("trackId", customTrackId);
      formData.append("title", customTitle.trim());
      formData.append("value", customValue);
      formData.append("valueType", customValueType);

      const result = await createTrackItemAttribute({ message: "" }, formData);

      if (result.success) {
        handleCustomDialogClose();
        setRefreshTrigger((prev) => prev + 1); // Refresh the QuickEntryPanel
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating custom track attribute:", error);
    } finally {
      setIsCustomSubmitting(false);
    }
  };

  const getInputType = () => {
    switch (valueType) {
      case "INT":
      case "FLOAT":
        return "number";
      case "DATETIME":
        return "datetime-local";
      case "DURATION":
        return "text";
      default:
        return "text";
    }
  };

  const getValuePlaceholder = () => {
    switch (valueType) {
      case "STRING":
        return "Enter text value";
      case "INT":
        return "Enter integer value";
      case "FLOAT":
        return "Enter decimal value";
      case "DATETIME":
        return "Select date and time";
      case "DURATION":
        return "HH:MM (e.g., 02:30)";
      default:
        return "Enter value";
    }
  };

  const getInputProps = () => {
    switch (valueType) {
      case "FLOAT":
        return { step: "0.01" };
      case "DURATION":
        return {
          pattern: "^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$",
          maxLength: 5,
        };
      default:
        return {};
    }
  };

  const getCustomInputType = () => {
    switch (customValueType) {
      case "INT":
      case "FLOAT":
        return "number";
      case "DATETIME":
        return "datetime-local";
      case "DURATION":
        return "text";
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
        return "HH:MM (e.g., 02:30)";
      default:
        return "Enter value";
    }
  };

  const getCustomInputProps = () => {
    switch (customValueType) {
      case "FLOAT":
        return { step: "0.01" };
      case "DURATION":
        return {
          pattern: "^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$",
          maxLength: 5,
        };
      default:
        return {};
    }
  };

  return (
    <div className={className}>
      <QuickEntryPanel
        onQuickEntry={handleQuickEntry}
        onCustomEntry={handleCustomEntry}
        refreshTrigger={refreshTrigger}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Add: {selectedAttributeTitle}</DialogTitle>
            {selectedTrackTitle && (
              <p className="text-muted-foreground text-sm">
                Track: {selectedTrackTitle}
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Attribute Name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter attribute name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valueType">Type</Label>
              <Select
                value={valueType}
                onValueChange={(value) =>
                  setValueType(value as TrackAttributeValueType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRING">Text</SelectItem>
                  <SelectItem value="INT">Integer</SelectItem>
                  <SelectItem value="FLOAT">Decimal</SelectItem>
                  <SelectItem value="DATETIME">Date & Time</SelectItem>
                  <SelectItem value="DURATION">
                    Duration (Hours:Minutes)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              {valueType === "DURATION" ? (
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground mb-2 text-sm">
                    Use timer controls or enter duration manually:
                  </p>
                  <Input
                    id="value"
                    type={getInputType()}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={getValuePlaceholder()}
                    {...getInputProps()}
                    className="mb-2"
                  />
                  <p className="text-muted-foreground text-xs">
                    Or start a new timer for this attribute
                  </p>
                </div>
              ) : (
                <Input
                  id="value"
                  type={getInputType()}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={getValuePlaceholder()}
                  {...getInputProps()}
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex-1"
              >
                {isSubmitting ? "Adding..." : "Add Entry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Entry Dialog */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Attribute</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="track-select">Track</Label>
              <Select value={customTrackId} onValueChange={setCustomTrackId}>
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
              <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isComboboxOpen}
                    className="w-full justify-between"
                  >
                    {customTitle || "Enter or select attribute name..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search or type new attribute name..."
                      value={customTitle}
                      onValueChange={setCustomTitle}
                    />
                    <CommandEmpty>
                      {isLoadingSuggestions
                        ? "Loading..."
                        : "Type to create new attribute"}
                    </CommandEmpty>
                    <CommandList>
                      {filteredSuggestions.length > 0 && (
                        <CommandGroup>
                          {filteredSuggestions.map((suggestion) => (
                            <CommandItem
                              key={suggestion}
                              value={suggestion}
                              onSelect={handleAttributeSelect}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  customTitle === suggestion
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {suggestion}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-valueType">Type</Label>
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
                  <SelectItem value="STRING">Text</SelectItem>
                  <SelectItem value="INT">Integer</SelectItem>
                  <SelectItem value="FLOAT">Decimal</SelectItem>
                  <SelectItem value="DATETIME">Date & Time</SelectItem>
                  <SelectItem value="DURATION">
                    Duration (Hours:Minutes)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-value">Value</Label>
              {customValueType === "DURATION" ? (
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground mb-2 text-sm">
                    Use timer controls or enter duration manually:
                  </p>
                  <Input
                    id="custom-value"
                    type={getCustomInputType()}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={getCustomValuePlaceholder()}
                    {...getCustomInputProps()}
                    className="mb-2"
                  />
                  <p className="text-muted-foreground text-xs">
                    Or start a new timer for this attribute
                  </p>
                </div>
              ) : (
                <Input
                  id="custom-value"
                  type={getCustomInputType()}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={getCustomValuePlaceholder()}
                  {...getCustomInputProps()}
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCustomDialogClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isCustomSubmitting || !customTitle.trim() || !customTrackId
                }
                className="flex-1"
              >
                {isCustomSubmitting ? "Adding..." : "Add Attribute"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
