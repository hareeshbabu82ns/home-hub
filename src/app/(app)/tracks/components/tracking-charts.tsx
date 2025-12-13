"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartDataPoint, TrackingMetrics } from "@/types/track";
import type { TrackAttributeValueType } from "@/app/generated/prisma";

interface TrackingChartsProps {
  lineChartData?: ChartDataPoint[];
  activityData?: ChartDataPoint[];
  metrics?: TrackingMetrics;
  title?: string;
}

// const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const VALUE_TYPE_COLORS: Record<TrackAttributeValueType, string> = {
  STRING: "#8884D8",
  INT: "#82CA9D",
  FLOAT: "#FFC658",
  DATETIME: "#FF7300",
  DURATION: "#8DD1E1",
};

export function TrackingCharts({
  lineChartData,
  activityData,
  metrics,
  title,
}: TrackingChartsProps) {
  const formatTooltipValue = (value: number | string, name: string) => {
    if (name === "value" && typeof value === "number") {
      return [value.toLocaleString(), "Value"];
    }
    return [value, name];
  };

  const formatPieData = (metrics: TrackingMetrics) => {
    return Object.entries(metrics.attributesByType)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        name: type,
        value: count,
        fill: VALUE_TYPE_COLORS[type as TrackAttributeValueType],
      }));
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total Attributes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalAttributes}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Recent Activity (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.recentActivity}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Attribute Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(metrics.attributesByType).reduce(
                  (a, b) => a + b,
                  0,
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Line Chart for Value Trends */}
        {lineChartData && lineChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {title ? `${title} - Value Trends` : "Value Trends"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={formatTooltipValue}
                    labelFormatter={(value) =>
                      `Date: ${new Date(value).toLocaleDateString()}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Bar Chart for Activity */}
        {activityData && activityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {title ? `${title} - Activity` : "Daily Activity"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [value, "Entries"]}
                    labelFormatter={(value) =>
                      `Date: ${new Date(value).toLocaleDateString()}`
                    }
                  />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Pie Chart for Attribute Types */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Attribute Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPieData(metrics)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatPieData(metrics).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
