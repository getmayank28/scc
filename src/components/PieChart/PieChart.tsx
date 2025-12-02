"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import { CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A donut chart with text";

interface ChartData {
  category: string;
  spends: number;
  fill: string;
}

interface ChartProps {
  chartData: ChartData[];
}

const chartConfig = {
  spends: {
    label: "spends",
  },
  onlineBillPayments: {
    label: "Online Bill Payments",
    color: "var(--chart-1)",
  },
  onlineShoppingSpend: {
    label: "Online shopping Spends",
    color: "var(--chart-2)",
  },
  offlineSpend: {
    label: "Offline Spends",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function CustomPieChart({ chartData }: ChartProps) {
  const totalSpend = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.spends, 0);
  }, [chartData]);

  return (
    <CardContent className="h-[450px] flex px-10">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[450px] !p-0"
      >
        <PieChart className="p-0">
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            className="p-0"
            data={chartData}
            dataKey="spends"
            nameKey="category"
            innerRadius={100}
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
                        className="fill-white text-4xl font-bold"
                      >
                        {totalSpend.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 40}
                        className="fill-white opacity-80 text-lg"
                      >
                        Spend
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
   
      </ChartContainer>
      <div className="flex flex-col gap-3 justify-center -ml-5 w-[150px]">
        {
          chartData?.map(
            ele => (
              <div key={ele?.category} className="flex gap-1 items-center">
              <p className="w-4 h-4 rounded-sm"
              style={{background:ele?.fill}}></p>
              <p className="text-xs">{ele?.category}</p>
            </div>
            )
          )
        }
        
        </div>
    </CardContent>
  );
}
