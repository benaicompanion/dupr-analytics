"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ClubOption {
  id: number;
  name: string;
}

export function ClubLeaderboard({
  currentUserId,
  onPlayerClick,
  clubs,
}: {
  currentUserId?: number;
  onPlayerClick?: (id: number) => void;
  clubs?: ClubOption[];
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [selectedClubName, setSelectedClubName] = useState<string>("");

  const availableClubs = clubs || [];

  useEffect(() => {
    if (availableClubs.length > 0 && !selectedClubId) {
      setSelectedClubId(String(availableClubs[0].id));
      setSelectedClubName(availableClubs[0].name);
    }
  }, [availableClubs, selectedClubId]);

  useEffect(() => {
    if (!selectedClubId) return;

    async function fetchMembers() {
      setLoading(true);
      setError("");
      setMembers([]);
      try {
        const res = await fetch(`/api/club/${selectedClubId}/members`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch (${res.status})`);
        }
        const data = await res.json();
        setMembers(data.members || []);
      } catch (e: any) {
        setError(e.message || "Failed to load club members");
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [selectedClubId]);

  function handleClubChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedClubId(id);
    const club = availableClubs.find((c) => String(c.id) === id);
    setSelectedClubName(club?.name || "");
  }

  // Extract rating and sort
  const sorted = members
    .map((m: any) => ({
      id: m.id,
      name: m.fullName || "Unknown",
      doublesRating: m.doubles != null ? Number(m.doubles) : null,
      singlesRating: m.singles != null ? Number(m.singles) : null,
      imageUrl: m.imageUrl,
    }))
    .filter((m) => m.doublesRating != null && !isNaN(m.doublesRating) && m.doublesRating > 0)
    .sort((a, b) => (b.doublesRating ?? 0) - (a.doublesRating ?? 0));

  const currentUserRank = sorted.findIndex(
    (m) => currentUserId != null && m.id === currentUserId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-3">
          <span>🏆 Club Leaderboard</span>
          {availableClubs.length > 0 && (
            <select
              value={selectedClubId}
              onChange={handleClubChange}
              className="text-sm font-normal bg-background border border-border rounded-md px-3 py-1.5 text-foreground"
            >
              {availableClubs.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </CardTitle>
        {currentUserRank >= 0 && (
          <p className="text-sm text-muted-foreground">
            Your rank: <span className="text-green-400 font-medium">#{currentUserRank + 1}</span> of {sorted.length} members
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
            <span className="text-muted-foreground">Loading club members...</span>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-center py-8">{error}</p>
        )}

        {!loading && !error && sorted.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            {availableClubs.length === 0
              ? "No clubs found in your match history."
              : "No members with doubles ratings found."}
          </p>
        )}

        {!loading && !error && sorted.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Doubles DUPR</TableHead>
                <TableHead className="text-right">Singles DUPR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((m, i) => {
                const isCurrentUser = currentUserId != null && m.id === currentUserId;
                return (
                  <TableRow
                    key={m.id}
                    className={`${
                      isCurrentUser ? "bg-green-600/10 border-l-2 border-l-green-500" : ""
                    } ${onPlayerClick ? "cursor-pointer hover:bg-muted/50" : ""}`}
                    onClick={() => onPlayerClick?.(m.id)}
                  >
                    <TableCell className="font-mono">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </TableCell>
                    <TableCell className="font-medium">
                      {m.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-green-400">(You)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-400">
                      {m.doublesRating?.toFixed(2) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-teal-400">
                      {m.singlesRating?.toFixed(2) ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
