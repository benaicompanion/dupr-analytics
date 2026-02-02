"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TierPerformance } from "@/lib/analytics";

export function TierChart({ data }: { data: TierPerformance[] }) {
  const filtered = data.filter((d) => d.total > 0);

  if (filtered.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance by Opponent Rating Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No tier data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = filtered.map((d) => ({
    tier: d.tier,
    winRate: Math.round(d.winRate * 100),
    wins: d.wins,
    losses: d.losses,
    total: d.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by Opponent Rating Tier</CardTitle>
        <p className="text-sm text-muted-foreground">Win rate against opponents grouped by average DUPR rating</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="tier"
              stroke="#888"
              fontSize={12}
              tick={{ fill: "#888" }}
            />
            <YAxis
              stroke="#888"
              fontSize={12}
              tick={{ fill: "#888" }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "#fff",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _name: any, props: any) => {
                if (value == null || !props?.payload) return ["", ""];
                const { wins, losses, total } = props.payload;
                return [`${value}% (${wins}W-${losses}L, ${total} matches)`, "Win Rate"];
              }}
            />
            <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.winRate >= 50 ? "#22c55e" : "#ef4444"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
