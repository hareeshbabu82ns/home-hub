"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  Database, 
  HardDrive, 
  FileText,
  Image,
  Video,
  Music
} from "lucide-react";

export default function DataManagementPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Data Management</h1>
          <p className="text-muted-foreground">
            Import, export, and manage your application data
          </p>
        </div>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
          <CardDescription>
            Monitor your data usage and storage consumption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Storage Used</span>
              <span className="text-sm text-muted-foreground">2.4 GB of 10 GB</span>
            </div>
            <Progress value={24} className="h-2" />
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Documents</p>
                <p className="text-xs text-muted-foreground">1.2 GB</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Images</p>
                <p className="text-xs text-muted-foreground">800 MB</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Videos</p>
                <p className="text-xs text-muted-foreground">300 MB</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Audio</p>
                <p className="text-xs text-muted-foreground">100 MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download your data in various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h4 className="font-medium">Complete Data Export</h4>
                <p className="text-sm text-muted-foreground">
                  Export all your data including files and settings
                </p>
              </div>
              <Button size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h4 className="font-medium">Settings Only</h4>
                <p className="text-sm text-muted-foreground">
                  Export just your app settings and preferences
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h4 className="font-medium">User Data</h4>
                <p className="text-sm text-muted-foreground">
                  Export your personal data and content
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h4 className="font-medium">Activity Logs</h4>
                <p className="text-sm text-muted-foreground">
                  Export your activity and usage history
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Import data from other applications or previous exports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <div>
                <h4 className="font-medium">Import Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Restore your app settings from a backup
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>
            
            <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <div>
                <h4 className="font-medium">Import Content</h4>
                <p className="text-sm text-muted-foreground">
                  Import your content and files
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>
          </div>
          
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium">Supported Formats</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">JSON</Badge>
              <Badge variant="secondary">CSV</Badge>
              <Badge variant="secondary">XML</Badge>
              <Badge variant="secondary">ZIP</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Management
          </CardTitle>
          <CardDescription>
            Advanced database operations and maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <Database className="mr-2 h-4 w-4" />
              Optimize Database
            </Button>
            <Button variant="outline" className="justify-start">
              <HardDrive className="mr-2 h-4 w-4" />
              Clear Cache
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Vacuum Database
            </Button>
          </div>
          
          <Separator />
          
          <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950/20">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Database Statistics
            </h4>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-yellow-700 dark:text-yellow-300 sm:grid-cols-4">
              <div>
                <p className="font-medium">Tables: 12</p>
              </div>
              <div>
                <p className="font-medium">Records: 1,247</p>
              </div>
              <div>
                <p className="font-medium">Size: 45.2 MB</p>
              </div>
              <div>
                <p className="font-medium">Last Backup: 2 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
