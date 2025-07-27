"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchRecentAttributeTitles,
  fetchFrequentAttributeTitles,
} from "../actions";

interface QuickEntryPanelProps {
  onQuickEntry: (attributeTitle: string) => void;
}

export function QuickEntryPanel({ onQuickEntry }: QuickEntryPanelProps) {
  const [recentAttributes, setRecentAttributes] = useState<string[]>([]);
  const [frequentAttributes, setFrequentAttributes] = useState<
    Array<{ title: string; count: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuickEntryData = async () => {
      try {
        const [recent, frequent] = await Promise.all([
          fetchRecentAttributeTitles(8),
          fetchFrequentAttributeTitles(8),
        ]);
        setRecentAttributes(recent);
        setFrequentAttributes(frequent);
      } catch (error) {
        console.error("Error loading quick entry data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuickEntryData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" />
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

  const hasRecentAttributes = recentAttributes.length > 0;
  const hasFrequentAttributes = frequentAttributes.length > 0;

  if (!hasRecentAttributes && !hasFrequentAttributes) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-4" />
          Quick Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent" className="flex items-center gap-1">
              <Clock className="size-3" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="frequent" className="flex items-center gap-1">
              <TrendingUp className="size-3" />
              Frequent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-4">
            {hasRecentAttributes ? (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Recently used attributes (last 30 days)
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentAttributes.map((title) => (
                    <Button
                      key={title}
                      variant="outline"
                      size="sm"
                      onClick={() => onQuickEntry(title)}
                      className="h-8 text-xs"
                    >
                      {title}
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
            {hasFrequentAttributes ? (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Most frequently used attributes
                </p>
                <div className="flex flex-wrap gap-2">
                  {frequentAttributes.map(({ title, count }) => (
                    <Button
                      key={title}
                      variant="outline"
                      size="sm"
                      onClick={() => onQuickEntry(title)}
                      className="flex h-8 items-center gap-1 text-xs"
                    >
                      {title}
                      <Badge
                        variant="secondary"
                        className="ml-1 px-1 py-0 text-xs"
                      >
                        {count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-muted-foreground text-sm">
                  No frequent attributes found
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
