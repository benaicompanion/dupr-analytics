"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  currentRating: number | null;
  highestRating: number | null;
  lowestRating: number | null;
  totalMatches: number;
  doublesMatches: number;
  singlesMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  doublesWinRate: number;
  singlesWinRate: number;
}

export function SummaryStats({ stats, singlesRating }: { stats: Stats; singlesRating?: number | null }) {
  const cards = [
    {
      label: "Doubles DUPR",
      value: stats.currentRating?.toFixed(2) ?? "N/A",
      color: "text-green-400",
    },
    {
      label: "Singles DUPR",
      value: singlesRating?.toFixed(2) ?? "N/A",
      color: "text-teal-400",
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
      value: stats.totalMatches > 0 ? `${(stats.winRate * 100).toFixed(1)}%` : "N/A",
      color: "text-emerald-400",
    },
    {
      label: "Record",
      value: stats.totalMatches > 0 ? `${stats.totalWins}W - ${stats.totalLosses}L` : "N/A",
      color: "text-cyan-400",
    },
    {
      label: "Doubles Record",
      value: stats.doublesMatches > 0
        ? `${Math.round(stats.doublesWinRate * stats.doublesMatches)}W - ${stats.doublesMatches - Math.round(stats.doublesWinRate * stats.doublesMatches)}L`
        : "N/A",
      color: "text-indigo-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
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
