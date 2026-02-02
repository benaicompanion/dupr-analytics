"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { SummaryStats } from "@/components/summary-stats";
import { RatingChart } from "@/components/rating-chart";
import { PartnerTable } from "@/components/partner-table";
import { MatchHistory } from "@/components/match-history";
import { SearchResults } from "@/components/search-results";
import {
  processMatches,
  getPartnerStats,
  buildRatingTimeline,
  getSummaryStats,
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [playerRes, historyRes, ratingRes] = await Promise.all([
          fetch(`/api/player/${id}`),
          fetch(`/api/player/${id}/history`),
          fetch(`/api/player/${id}/rating-history?type=DOUBLES`),
        ]);

        if (!playerRes.ok) {
          setError("Player not found or not authenticated");
          router.push("/");
          return;
        }

        const playerData = await playerRes.json();
        const historyData = await historyRes.json();
        const ratingData = await ratingRes.json();

        setPlayer(playerData?.result || playerData);
        setMatches(historyData.matches || []);
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
            <TabsTrigger value="history">Match History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <RatingChart
              data={ratingChartData}
              title={`${player?.fullName || "Player"} - Doubles Rating`}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PartnerTable
                partners={partners.slice(0, 10)}
                onPlayerClick={(pid) => router.push(`/player/${pid}`)}
              />
              <MatchHistory matches={processedMatches.slice(0, 10)} />
            </div>
          </TabsContent>

          <TabsContent value="partners">
            <PartnerTable
              partners={partners}
              onPlayerClick={(pid) => router.push(`/player/${pid}`)}
            />
          </TabsContent>

          <TabsContent value="history">
            <MatchHistory matches={processedMatches} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
