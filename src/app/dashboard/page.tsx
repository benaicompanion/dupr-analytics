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
  getSummaryStats,
} from "@/lib/analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [doublesRatingHistory, setDoublesRatingHistory] = useState<any[]>([]);
  const [singlesRatingHistory, setSinglesRatingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rawMatchCount, setRawMatchCount] = useState(0);
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

  async function fetchAllMatches(playerId: number): Promise<any[]> {
    const allMatches: any[] = [];
    let offset = 0;
    const limit = 25; // DUPR API max is 25
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `/api/player/${playerId}/history?offset=${offset}&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errText = await res.text();
          setError(`Fetch failed (${res.status}): ${errText}`);
          break;
        }
        const data = await res.json();
        if (data.error) {
          setError(`Match history error: ${data.error}`);
          break;
        }
        const hits = data.matches || [];
        allMatches.push(...hits);
        hasMore = data.hasMore === true;
        offset += limit;
      } catch (err: any) {
        setError(`Fetch exception: ${err?.message || String(err)}`);
        break;
      }
    }

    return allMatches;
  }

  async function loadPlayerData(playerId: number) {
    setLoading(true);
    setError("");
    try {
      // Fetch rating histories in parallel, then paginate match history
      const [doublesRatingRes, singlesRatingRes] = await Promise.all([
        fetch(`/api/player/${playerId}/rating-history?type=DOUBLES`),
        fetch(`/api/player/${playerId}/rating-history?type=SINGLES`),
      ]);

      const doublesRatingData = await doublesRatingRes.json();
      const singlesRatingData = await singlesRatingRes.json();

      setDoublesRatingHistory(doublesRatingData?.result?.ratingHistory || []);
      setSinglesRatingHistory(singlesRatingData?.result?.ratingHistory || []);

      // Paginate match history client-side to avoid server timeout
      const allMatches = await fetchAllMatches(playerId);
      console.log(`Loaded ${allMatches.length} total matches for player ${playerId}`);
      setRawMatchCount(allMatches.length);
      setMatches(allMatches);
    } catch (err) {
      console.error("Failed to load player data:", err);
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

  // Build chart data from rating history API
  const toChartData = (history: any[]) =>
    history
      .map((r: any) => ({
        date: r.date || r.matchDate,
        rating: r.rating,
      }))
      .filter((r: any) => r.date && r.rating != null)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const doublesChartData = toChartData(doublesRatingHistory);
  const singlesChartData = toChartData(singlesRatingHistory);

  // Current ratings from latest history entry
  const latestDoublesRating = doublesChartData.length > 0
    ? doublesChartData[doublesChartData.length - 1]?.rating
    : null;
  const latestSinglesRating = singlesChartData.length > 0
    ? singlesChartData[singlesChartData.length - 1]?.rating
    : null;

  const summary = getSummaryStats(
    processedMatches,
    latestDoublesRating,
    doublesChartData
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
          {rawMatchCount > 0 && processedMatches.length === 0 && (
            <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-sm">
              Debug: Loaded {rawMatchCount} raw matches but processed 0. User ID: {userId} (type: {typeof userId})
            </div>
          )}
          {rawMatchCount === 0 && !loading && (
            <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-sm">
              Debug: No matches loaded from API. Check network tab for errors.
            </div>
          )}
        </div>

        <SummaryStats stats={summary} singlesRating={latestSinglesRating} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="history">Match History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <RatingChart data={doublesChartData} title="Doubles Rating Over Time" />
            {singlesChartData.length > 0 && (
              <RatingChart data={singlesChartData} title="Singles Rating Over Time" />
            )}
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
