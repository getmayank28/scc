"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, LabelList, Tooltip, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const description = "An area chart with icons";

// const chartData = [
//   { x: "", withCreditCard: 186, withoutCreditCard: 0 },
//   { x: "", withCreditCard: 305, withoutCreditCard: 0 },
//   { x: "", withCreditCard: 237, withoutCreditCard: 0 },
//   { x: "", withCreditCard: 73, withoutCreditCard: 0 },
//   { x: "", withCreditCard: 209, withoutCreditCard: 0 },
//   { x: "", withCreditCard: 214, withoutCreditCard: 0 },
// ]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
    icon: TrendingDown,
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
    icon: TrendingUp,
  },
} satisfies ChartConfig;

export function CustomAreaChart({ chartData }) {
  return (
    <Card className="bg-background-primary border-none text-white p-0 gap-0">
      <CardHeader className="p-0">
        <CardTitle>Credit Card vs. No Card: Your Real Savings</CardTitle>
        <CardDescription>
        Understand how much more you gain by using a credit card for your spending
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData?.data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <XAxis
              dataKey="x"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <div className="bg-background-primary border border-white/50 p-4 rounded-md">
                  <div className="flex gap-1 items-center">
                    <p className="w-2 h-2 rounded-full"
                    style={{background:chartData?.color}}></p>
                    <p>Rewards with card: INR {chartData?.data?.at(1)?.one}</p>
                  </div>
                  <div className="flex gap-1 items-center">
                    <p className="w-2 h-2 bg-[#DC0000] rounded-full"></p>
                    <p>Rewards without card: INR 0</p>
                  </div>
                </div>
              }
            />
            <Area
              dataKey="two"
              type="natural"
              fill="#DC0000"
              fillOpacity={0.4}
              stroke="#DC0000"
              stackId="a"
            />

            <Area
              dataKey="one"
              type="natural"
              fill={chartData?.color}
              fillOpacity={0.4}
              stroke={chartData?.color}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="p-0 mt-0">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending up by INR {chartData?.data?.at(1)?.one} <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
