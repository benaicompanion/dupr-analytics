"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrajectoryProjection } from "@/lib/analytics";

interface RatingPoint {
  date: string;
  rating: number;
}

export function RatingChart({
  data,
  title = "Doubles Rating Over Time",
  trajectory,
}: {
  data: RatingPoint[];
  title?: string;
  trajectory?: TrajectoryProjection | null;
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No rating data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build chart data with actual ratings
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    }),
    rating: Math.round(d.rating * 100) / 100,
    projected: null as number | null,
    fullDate: new Date(d.date).toLocaleDateString(),
  }));

  // Add projected points if trajectory exists
  if (trajectory && trajectory.projections.length > 0) {
    const lastDate = new Date(data[data.length - 1].date);
    const lastRating = data[data.length - 1].rating;

    // Add connection point (last actual = first projected)
    chartData[chartData.length - 1].projected = Math.round(lastRating * 100) / 100;

    for (const proj of trajectory.projections) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + proj.days);
      chartData.push({
        date: futureDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "2-digit",
        }),
        rating: null as unknown as number,
        projected: proj.rating,
        fullDate: futureDate.toLocaleDateString() + " (projected)",
      });
    }
  }

  const allRatings = chartData
    .map((d) => d.rating ?? d.projected)
    .filter((r): r is number => r != null);
  const minRating = Math.floor(Math.min(...allRatings) * 10) / 10 - 0.1;
  const maxRating = Math.ceil(Math.max(...allRatings) * 10) / 10 + 0.1;

  // Find the index where projection starts for reference line
  const projStartIdx = data.length - 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {trajectory && (
          <p className="text-xs text-muted-foreground">
            Dashed line shows projected trajectory based on last 20 matches
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="date"
              stroke="#888"
              fontSize={12}
              tick={{ fill: "#888" }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#888"
              fontSize={12}
              tick={{ fill: "#888" }}
              domain={[minRating, maxRating]}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number | undefined, name?: string) => {
                if (value == null) return [null, null];
                const label = name === "projected" ? "Projected DUPR" : "DUPR Rating";
                return [value.toFixed(2), label];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            {/* Actual rating line */}
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3, fill: "#22c55e" }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
            {/* Projected line */}
            {trajectory && (
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={{ r: 3, fill: "#22c55e", strokeDasharray: "0" }}
                activeDot={{ r: 5 }}
                connectNulls
                opacity={0.6}
              />
            )}
            {/* Reference line at projection start */}
            {trajectory && projStartIdx > 0 && (
              <ReferenceLine
                x={chartData[projStartIdx]?.date}
                stroke="#555"
                strokeDasharray="3 3"
                label={{ value: "Now", fill: "#888", fontSize: 11 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
