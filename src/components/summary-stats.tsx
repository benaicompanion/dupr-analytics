"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  currentRating: number | null;
  highestRating: number | null;
  lowestRating: number | null;
  totalMatches: number;
  doublesMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  doublesWinRate: number;
}

export function SummaryStats({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Current DUPR",
      value: stats.currentRating?.toFixed(2) ?? "N/A",
      color: "text-green-400",
    },
    {
      label: "Highest DUPR",
      value: stats.highestRating?.toFixed(2) ?? "N/A",
      color: "text-blue-400",
    },
    {
      label: "Lowest DUPR",
      value: stats.lowestRating?.toFixed(2) ?? "N/A",
      color: "text-orange-400",
    },
    {
      label: "Total Matches",
      value: stats.totalMatches.toString(),
      color: "text-purple-400",
    },
    {
      label: "Win Rate",
      value: `${(stats.winRate * 100).toFixed(1)}%`,
      color: "text-emerald-400",
    },
    {
      label: "Record",
      value: `${stats.totalWins}W - ${stats.totalLosses}L`,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {card.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
