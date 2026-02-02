"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PunchingStats, RatingGapBucket } from "@/lib/analytics";
import { getPunchingStats, getRatingGapPerformance } from "@/lib/analytics";

/* eslint-disable @typescript-eslint/no-explicit-any */

type CompareMode = "individual" | "team";

interface PunchingStatsProps {
  punchingStats: PunchingStats;
  gapPerformance: RatingGapBucket[];
  rawMatches: any[];
  userId: number;
}

export function PunchingStatsPanel({ punchingStats: initialPunching, gapPerformance: initialGap, rawMatches, userId }: PunchingStatsProps) {
  const [mode, setMode] = useState<CompareMode>("individual");

  // Recompute when mode changes
  const punchingStats = mode === "individual" ? initialPunching : getPunchingStats(rawMatches, userId, "team");
  const gapPerformance = mode === "individual" ? initialGap : getRatingGapPerformance(rawMatches, userId, "team");

  const { above, below, even } = punchingStats;

  const aboveExpected = above.total > 0 && above.winRate > 0.35;
  const belowExpected = below.total > 0 && below.winRate < 0.7;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Performance vs Rating Gap</h2>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setMode("individual")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === "individual"
                ? "bg-background text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My DUPR vs Opponents
          </button>
          <button
            onClick={() => setMode("team")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === "team"
                ? "bg-background text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Team vs Team
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground -mt-2">
        {mode === "individual"
          ? "Comparing your individual pre-match DUPR against the average of both opponents' DUPRs"
          : "Comparing your team's average pre-match DUPR (you + partner) against the opponent team's average"}
      </p>

      {/* Punching Up / Down Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Punching Up */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span>⬆️ vs Higher Rated</span>
              {above.total > 0 && (
                <Badge className={aboveExpected
                  ? "bg-green-600/20 text-green-400 border-green-600/30"
                  : "bg-red-600/20 text-red-400 border-red-600/30"
                }>
                  {aboveExpected ? "Overperforming" : "As Expected"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {above.total > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{(above.winRate * 100).toFixed(0)}%</span>
                  <span className="text-sm text-muted-foreground">win rate</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {above.wins}W - {above.losses}L ({above.total} matches)
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Avg gap: </span>
                  <span className="font-mono text-yellow-400">+{above.avgGap.toFixed(2)}</span>
                  <span className="text-muted-foreground"> DUPR {mode === "team" ? "team gap" : "above you"}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Avg rating change: </span>
                  <span className={`font-mono ${above.avgRatingChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {above.avgRatingChange >= 0 ? "+" : ""}{above.avgRatingChange.toFixed(4)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No matches against higher-rated {mode === "team" ? "teams" : "opponents"}</p>
            )}
          </CardContent>
        </Card>

        {/* Even */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ⚖️ vs Even Rated (±0.1)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {even.total > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{(even.winRate * 100).toFixed(0)}%</span>
                  <span className="text-sm text-muted-foreground">win rate</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {even.wins}W - {even.losses}L ({even.total} matches)
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Avg rating change: </span>
                  <span className={`font-mono ${even.avgRatingChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {even.avgRatingChange >= 0 ? "+" : ""}{even.avgRatingChange.toFixed(4)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No even-rated matches</p>
            )}
          </CardContent>
        </Card>

        {/* Punching Down */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span>⬇️ vs Lower Rated</span>
              {below.total > 0 && (
                <Badge className={belowExpected
                  ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"
                  : "bg-green-600/20 text-green-400 border-green-600/30"
                }>
                  {belowExpected ? "Underperforming" : "Dominant"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {below.total > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{(below.winRate * 100).toFixed(0)}%</span>
                  <span className="text-sm text-muted-foreground">win rate</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {below.wins}W - {below.losses}L ({below.total} matches)
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Avg gap: </span>
                  <span className="font-mono text-blue-400">-{below.avgGap.toFixed(2)}</span>
                  <span className="text-muted-foreground"> DUPR {mode === "team" ? "team gap" : "below you"}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Avg rating change: </span>
                  <span className={`font-mono ${below.avgRatingChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {below.avgRatingChange >= 0 ? "+" : ""}{below.avgRatingChange.toFixed(4)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No matches against lower-rated {mode === "team" ? "teams" : "opponents"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rating Gap Performance Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rating Gap Performance Curve</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "individual"
              ? "Win rate by how much higher or lower your opponents are rated vs your pre-match DUPR"
              : "Win rate by how much higher or lower the opponent team avg is vs your team avg"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-[140px_1fr_80px_100px_80px] gap-2 text-xs text-muted-foreground font-medium px-1">
              <span>Rating Gap</span>
              <span>Win Rate</span>
              <span className="text-right">Record</span>
              <span className="text-right">Avg Δ DUPR</span>
              <span className="text-right">Matches</span>
            </div>

            {gapPerformance.map((bucket) => {
              if (bucket.total === 0) return null;

              const barWidth = bucket.total > 0 ? (bucket.winRate * 100) : 0;
              const isAbove = bucket.gapMin >= 0 && bucket.label !== "Even (±0.1)";
              const isBelow = bucket.gapMax <= 0 && bucket.label !== "Even (±0.1)";

              return (
                <div
                  key={bucket.label}
                  className="grid grid-cols-[140px_1fr_80px_100px_80px] gap-2 items-center px-1"
                >
                  <span className={`text-sm font-medium ${
                    isAbove ? "text-yellow-400" : isBelow ? "text-blue-400" : "text-muted-foreground"
                  }`}>
                    {bucket.label}
                  </span>

                  {/* Bar */}
                  <div className="relative h-7 bg-muted/30 rounded overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded ${
                        bucket.winRate >= 0.6
                          ? "bg-green-500/60"
                          : bucket.winRate >= 0.4
                          ? "bg-yellow-500/60"
                          : "bg-red-500/60"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {(bucket.winRate * 100).toFixed(0)}%
                    </div>
                    {/* 50% reference line */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-muted-foreground/40" />
                  </div>

                  <span className="text-sm text-right font-mono">
                    {bucket.wins}W-{bucket.losses}L
                  </span>

                  <span className={`text-sm text-right font-mono ${
                    bucket.avgRatingChange >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {bucket.avgRatingChange >= 0 ? "+" : ""}{bucket.avgRatingChange.toFixed(4)}
                  </span>

                  <span className="text-sm text-right text-muted-foreground">
                    {bucket.total}
                  </span>
                </div>
              );
            })}

            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {mode === "individual"
                ? "Negative gaps = opponents rated below you · Positive gaps = opponents rated above you · Vertical line = 50% win rate"
                : "Negative gaps = opponent team rated below your team · Positive gaps = opponent team rated above your team · Vertical line = 50% win rate"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
