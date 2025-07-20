"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { EMISplit } from "@/lib/loans/types";
import { format } from "date-fns";
// const chartData = [
//   { month: "January", desktop: 186, mobile: 80 },
//   { month: "February", desktop: 305, mobile: 200 },
//   { month: "March", desktop: 237, mobile: 120 },
//   { month: "April", desktop: 73, mobile: 190 },
//   { month: "May", desktop: 209, mobile: 130 },
//   { month: "June", desktop: 214, mobile: 140 },
// ];

const chartConfig = {
  emiPaid: {
    label: "Total EMI",
    color: "var(--chart-3)",
  },
  principal: {
    label: "Principal",
    color: "var(--chart-2)",
  },
  interest: {
    label: "Interest",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface EmiSPlitsBarChartProps {
  splits: EMISplit[];
  title?: string;
  description?: string;
}

export function EmiSPlitsBarChart({
  splits,
  title,
  description,
}: EmiSPlitsBarChartProps) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={splits}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => format(value, "Y")}
              // tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="principal"
              fill="var(--chart-4)"
              radius={[0, 0, 4, 4]}
              stackId="emi"
            />
            <Bar
              dataKey="interest"
              fill="var(--chart-5)"
              radius={[4, 4, 0, 0]}
              stackId="emi"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default EmiSPlitsBarChart;
