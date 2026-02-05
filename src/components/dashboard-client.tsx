"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, Mountain, Snowflake } from "lucide-react";
import { SnowChart } from "./snow-chart";
import type { AppData } from "@/lib/data";

interface DashboardClientProps {
  data: AppData;
}

export function DashboardClient({ data }: DashboardClientProps) {
  const { stations, stats } = data;
  
  if (!stations || stations.length === 0) {
    return <p>No station data available. Please check your data source.</p>;
  }

  return (
    <Tabs defaultValue={stations[0].id} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        {stations.map((station) => (
          <TabsTrigger key={station.id} value={station.id}>
            {station.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {stations.map((station) => {
        const stationStats = stats[station.id];
        if (!stationStats || stationStats.length === 0) {
          return (
            <TabsContent key={station.id} value={station.id}>
              <p>No historical data available for {station.name}.</p>
            </TabsContent>
          );
        }
        
        const latestStat = stationStats[stationStats.length - 1];

        return (
          <TabsContent key={station.id} value={station.id}>
            <div className="space-y-6 pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Snow Index
                    </CardTitle>
                    <Snowflake className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{latestStat.snowIndex}</div>
                    <p className="text-xs text-muted-foreground">
                      Normalized Snow Difference
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cloud Cover</CardTitle>
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(latestStat.cloudCover * 100).toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Chance of obstruction
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Elevation</CardTitle>
                    <Mountain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{station.elevation}m</div>
                    <p className="text-xs text-muted-foreground">
                      Above sea level
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Historical Conditions</CardTitle>
                  <CardDescription>
                    Snow index trend and cloud cover over the last 90 days.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SnowChart data={stationStats} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
