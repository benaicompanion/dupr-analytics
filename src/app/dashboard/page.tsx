"use client";

import { useState, useEffect, useCallback } from "react";
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

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [ratingHistory, setRatingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (!meData.authenticated) {
          router.push("/");
          return;
        }
        setUser(meData.user);
        await loadPlayerData(meData.user.id);
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function loadPlayerData(playerId: number) {
    setLoading(true);
    setError("");
    try {
      const [historyRes, ratingRes] = await Promise.all([
        fetch(`/api/player/${playerId}/history`),
        fetch(`/api/player/${playerId}/rating-history?type=DOUBLES`),
      ]);

      const historyData = await historyRes.json();
      const ratingData = await ratingRes.json();

      setMatches(historyData.matches || []);
      setRatingHistory(ratingData?.result || []);
    } catch {
      setError("Failed to load player data");
    } finally {
      setLoading(false);
    }
  }

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

  function handlePlayerSelect(playerId: number) {
    router.push(`/player/${playerId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your DUPR data...</p>
        </div>
      </div>
    );
  }

  const userId = user?.id;
  const processedMatches = userId ? processMatches(matches, userId) : [];
  const partners = getPartnerStats(processedMatches);
  const timeline = buildRatingTimeline(processedMatches);

  // Use dedicated rating-history API if available, fall back to match-derived timeline
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

  const summary = getSummaryStats(
    processedMatches,
    user?.doublesRating
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={user?.fullName} onSearch={handleSearch} />

      {showSearch && (
        <SearchResults
          results={searchResults}
          loading={searchLoading}
          onSelect={handlePlayerSelect}
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

        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {user?.fullName || "Player"}
          </h1>
          <p className="text-muted-foreground">
            Your pickleball analytics dashboard
          </p>
        </div>

        <SummaryStats stats={summary} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="history">Match History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <RatingChart data={ratingChartData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PartnerTable
                partners={partners.slice(0, 10)}
                onPlayerClick={handlePlayerSelect}
              />
              <MatchHistory matches={processedMatches.slice(0, 10)} />
            </div>
          </TabsContent>

          <TabsContent value="partners">
            <PartnerTable
              partners={partners}
              onPlayerClick={handlePlayerSelect}
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
