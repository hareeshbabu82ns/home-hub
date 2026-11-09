"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchUniqueAttributeTitles } from "../actions";

interface AttributeTitleComboboxProps {
  value: string;
  onValueChange: (_value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AttributeTitleCombobox({
  value,
  onValueChange,
  placeholder = "Select or type attribute name...",
  className,
}: AttributeTitleComboboxProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const titles = await fetchUniqueAttributeTitles();
        setSuggestions(titles);
      } catch (error) {
        console.error("Error loading attribute suggestions:", error);
      }
    };
    loadSuggestions();
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredSuggestions = suggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue;
    onValueChange(newValue);
    setInputValue(newValue);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onValueChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {inputValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-[300px] w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Search attributes..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandEmpty>
            {inputValue ? (
              <div className="p-2 text-sm">
                Create &ldquo;{inputValue}&rdquo; as new attribute
              </div>
            ) : (
              "No attributes found."
            )}
          </CommandEmpty>
          {filteredSuggestions.length > 0 && (
            <CommandGroup heading="Existing Attributes">
              {filteredSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  onSelect={() => handleSelect(suggestion)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === suggestion ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
