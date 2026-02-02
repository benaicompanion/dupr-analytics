"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RatingPoint {
  date: string;
  rating: number;
}

export function RatingChart({
  data,
  title = "Doubles Rating Over Time",
}: {
  data: RatingPoint[];
  title?: string;
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

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    }),
    rating: Math.round(d.rating * 100) / 100,
    fullDate: new Date(d.date).toLocaleDateString(),
  }));

  const ratings = chartData.map((d) => d.rating);
  const minRating = Math.floor(Math.min(...ratings) * 10) / 10 - 0.1;
  const maxRating = Math.ceil(Math.max(...ratings) * 10) / 10 + 0.1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
              formatter={(value: number | undefined) => [value != null ? value.toFixed(2) : "—", "DUPR Rating"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3, fill: "#22c55e" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
