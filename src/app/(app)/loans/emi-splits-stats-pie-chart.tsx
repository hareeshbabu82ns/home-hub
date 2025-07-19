"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { EMISplitStats } from "@/lib/loans/types";

const chartConfig = {
  interest: {
    label: "Interest",
    color: "var(--chart-4)",
  },
  principal: {
    label: "Principal",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

interface EMISplitsStatsPieChartProps {
  title?: string;
  description?: string;
  stats: EMISplitStats;
}
export function EMISplitsStatsPieChart({
  stats,
  title,
  description,
}: EMISplitsStatsPieChartProps) {
  const statsData = React.useMemo(() => {
    const data = [];
    data.push({
      statTitle: "interest",
      statData: stats.interest,
      fill: "var(--chart-4)",
    });
    data.push({
      statTitle: "principal",
      statData: stats.total - stats.interest,
      fill: "var(--chart-5)",
    });
    return data;
  }, [stats]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={statsData}
              dataKey="statData"
              nameKey="statTitle"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {stats.total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
