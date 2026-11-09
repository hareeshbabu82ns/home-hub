"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Zap, Cpu, MemoryStick, Gauge, Trash2, RefreshCw } from "lucide-react";

export default function PerformancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Performance</h1>
          <p className="text-muted-foreground">
            Optimize app performance and manage system resources
          </p>
        </div>
      </div>

      {/* System Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            System Performance
          </CardTitle>
          <CardDescription>
            Current system resource usage and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Cpu className="h-4 w-4" />
                  CPU Usage
                </span>
                <span className="text-muted-foreground text-sm">32%</span>
              </div>
              <Progress value={32} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <MemoryStick className="h-4 w-4" />
                  Memory Usage
                </span>
                <span className="text-muted-foreground text-sm">68%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">Good</p>
              <p className="text-muted-foreground text-xs">
                Overall Performance
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">2.3s</p>
              <p className="text-muted-foreground text-xs">Load Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">60</p>
              <p className="text-muted-foreground text-xs">FPS</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">847ms</p>
              <p className="text-muted-foreground text-xs">API Response</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Optimization
          </CardTitle>
          <CardDescription>
            Configure performance and resource management settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hardware-acceleration">
                Hardware acceleration
              </Label>
              <p className="text-muted-foreground text-sm">
                Use GPU acceleration for better performance
              </p>
            </div>
            <Switch id="hardware-acceleration" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="preload-content">Preload content</Label>
              <p className="text-muted-foreground text-sm">
                Preload frequently accessed content for faster loading
              </p>
            </div>
            <Switch id="preload-content" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="background-sync">Background sync</Label>
              <p className="text-muted-foreground text-sm">
                Sync data in the background for better responsiveness
              </p>
            </div>
            <Switch id="background-sync" />
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="animation-speed">Animation speed</Label>
              <span className="text-muted-foreground text-sm">Normal</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Manage application cache and temporary files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Application Cache</h4>
                  <p className="text-muted-foreground text-sm">127 MB</p>
                </div>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Image Cache</h4>
                  <p className="text-muted-foreground text-sm">89 MB</p>
                </div>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">API Cache</h4>
                  <p className="text-muted-foreground text-sm">23 MB</p>
                </div>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Temporary Files</h4>
                  <p className="text-muted-foreground text-sm">45 MB</p>
                </div>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Clear All Cache</h4>
              <p className="text-muted-foreground text-sm">
                Remove all cached data (284 MB total)
              </p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-optimization */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-optimization</CardTitle>
          <CardDescription>
            Automatic performance optimization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-cache-cleanup">
                Automatic cache cleanup
              </Label>
              <p className="text-muted-foreground text-sm">
                Automatically clear cache when it exceeds 500 MB
              </p>
            </div>
            <Switch id="auto-cache-cleanup" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smart-loading">Smart loading</Label>
              <p className="text-muted-foreground text-sm">
                Intelligently load content based on usage patterns
              </p>
            </div>
            <Switch id="smart-loading" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="power-saver">Power saver mode</Label>
              <p className="text-muted-foreground text-sm">
                Reduce performance for better battery life
              </p>
            </div>
            <Switch id="power-saver" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
