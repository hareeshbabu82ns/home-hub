"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, Volume2, MousePointer, Keyboard, Type } from "lucide-react";

export default function AccessibilityPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Accessibility</h1>
          <p className="text-muted-foreground">
            Configure accessibility features to improve your experience
          </p>
        </div>
      </div>

      {/* Visual Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Accessibility
          </CardTitle>
          <CardDescription>
            Adjust visual elements for better readability and navigation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">High contrast mode</Label>
              <p className="text-muted-foreground text-sm">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch id="high-contrast" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="focus-indicators">
                Enhanced focus indicators
              </Label>
              <p className="text-muted-foreground text-sm">
                Make focus indicators more visible
              </p>
            </div>
            <Switch id="focus-indicators" defaultChecked />
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="text-size">Text size</Label>
              <span className="text-muted-foreground text-sm">Medium</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="font-family">Font family</Label>
            <Select defaultValue="system">
              <SelectTrigger id="font-family">
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System Default</SelectItem>
                <SelectItem value="inter">Inter (Recommended)</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="open-sans">Open Sans</SelectItem>
                <SelectItem value="dyslexic">OpenDyslexic</SelectItem>
                <SelectItem value="atkinson">Atkinson Hyperlegible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Motor Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            Motor & Navigation
          </CardTitle>
          <CardDescription>
            Adjust interaction and navigation preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sticky-keys">Sticky keys simulation</Label>
              <p className="text-muted-foreground text-sm">
                Allow modifier keys to remain active
              </p>
            </div>
            <Switch id="sticky-keys" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="click-assistance">Click assistance</Label>
              <p className="text-muted-foreground text-sm">
                Add hover delays and click confirmations
              </p>
            </div>
            <Switch id="click-assistance" />
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="click-target-size">Click target size</Label>
              <span className="text-muted-foreground text-sm">Normal</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Compact</span>
              <span>Large</span>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="hover-delay">Hover delay</Label>
              <span className="text-muted-foreground text-sm">500ms</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>No delay</span>
              <span>2 seconds</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Navigation
          </CardTitle>
          <CardDescription>
            Configure keyboard shortcuts and navigation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tab-navigation">Enhanced tab navigation</Label>
              <p className="text-muted-foreground text-sm">
                Improve keyboard navigation with skip links
              </p>
            </div>
            <Switch id="tab-navigation" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="keyboard-shortcuts">
                Show keyboard shortcuts
              </Label>
              <p className="text-muted-foreground text-sm">
                Display keyboard shortcuts in tooltips
              </p>
            </div>
            <Switch id="keyboard-shortcuts" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="escape-key">Escape key behavior</Label>
              <p className="text-muted-foreground text-sm">
                Use Escape key to close dialogs and menus
              </p>
            </div>
            <Switch id="escape-key" defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="tab-cycling">Tab key cycling</Label>
            <Select defaultValue="all">
              <SelectTrigger id="tab-cycling">
                <SelectValue placeholder="Select tab behavior" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All interactive elements</SelectItem>
                <SelectItem value="buttons-links">
                  Buttons and links only
                </SelectItem>
                <SelectItem value="custom">Custom selection</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audio & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio & Alerts
          </CardTitle>
          <CardDescription>
            Configure audio feedback and alert preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-feedback">Sound feedback</Label>
              <p className="text-muted-foreground text-sm">
                Play sounds for actions and notifications
              </p>
            </div>
            <Switch id="sound-feedback" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="visual-alerts">Visual alerts</Label>
              <p className="text-muted-foreground text-sm">
                Show visual indicators instead of audio alerts
              </p>
            </div>
            <Switch id="visual-alerts" defaultChecked />
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="alert-duration">Alert duration</Label>
              <span className="text-muted-foreground text-sm">5 seconds</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>2 seconds</span>
              <span>Never dismiss</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screen Reader */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Screen Reader Support
          </CardTitle>
          <CardDescription>
            Optimize the experience for screen readers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="announce-changes">Announce dynamic changes</Label>
              <p className="text-muted-foreground text-sm">
                Announce content changes to screen readers
              </p>
            </div>
            <Switch id="announce-changes" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="detailed-descriptions">
                Detailed descriptions
              </Label>
              <p className="text-muted-foreground text-sm">
                Provide detailed descriptions for images and UI elements
              </p>
            </div>
            <Switch id="detailed-descriptions" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="skip-links">Skip navigation links</Label>
              <p className="text-muted-foreground text-sm">
                Add skip links for faster navigation
              </p>
            </div>
            <Switch id="skip-links" defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="verbosity">Screen reader verbosity</Label>
            <Select defaultValue="medium">
              <SelectTrigger id="verbosity">
                <SelectValue placeholder="Select verbosity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="verbose">Verbose</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Accessibility Actions</CardTitle>
          <CardDescription>
            Quick access to common accessibility features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start">
              Reset all accessibility settings
            </Button>
            <Button variant="outline" className="justify-start">
              Run accessibility checker
            </Button>
            <Button variant="outline" className="justify-start">
              Export accessibility profile
            </Button>
            <Button variant="outline" className="justify-start">
              Import accessibility profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button>Save Changes</Button>
        <Button variant="outline">Test Accessibility</Button>
      </div>
    </div>
  );
}
