"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MatchRecord {
  matchId: string;
  date: string;
  eventFormat: string;
  partner: { name: string; duprId: number } | null;
  opponents: { name: string; duprId: number }[];
  scores: string;
  won: boolean;
  doublesRating: number | null;
  singlesRating: number | null;
  matchSource: string;
}

export function MatchHistory({ matches }: { matches: MatchRecord[] }) {
  const [page, setPage] = useState(0);
  const perPage = 20;
  const totalPages = Math.ceil(matches.length / perPage);
  const displayed = matches.slice(page * perPage, (page + 1) * perPage);

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No match data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Match History{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({matches.length} matches)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Opponents</TableHead>
                <TableHead>Scores</TableHead>
                <TableHead className="text-center">Result</TableHead>
                <TableHead className="text-right">DUPR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((m, i) => (
                <TableRow key={m.matchId || i}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {m.date
                      ? new Date(m.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {m.eventFormat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {m.partner?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {m.opponents.map((o) => o.name).join(" & ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {m.scores}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        m.won
                          ? "bg-green-600/20 text-green-400 border-green-600/30"
                          : "bg-red-600/20 text-red-400 border-red-600/30"
                      }
                    >
                      {m.won ? "W" : "L"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {m.eventFormat === "DOUBLES"
                      ? m.doublesRating?.toFixed(2) ?? "—"
                      : m.singlesRating?.toFixed(2) ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
