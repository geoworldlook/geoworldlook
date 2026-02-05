"use client";

import { Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import type { SnowStat } from '@/lib/data';

type SnowChartProps = {
  data: SnowStat[];
};

const chartConfig = {
  snowIndex: {
    label: "Snow Index (NDSI)",
    color: "hsl(var(--chart-1))",
  },
  cloudCover: {
    label: "Cloud Cover",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;


export function SnowChart({ data }: SnowChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cloudCover: item.cloudCover * 100
  }));
  
  return (
    <div className="h-[300px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
            <ComposedChart
                accessibilityLayer
                data={formattedData}
                margin={{
                    top: 5,
                    right: 10,
                    left: -10,
                    bottom: 0,
                }}
            >
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value, index) => {
                        if (index % 10 === 0) {
                            return value;
                        }
                        return "";
                    }}
                />
                <YAxis 
                    yAxisId="left" 
                    stroke="hsl(var(--primary))" 
                    domain={[0, 1]}
                />
                <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="hsl(var(--muted-foreground))"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  cursor={true}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                    dataKey="snowIndex"
                    type="monotone"
                    stroke="var(--color-snowIndex)"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="left"
                    name="Snow Index"
                />
                <Bar
                    dataKey="cloudCover"
                    fill="var(--color-cloudCover)"
                    radius={4}
                    yAxisId="right"
                    opacity={0.3}
                    name="Cloud Cover (%)"
                />
            </ComposedChart>
        </ChartContainer>
    </div>
  );
}
