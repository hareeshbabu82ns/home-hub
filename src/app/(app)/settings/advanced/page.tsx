"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Code,
  Server,
  Database,
  Shield,
  AlertTriangle,
  Terminal,
  Plug,
  Clock,
} from "lucide-react";

export default function AdvancedPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Advanced Settings</h1>
          <p className="text-muted-foreground">
            Advanced configuration options for power users
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          These are advanced settings that can affect app functionality. Only
          modify these if you understand the implications.
        </AlertDescription>
      </Alert>

      {/* Developer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Developer Options
          </CardTitle>
          <CardDescription>
            Settings for developers and advanced debugging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="debug-mode">Debug mode</Label>
              <p className="text-muted-foreground text-sm">
                Enable detailed logging and error reporting
              </p>
            </div>
            <Switch id="debug-mode" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="console-logs">Console logging</Label>
              <p className="text-muted-foreground text-sm">
                Show detailed logs in browser console
              </p>
            </div>
            <Switch id="console-logs" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="source-maps">Enable source maps</Label>
              <p className="text-muted-foreground text-sm">
                Load source maps for better debugging
              </p>
            </div>
            <Switch id="source-maps" defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="log-level">Log level</Label>
            <Select defaultValue="info">
              <SelectTrigger id="log-level">
                <SelectValue placeholder="Select log level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="error">Error only</SelectItem>
                <SelectItem value="warn">Warning & Error</SelectItem>
                <SelectItem value="info">Info, Warning & Error</SelectItem>
                <SelectItem value="debug">Debug (All)</SelectItem>
                <SelectItem value="trace">Trace (Verbose)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure API endpoints and connection settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-base-url">API Base URL</Label>
            <Input
              id="api-base-url"
              placeholder="https://api.example.com"
              defaultValue="https://api.home-hub.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-timeout">Request timeout (seconds)</Label>
            <Input
              id="api-timeout"
              type="number"
              placeholder="30"
              defaultValue="30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retry-attempts">Retry attempts</Label>
            <Select defaultValue="3">
              <SelectTrigger id="retry-attempts">
                <SelectValue placeholder="Select retry attempts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 attempt</SelectItem>
                <SelectItem value="3">3 attempts</SelectItem>
                <SelectItem value="5">5 attempts</SelectItem>
                <SelectItem value="10">10 attempts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="api-caching">Enable API caching</Label>
              <p className="text-muted-foreground text-sm">
                Cache API responses for better performance
              </p>
            </div>
            <Switch id="api-caching" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Configuration
          </CardTitle>
          <CardDescription>Local database and storage settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="db-name">Database name</Label>
            <Input
              id="db-name"
              placeholder="home_hub_db"
              defaultValue="home_hub_db"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="db-version">Database version</Label>
            <Select defaultValue="1">
              <SelectTrigger id="db-version">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Version 1</SelectItem>
                <SelectItem value="2">Version 2</SelectItem>
                <SelectItem value="3">Version 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-backup">Automatic backups</Label>
              <p className="text-muted-foreground text-sm">
                Automatically backup database daily
              </p>
            </div>
            <Switch id="auto-backup" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compression">Enable compression</Label>
              <p className="text-muted-foreground text-sm">
                Compress data to save storage space
              </p>
            </div>
            <Switch id="compression" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Configuration
          </CardTitle>
          <CardDescription>
            Advanced security and encryption settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="strict-ssl">Strict SSL/TLS</Label>
              <p className="text-muted-foreground text-sm">
                Enforce strict SSL certificate validation
              </p>
            </div>
            <Switch id="strict-ssl" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="content-security">Content Security Policy</Label>
              <p className="text-muted-foreground text-sm">
                Enable enhanced content security policies
              </p>
            </div>
            <Switch id="content-security" defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="encryption-key">Encryption key (Base64)</Label>
            <Textarea
              id="encryption-key"
              placeholder="Enter encryption key..."
              className="font-mono text-sm"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cors-origins">Allowed CORS origins</Label>
            <Textarea
              id="cors-origins"
              placeholder="https://example.com&#10;https://app.example.com"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            System Integration
          </CardTitle>
          <CardDescription>
            Integration with system services and external tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system-notifications">System notifications</Label>
              <p className="text-muted-foreground text-sm">
                Use native system notification service
              </p>
            </div>
            <Switch id="system-notifications" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-updates">Automatic updates</Label>
              <p className="text-muted-foreground text-sm">
                Automatically check for and install updates
              </p>
            </div>
            <Switch id="auto-updates" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="update-channel">Update channel</Label>
            <Select defaultValue="stable">
              <SelectTrigger id="update-channel">
                <SelectValue placeholder="Select update channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="alpha">Alpha (Experimental)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Current system and application information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm font-medium">App Version</p>
              <Badge variant="secondary">v1.0.0</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Node Version</p>
              <Badge variant="secondary">v20.11.0</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Build</p>
              <Badge variant="secondary">Production</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <Badge variant="secondary">2 days ago</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Environment Variables</p>
            <div className="bg-muted rounded-md p-3 font-mono text-xs">
              <div>NODE_ENV=production</div>
              <div>API_URL=https://api.home-hub.com</div>
              <div>DATABASE_URL=***hidden***</div>
              <div>NEXTAUTH_URL=https://home-hub.com</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset and Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Maintenance & Reset
          </CardTitle>
          <CardDescription>
            System maintenance and reset options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start">
              Export all settings
            </Button>
            <Button variant="outline" className="justify-start">
              Import settings
            </Button>
            <Button variant="outline" className="justify-start">
              Reset to defaults
            </Button>
            <Button variant="destructive" className="justify-start">
              Factory reset
            </Button>
          </div>

          <Separator />

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Factory reset will permanently delete all data and settings. This
              action cannot be undone.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button>Save Changes</Button>
        <Button variant="outline">Validate Configuration</Button>
        <Button variant="outline">Export Config</Button>
      </div>
    </div>
  );
}
