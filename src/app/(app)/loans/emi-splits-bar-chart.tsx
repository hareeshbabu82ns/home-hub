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
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { EMISplit } from "@/lib/loans/types";
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
  emi: {
    label: "EMI",
    color: "hsl(var(--chart-1))",
  },
  principle: {
    label: "Principle",
    color: "hsl(var(--chart-2))",
  },
  interest: {
    label: "Interest",
    color: "hsl(var(--chart-3))",
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
            <Bar dataKey="emiPaid" fill="var(--color-emi)" radius={4} />
            <Bar dataKey="principle" fill="var(--color-principle)" radius={4} />
            <Bar dataKey="interest" fill="var(--color-interest)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default EmiSPlitsBarChart;
