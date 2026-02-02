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

const CLUB_ID = "6927859779";

export function ClubLeaderboard({
  currentUserId,
  onPlayerClick,
}: {
  currentUserId?: number;
  onPlayerClick?: (id: number) => void;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(`/api/club/${CLUB_ID}/members`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMembers(data.members || []);
      } catch (e: any) {
        setError(e.message || "Failed to load club members");
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Denver Pickleball Club Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
            <span className="text-muted-foreground">Loading club members...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Denver Pickleball Club Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-center py-8">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Extract rating and sort
  const sorted = members
    .map((m: any) => {
      const player = m.user || m;
      return {
        id: player.id,
        name: player.fullName || "Unknown",
        doublesRating: player.doubles ?? player.doublesRating ?? player.ratings?.doubles ?? null,
        singlesRating: player.singles ?? player.singlesRating ?? player.ratings?.singles ?? null,
        imageUrl: player.imageUrl,
      };
    })
    .filter((m) => m.doublesRating != null && m.doublesRating > 0)
    .sort((a, b) => (b.doublesRating ?? 0) - (a.doublesRating ?? 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          🏆 Denver Pickleball Club Leaderboard
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({sorted.length} members)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
