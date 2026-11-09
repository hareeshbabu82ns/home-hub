"use client";

/**
 * Backup Statistics Component
 * Displays backup storage statistics
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive } from "lucide-react";
import type { Backup } from "@/types/mongodb";

interface BackupStatsProps {
  backups: Backup[];
}

export function BackupStats({ backups }: BackupStatsProps) {
  const [totalSize, setTotalSize] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const size = backups.reduce((sum, b) => sum + b.size, 0);
    setTotalSize(size);
    setTotalCount(backups.length);
  }, [backups]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const completedBackups = backups.filter(
    (b) => b.status === "completed",
  ).length;
  const failedBackups = backups.filter((b) => b.status === "failed").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Backups
          </CardTitle>
          <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalCount}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {completedBackups} completed, {failedBackups} failed
          </p>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Size
          </CardTitle>
          <HardDrive className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatFileSize(totalSize)}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            in ./data/backups folder
          </p>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Average Size
          </CardTitle>
          <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatFileSize(totalCount > 0 ? totalSize / totalCount : 0)}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">per backup</p>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Success Rate
          </CardTitle>
          <HardDrive className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalCount > 0
              ? `${Math.round((completedBackups / totalCount) * 100)}%`
              : "N/A"}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            of backups completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
