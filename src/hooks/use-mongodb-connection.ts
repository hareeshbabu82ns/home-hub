"use client";

/**
 * MongoDB Connection Hook
 * Manages MongoDB connection state and operations
 */

import { useCallback, useState } from "react";
import {
  connectMongoDB,
  disconnectMongoDB,
  checkMongoDBConnection,
} from "@/lib/actions/db-management";

interface UseMongoDBConnectionReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectionString: string;
  connect: (_connectionStr: string) => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

export function useMongoDBConnection(): UseMongoDBConnectionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionString, setConnectionString] = useState("");

  const connect = useCallback(async (connStr: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await connectMongoDB(connStr);

      if (result.success) {
        setIsConnected(true);
        setConnectionString(connStr);
      } else {
        setError(result.error || "Failed to connect");
        setIsConnected(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Connection error";
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await disconnectMongoDB();

      if (result.success) {
        setIsConnected(false);
        setConnectionString("");
      } else {
        setError(result.error || "Failed to disconnect");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Disconnection error";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const result = await checkMongoDBConnection();
      setIsConnected(result.data ?? false);
    } catch (_err) {
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connectionString,
    connect,
    disconnect,
    checkConnection,
  };
}
