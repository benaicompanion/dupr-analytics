"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { SummaryStats } from "@/components/summary-stats";
import { RatingChart } from "@/components/rating-chart";
import { PartnerTable } from "@/components/partner-table";
import { MatchHistory } from "@/components/match-history";
import { SearchResults } from "@/components/search-results";
import { InsightsPanel } from "@/components/insights-panel";
import { OpponentsTable } from "@/components/opponents-table";
import { TierChart } from "@/components/tier-chart";
import { ClubLeaderboard } from "@/components/club-leaderboard";
import {
  processMatches,
  getPartnerStats,
  buildRatingTimeline,
  getSummaryStats,
  getTrajectoryProjection,
  getVolatilityStats,
  getOpponentStats,
  getUpsetStats,
  getTierPerformance,
  getNemesisFavorite,
  getClutchStats,
} from "@/lib/analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [ratingHistory, setRatingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  async function fetchAllMatches(playerId: string): Promise<any[]> {
    const allMatches: any[] = [];
    let offset = 0;
    const limit = 25;
    let hasMore = true;
    while (hasMore) {
      try {
        const res = await fetch(`/api/player/${playerId}/history?offset=${offset}&limit=${limit}`);
        if (!res.ok) break;
        const data = await res.json();
        if (data.error) break;
        allMatches.push(...(data.matches || []));
        hasMore = data.hasMore === true;
        offset += limit;
      } catch { break; }
    }
    return allMatches;
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [playerRes, ratingRes] = await Promise.all([
          fetch(`/api/player/${id}`),
          fetch(`/api/player/${id}/rating-history?type=DOUBLES`),
        ]);

        if (!playerRes.ok) {
          setError("Player not found or not authenticated");
          router.push("/");
          return;
        }

        const playerData = await playerRes.json();
        const ratingData = await ratingRes.json();
        const allMatches = await fetchAllMatches(id);

        setPlayer(playerData?.result || playerData);
        setMatches(allMatches);
        setRatingHistory(ratingData?.result?.ratingHistory || ratingData?.result || []);
      } catch {
        setError("Failed to load player data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    setShowSearch(true);
    try {
      const res = await fetch(
        `/api/player/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setSearchResults(data?.result?.hits || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading player data...</p>
        </div>
      </div>
    );
  }

  const playerId = player?.id || parseInt(id);
  const processedMatches = processMatches(matches, playerId);
  const partners = getPartnerStats(processedMatches);
  const timeline = buildRatingTimeline(processedMatches);

  const ratingChartData =
    ratingHistory.length > 0
      ? ratingHistory
          .map((r: any) => ({
            date: r.date || r.eventDate,
            rating: r.rating ?? r.doubles ?? r.doublesRating,
          }))
          .filter((r: any) => r.date && r.rating != null)
          .sort(
            (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          )
      : timeline;

  const latestRating = ratingChartData.length > 0
    ? ratingChartData[ratingChartData.length - 1]?.rating
    : null;
  const currentRating = latestRating ?? player?.doubles ?? player?.doublesRating ?? null;

  const summary = getSummaryStats(
    processedMatches,
    currentRating
  );

  // Extract clubs from raw match data
  const clubMap = new Map<number, string>();
  for (const m of matches) {
    if (m.clubId && m.clubName && !clubMap.has(m.clubId)) {
      clubMap.set(m.clubId, m.clubName);
    }
  }
  const clubs = Array.from(clubMap.entries()).map(([id, name]) => ({ id, name }));

  // Advanced analytics
  const trajectory = getTrajectoryProjection(processedMatches);
  const volatility = getVolatilityStats(processedMatches);
  const opponents = getOpponentStats(processedMatches);
  const upsets = getUpsetStats(processedMatches, matches, playerId);
  const tierPerformance = getTierPerformance(processedMatches, matches, playerId);
  const nemesisFavorite = getNemesisFavorite(opponents);
  const clutch = getClutchStats(matches, playerId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      {showSearch && (
        <SearchResults
          results={searchResults}
          loading={searchLoading}
          onSelect={(pid) => router.push(`/player/${pid}`)}
          onClose={() => {
            setShowSearch(false);
            setSearchResults([]);
          }}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {player?.fullName || `Player ${id}`}
            </h1>
            <p className="text-muted-foreground">
              {player?.shortAddress || ""}
            </p>
          </div>
        </div>

        <SummaryStats stats={summary} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="opponents">Opponents</TabsTrigger>
            <TabsTrigger value="history">Match History</TabsTrigger>
            <TabsTrigger value="club">Club</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <RatingChart
              data={ratingChartData}
              title={`${player?.fullName || "Player"} - Doubles Rating`}
              trajectory={trajectory}
            />

            <InsightsPanel
              trajectory={trajectory}
              volatility={volatility}
              upsets={upsets}
              nemesisFavorite={nemesisFavorite}
              clutch={clutch}
            />

            <TierChart data={tierPerformance} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OpponentsTable
                opponents={opponents}
                limit={10}
                onPlayerClick={(pid) => router.push(`/player/${pid}`)}
              />
              <PartnerTable
                partners={partners.slice(0, 10)}
                onPlayerClick={(pid) => router.push(`/player/${pid}`)}
              />
            </div>

            <MatchHistory matches={processedMatches.slice(0, 10)} />
          </TabsContent>

          <TabsContent value="partners">
            <PartnerTable
              partners={partners}
              onPlayerClick={(pid) => router.push(`/player/${pid}`)}
            />
          </TabsContent>

          <TabsContent value="opponents" className="space-y-6">
            <TierChart data={tierPerformance} />
            <OpponentsTable
              opponents={opponents}
              onPlayerClick={(pid) => router.push(`/player/${pid}`)}
            />
          </TabsContent>

          <TabsContent value="history">
            <MatchHistory matches={processedMatches} />
          </TabsContent>

          <TabsContent value="club">
            <ClubLeaderboard
              currentUserId={playerId}
              onPlayerClick={(pid) => router.push(`/player/${pid}`)}
              clubs={clubs}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
