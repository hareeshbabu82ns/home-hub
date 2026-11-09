"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface MongoDBConnectionModalProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onConnect: (_connectionString: string) => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

export function MongoDBConnectionModal({
  open,
  onOpenChange,
  onConnect,
  isConnecting,
  error,
}: MongoDBConnectionModalProps) {
  const [connectionString, setConnectionString] = useState("");

  const handleConnect = async () => {
    if (!connectionString.trim()) {
      return;
    }
    await onConnect(connectionString);
    if (!error) {
      setConnectionString("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Connect to MongoDB</DialogTitle>
          <DialogDescription>
            Enter your MongoDB connection string to get started with database
            management.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="connection-string">Connection String</Label>
            <Input
              id="connection-string"
              placeholder="mongodb://username:password@host:port/database"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              disabled={isConnecting}
              type="password"
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-xs">
              Example: mongodb+srv://user:password@cluster.mongodb.net/
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !connectionString.trim()}
            >
              {isConnecting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
