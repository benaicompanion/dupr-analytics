"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  TrajectoryProjection,
  VolatilityStats,
  UpsetStats,
  NemesisFavorite,
  ClutchStats,
} from "@/lib/analytics";

interface InsightsPanelProps {
  trajectory: TrajectoryProjection | null;
  volatility: VolatilityStats | null;
  upsets: UpsetStats;
  nemesisFavorite: NemesisFavorite;
  clutch: ClutchStats;
}

export function InsightsPanel({
  trajectory,
  volatility,
  upsets,
  nemesisFavorite,
  clutch,
}: InsightsPanelProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Trajectory Projection */}
        {trajectory && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📈 DUPR Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Based on last 20 matches ({trajectory.slope >= 0 ? "trending up" : "trending down"})
              </p>
              {trajectory.projections.map((p) => (
                <div key={p.days} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{p.days} days</span>
                  <span className={`text-lg font-bold ${
                    p.rating > (trajectory.dataPoints[trajectory.dataPoints.length - 1]?.rating ?? 0)
                      ? "text-green-400"
                      : "text-red-400"
                  }`}>
                    {p.rating.toFixed(2)}
                  </span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-1">
                Rate: {trajectory.slope >= 0 ? "+" : ""}{(trajectory.slope * 30).toFixed(3)}/month
              </p>
            </CardContent>
          </Card>
        )}

        {/* Volatility */}
        {volatility && (() => {
          const avgSwing = volatility.changes.length > 0
            ? volatility.changes.reduce((s, c) => s + Math.abs(c), 0) / volatility.changes.length
            : 0;
          const recentChanges = volatility.changes.slice(-10);
          const recentAvgSwing = recentChanges.length > 0
            ? recentChanges.reduce((s, c) => s + Math.abs(c), 0) / recentChanges.length
            : 0;
          const bigSwings = volatility.changes.filter((c) => Math.abs(c) > 0.05).length;
          const trendLabel = recentAvgSwing > avgSwing * 1.2
            ? "Getting more volatile"
            : recentAvgSwing < avgSwing * 0.8
            ? "Stabilizing"
            : "Consistent";
          const trendColor = recentAvgSwing > avgSwing * 1.2
            ? "text-yellow-400"
            : recentAvgSwing < avgSwing * 0.8
            ? "text-green-400"
            : "text-muted-foreground";

          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  🎢 Rating Consistency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {volatility.label === "Low" ? "Steady" : volatility.label === "Medium" ? "Moderate" : "Streaky"}
                  </span>
                  <Badge
                    className={
                      volatility.label === "Low"
                        ? "bg-green-600/20 text-green-400 border-green-600/30"
                        : volatility.label === "Medium"
                        ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"
                        : "bg-red-600/20 text-red-400 border-red-600/30"
                    }
                  >
                    {volatility.label === "Low" ? "🧊" : volatility.label === "Medium" ? "〰️" : "📈📉"}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. swing per match</span>
                    <span className="font-medium">±{avgSwing.toFixed(3)} DUPR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last 10 matches</span>
                    <span className="font-medium">±{recentAvgSwing.toFixed(3)} DUPR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Big swings (±0.05+)</span>
                    <span className="font-medium">{bigSwings} of {volatility.changes.length}</span>
                  </div>
                </div>

                <p className={`text-xs font-medium ${trendColor}`}>
                  {trendLabel}
                </p>

                {/* Mini sparkline of recent changes */}
                <div className="flex items-end gap-[2px] h-8">
                  {volatility.changes.slice(-20).map((c, i) => {
                    const maxAbs = Math.max(...volatility.changes.slice(-20).map(Math.abs), 0.01);
                    const height = Math.max(2, (Math.abs(c) / maxAbs) * 28);
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${c >= 0 ? "bg-green-500" : "bg-red-500"}`}
                        style={{ height: `${height}px` }}
                        title={`${c >= 0 ? "+" : ""}${c.toFixed(3)}`}
                      />
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Last 20 matches — green = gained, red = lost
                </p>
              </CardContent>
            </Card>
          );
        })()}

        {/* Upset Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ⚡ Upset Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Upsets Pulled 💪</span>
              <div className="text-right">
                <span className="text-lg font-bold text-green-400">
                  {upsets.upsetsPulled}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  ({(upsets.upsetsPulledRate * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Upsets Suffered 😤</span>
              <div className="text-right">
                <span className="text-lg font-bold text-red-400">
                  {upsets.upsetsSuffered}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  ({(upsets.upsetsSufferedRate * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {upsets.totalWithRatings} rated matches
            </p>
          </CardContent>
        </Card>

        {/* Nemesis / Favorite */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🎯 Nemesis & Favorite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nemesisFavorite.nemesis ? (
              <div>
                <p className="text-xs text-red-400 uppercase tracking-wider">😈 Nemesis</p>
                <p className="font-semibold">{nemesisFavorite.nemesis.name}</p>
                <p className="text-sm text-muted-foreground">
                  {nemesisFavorite.nemesis.wins}W - {nemesisFavorite.nemesis.losses}L ({(nemesisFavorite.nemesis.winRate * 100).toFixed(0)}%)
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No nemesis found (need 2+ matches)</p>
            )}
            {nemesisFavorite.favorite ? (
              <div>
                <p className="text-xs text-green-400 uppercase tracking-wider">🎉 Favorite Opponent</p>
                <p className="font-semibold">{nemesisFavorite.favorite.name}</p>
                <p className="text-sm text-muted-foreground">
                  {nemesisFavorite.favorite.wins}W - {nemesisFavorite.favorite.losses}L ({(nemesisFavorite.favorite.winRate * 100).toFixed(0)}%)
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No favorite found (need 2+ matches)</p>
            )}
          </CardContent>
        </Card>

        {/* Clutch Factor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              🔥 Clutch Factor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {clutch.clutchGames > 0 ? (clutch.clutchWinRate * 100).toFixed(1) : "—"}%
              </span>
              <span className="text-sm text-muted-foreground">in close games</span>
            </div>
            <div className="text-sm text-muted-foreground">
              vs {(clutch.overallGameWinRate * 100).toFixed(1)}% overall game win rate
            </div>
            <div className="text-sm">
              {clutch.clutchWins}W / {clutch.clutchGames} close games (≤3 pt diff)
            </div>
            {clutch.clutchGames > 0 && (
              <Badge
                className={
                  clutch.clutchWinRate > clutch.overallGameWinRate
                    ? "bg-green-600/20 text-green-400 border-green-600/30"
                    : "bg-red-600/20 text-red-400 border-red-600/30"
                }
              >
                {clutch.clutchWinRate > clutch.overallGameWinRate ? "Clutch Player 🧊" : "Room to Grow 📈"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
